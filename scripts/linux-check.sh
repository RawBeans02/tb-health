#!/bin/bash
# The Linux check (decisions.md D22, amended 6 Nov 2026): runs the steps of
# .github/workflows/ci.yml, in its order, in Docker on the Mac, one guarded job per step. It
# mirrors ci.yml step for step, so change the two together.
#
#   scripts/linux-check.sh <commit>                 full run, in a new volume holding <commit>
#   scripts/linux-check.sh --from <step> <commit>   rerun from <step>, in the volume a full run filled
#
# Steps: fill, npm-ci, check, unit, build, chromium, webkit, pwa, phones, no-check, audit.
# unit-1worker (npm test -- --maxWorkers=1) runs after unit only if unit was killed for memory.
#
# How it differs from ci.yml on GitHub:
# - Platform: arm64 Linux in Docker Desktop's VM, with the Playwright image's fonts and
#   libraries, running as root.
# - No `npx playwright install --with-deps`: the image's 1.64.1 browsers and packages stand in.
# - git archive into a Docker volume instead of checkout. The official Node build that .nvmrc
#   names is mounted read-only instead of setup-node.
# - Playwright runs from node_modules/.bin, not npx, so only npm ci and npm audit reach the
#   registry (test:no-check's own npx finds the same local copy, checked before each step).
# - Later steps still run after a failed test step; ci.yml stops at the first failure, except
#   for the audit.
# - Each container gets 1,400 MB with no swap and a 1 GB Node heap.
# As on GitHub's 4-vCPU runner: Playwright's 1 worker (no E2E_WORKERS) and Vitest's 3 forks.
#
# One-time setup (docs/HANDOVER.md, "Linux check on the Mac"): pull IMAGE by its digest, and put
# Node's linux tarball, its SHASUMS256.txt and the extracted tree in
# $TBH_LINUX_CHECK_HOME/node/v<version>/. TBH_LINUX_CHECK_HOME defaults to ~/tbh-linux-check;
# it can't be in the repo or a temporary folder. Each run writes to a new folder there,
# runs/<sha12>-<UTC time>/: linux-check.log, summary.tsv and a folder per step.
#
# Memory: each Docker job (the fill, then each step) goes through _handoff/lowmem-run.sh, the
# shared guard, and never nests it. Before each job, without the lock, the script waits until
# Memory Used plus what Docker's VM can still grow (its RAM minus the part resident on the Mac)
# is at most the guard's soft limit minus 0.15 GB. It gives the guard that same level, or the
# guard's own if lower, as START_GB.
# Nothing starts while another container runs, and a container that starts mid-step stops ours.
#
# To stop a run: docker stop tbh-linux-ci. Ctrl-C works too: it stops the container first, then
# waits for the guard to end. Never kill the guard: that frees the shared lock while the step
# runs on.
#
# Exit codes:
#   0        every step passed
#   1        a step failed (the run carries on after a failed test step, but stops after a
#            failed fill or npm ci)
#   2        usage, or a missing prerequisite: nothing ran
#   90       a container named tbh-linux-ci already exists
#   91       another container is running, or one started during a step
#   92       the volume: it exists before a full run, or on a rerun it's missing or isn't
#            marked as holding <commit>
#   93       provenance: Node, Playwright, the volume's file list or Node's checksum doesn't match
#   97 98 99 the guard: lock busy for 2 h, memory high for 2 h (also this script's wait before
#            the lock), or it stopped the step
#   125      a Docker error
#   143      the container was stopped from outside (137 without OOMKilled too)
#   129 130  this script got HUP or INT (143 for TERM)
# A kill for memory shows as OOMKilled=true or oom_kill > 0 in the step's results, whatever the
# exit code: the kernel usually kills a browser or a Vitest fork, and the step then exits 1.
set -u

IMAGE=mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f
IMAGE_PW=1.64.1   # the Playwright version in IMAGE's tag
NAME=tbh-linux-ci
STEPS="npm-ci check unit build chromium webkit pwa phones no-check audit"
SELF="$(cd "$(dirname "$0")" && pwd -P)/$(basename "$0")"
REPO=$(git -C "$(dirname "$SELF")" rev-parse --show-toplevel) || exit 2
GUARD=$REPO/_handoff/lowmem-run.sh

utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }
say() { echo "linux-check: $*"; }
die() { echo "linux-check: $1" >&2; exit "${2:-2}"; }

# Each step's command in the container. ci.yml's npx becomes node_modules/.bin.
step_cmd() {
  case $1 in
    npm-ci) echo 'uname -m; . /etc/os-release && echo "$PRETTY_NAME"; id; echo "image node: $(/usr/bin/node -v 2>/dev/null || echo none)"; echo "fonts: $(fc-list | wc -l) files; Arial: $(fc-match Arial)"; npm ci' ;;
    check) echo 'npm run check' ;;
    unit) echo 'npm test' ;;
    unit-1worker) echo 'npm test -- --maxWorkers=1' ;;
    build) echo 'npm run build && npm run build:sample' ;;
    chromium) echo 'node_modules/.bin/playwright test --project=chromium' ;;
    webkit) echo 'node_modules/.bin/playwright test --project=webkit' ;;
    pwa) echo 'node_modules/.bin/playwright test --project=pwa' ;;
    phones) echo 'node_modules/.bin/playwright test --project=iphone --project=pixel' ;;
    no-check) echo 'npm run test:no-check' ;;
    audit) echo 'npm audit --omit=dev' ;;
    *) return 1 ;;
  esac
}

# Runs in /w/tree in each step's container. $1 the commit, $2 the image's Playwright version,
# $3 when to check Playwright (before or after the command), $4 the command.
read -r -d '' IN_CONTAINER <<'EOF'
sha=$1 pw=$2 when=$3 cmd=$4
say() { echo "linux-check: $*"; }
for d in playwright-report test-results; do
  [ -e "$d" ] && mkdir -p /out/left-from-earlier && mv "$d" /out/left-from-earlier/ && say "moved an earlier $d to left-from-earlier/"
done
node_ok() {
  [ "$(cat /w/linux-check.marker 2>/dev/null)" = "$sha" ] || { say "the volume isn't marked as holding $sha"; return 92; }
  [ "$(command -v node)" = /opt/node/bin/node ] || { say "node is '$(command -v node)', not /opt/node/bin/node"; return 93; }
  want=v$(tr -d '[:space:]' < .nvmrc)
  [ "$(node -v)" = "$want" ] || { say "node -v is $(node -v); .nvmrc asks for $want"; return 93; }
  say "node $(node -v) from /opt/node, npm $(npm -v)"
}
playwright_ok() {
  cli=$(node_modules/.bin/playwright --version 2>&1)
  pkg=$(node -p 'require("./node_modules/@playwright/test/package.json").version' 2>&1)
  [ "$cli" = "Version $pw" ] && [ "$pkg" = "$pw" ] || { say "Playwright: CLI '$cli', @playwright/test '$pkg', image $pw"; return 93; }
  say "Playwright $pw: the CLI, @playwright/test and the image agree"
}
main() {
  node_ok || return
  if [ "$when" = before ]; then playwright_ok || return; fi
  eval "$cmd" || return
  if [ "$when" = after ]; then playwright_ok || return; fi
  return 0
}
main; rc=$?
{ echo "memory.peak $(cat /sys/fs/cgroup/memory.peak 2>/dev/null || echo n/a)"; cat /sys/fs/cgroup/memory.events 2>/dev/null; } > /out/cgroup.txt
for d in playwright-report test-results; do
  if [ -e "$d" ]; then mv "$d" /out/ || say "couldn't move $d to the results"; fi
done
exit $rc
EOF

# Running containers other than ours, one per line. Fails if docker ps fails: that counts as
# unsafe, never as "nothing running".
others_running() {
  local names
  names=$(docker ps --format '{{.Names}}') || return 1
  printf '%s\n' "$names" | grep -vx -e "$NAME" -e ''
  return 0
}
name_exists() {
  local names
  names=$(docker ps -a --format '{{.Names}}') || return 2
  printf '%s\n' "$names" | grep -qx "$NAME"
}
inspect_to() { docker inspect -f 'ExitCode={{.State.ExitCode}} OOMKilled={{.State.OOMKilled}}' "$NAME" > "$1" 2>&1; }

# ---- Inner mode: one Docker job, run only by the guard. -------------------------------------
if [ "${1:-}" = __job ]; then
  [ -n "${E2E_WORKERS:-}" ] || die "__job runs only under _handoff/lowmem-run.sh"
  [ $# -eq 5 ] || die "__job takes <step> <results> <sha> <node tree>"
  STEP=$2 RUN_DIR=$3 SHA=$4 NODE_TREE=$5
  [ "$STEP" = fill ] || step_cmd "$STEP" >/dev/null || die "unknown step: $STEP"
  VOL=tbh-linux-ci-$SHA; out=$RUN_DIR/$STEP
  # The guard stops a job with TERM to its process group, which reaches docker run too. The
  # script that started the guard removes the container afterwards.
  trap 'docker stop -t 3 "$NAME" >/dev/null 2>&1; exit 143' TERM INT HUP
  refuse() { say "$2" | tee "$out/refused.txt"; exit "$1"; }

  others=$(others_running) || refuse 125 "docker ps failed; not starting $STEP"
  [ -z "$others" ] || refuse 91 "other containers are running: $(echo $others); not starting $STEP"
  name_exists; case $? in 0) refuse 90 "a container named $NAME exists; not starting $STEP" ;; 2) refuse 125 "docker ps -a failed" ;; esac
  [ -e "$RUN_DIR/stop-requested.txt" ] && refuse 143 "a stop was requested; not starting $STEP"

  if [ "$STEP" = fill ]; then
    docker volume inspect "$VOL" >/dev/null 2>&1 && refuse 92 "the volume $VOL already exists"
    docker volume create "$VOL" >/dev/null || refuse 125 "couldn't create the volume $VOL"
    # Straight from git into Linux's tar, so file names never pass through the Mac's
    # case-insensitive file system.
    ( set -o pipefail
      git -C "$REPO" archive "$SHA" | docker run -i --rm --name "$NAME" --network none \
        --memory 1400m --memory-swap 1400m -v "$VOL:/w" "$IMAGE" sh -c 'mkdir /w/tree && tar -x -C /w/tree'
    ) || { say "the fill failed"; exit 1; }
    ( set -o pipefail; git -C "$REPO" ls-tree -r -z --name-only "$SHA" | tr '\0' '\n' | LC_ALL=C sort > "$out/expected.txt" ) ||
      { say "git ls-tree failed"; exit 1; }
    ( set -o pipefail
      docker run --rm --name "$NAME" --network none --memory 1400m --memory-swap 1400m -v "$VOL:/w" -w /w/tree \
        "$IMAGE" find . \( -type f -o -type l \) -printf '%P\n' | LC_ALL=C sort > "$out/actual.txt"
    ) || { say "couldn't list the volume's files"; exit 1; }
    n=$(wc -l < "$out/actual.txt" | tr -d ' ')
    if [ "$n" -eq 0 ] || ! diff "$out/expected.txt" "$out/actual.txt" > "$out/diff.txt"; then
      say "the volume's files differ from git's list for $SHA (diff.txt)"; exit 93
    fi
    docker run --rm --name "$NAME" --network none -v "$VOL:/w" "$IMAGE" \
      sh -c 'printf "%s\n" "$1" > /w/linux-check.marker' sh "$SHA" || { say "couldn't write the marker"; exit 1; }
    say "$VOL holds $SHA: $n files, the same list as git; marker written"
    exit 0
  fi

  docker volume inspect "$VOL" >/dev/null 2>&1 || refuse 92 "the volume $VOL is missing"
  [ "$STEP" = npm-ci ] && when=after || when=before
  docker run --name "$NAME" --init --ipc=host --memory 1400m --memory-swap 1400m \
    -e CI=true -e NODE_OPTIONS=--max-old-space-size=1024 \
    -e PATH=/opt/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    -e npm_config_update_notifier=false -e npm_config_fund=false \
    -v "$VOL:/w" -v "$NODE_TREE:/opt/node:ro" -v "$out:/out" -w /w/tree \
    "$IMAGE" bash -c "$IN_CONTAINER" linux-check "$SHA" "$IMAGE_PW" "$when" "$(step_cmd "$STEP")" \
    > "$out/log.txt" 2>&1 &
  pid=$!
  # Watch while the step runs: the rule against sharing the VM holds for the whole step.
  why=
  while kill -0 "$pid" 2>/dev/null; do
    sleep 5
    kill -0 "$pid" 2>/dev/null || break
    if [ -e "$RUN_DIR/stop-requested.txt" ]; then why=143 reason="a stop was requested"
    elif ! kill -0 "$PPID" 2>/dev/null; then why=99 reason="the guard ended during the step"
    elif ! others=$(others_running); then why=125 reason="docker ps failed during the step"
    elif [ -n "$others" ]; then why=91 reason="containers started during the step: $(echo $others)"
    fi
    if [ -n "$why" ]; then
      say "$reason; stopping $NAME" | tee "$out/stopped.txt"
      docker stop "$NAME" >/dev/null 2>&1
      break
    fi
  done
  wait "$pid"; rc=$?
  [ -n "$why" ] && rc=$why
  inspect_to "$out/exit.txt"
  docker rm "$NAME" >/dev/null 2>&1 || say "couldn't remove $NAME"
  say "$STEP: rc=$rc $(cat "$out/exit.txt")"
  exit $rc
fi

# ---- Outer mode: checks, then one guarded job per step. -------------------------------------
[ -z "${E2E_WORKERS:-}" ] || die "E2E_WORKERS is set, so this looks like it runs under the guard. Run it directly; it calls the guard itself."
unset GUARD_NO_DOCKER
usage="usage: scripts/linux-check.sh [--from <step>] <commit>; steps: $STEPS"
FROM=
if [ "${1:-}" = --from ]; then
  [ $# -eq 3 ] && [ -n "$2" ] || die "$usage"
  FROM=$2; shift 2
fi
[ $# -eq 1 ] || die "$usage"
SHA=$(git -C "$REPO" rev-parse --verify --quiet "$1^{commit}") || die "not a commit: $1"
QUEUE=fill
if [ -n "$FROM" ]; then
  QUEUE=; on=
  for s in $STEPS; do [ "$s" = "$FROM" ] && on=1; [ -n "$on" ] && QUEUE="$QUEUE $s"; done
  [ -n "$QUEUE" ] || die "unknown step: $FROM. $usage"
  QUEUE=${QUEUE# }
else
  QUEUE="fill $STEPS"
fi
VOL=tbh-linux-ci-$SHA

info=$(docker info -f '{{.MemTotal}} {{.Architecture}} {{.ServerVersion}} {{.NCPU}}' 2>/dev/null) ||
  die "Docker isn't running: start Docker Desktop first"
set -- $info; VM_BYTES=$1 VM_ARCH=$2 DOCKER_VER=$3 VM_CPUS=$4
case $VM_ARCH in aarch64|arm64) NARCH=arm64 ;; x86_64|amd64) NARCH=x64 ;; *) die "unknown Docker architecture: $VM_ARCH" ;; esac
VM_GB=$(awk -v b="$VM_BYTES" 'BEGIN{printf "%.2f", b/1073741824}')

HOME_DIR=${TBH_LINUX_CHECK_HOME:-$HOME/tbh-linux-check}
[ -d "$HOME_DIR" ] || die "$HOME_DIR doesn't exist: do the one-time setup first (docs/HANDOVER.md)"
HOME_DIR=$(cd "$HOME_DIR" && pwd -P)
lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
case "$(lower "$HOME_DIR")/" in
  "$(lower "$(cd "$REPO" && pwd -P)")"/*) die "$HOME_DIR is inside the repo: results would mix with the code" ;;
  /tmp/*|/private/tmp/*|/var/folders/*|/private/var/folders/*) die "$HOME_DIR is a temporary folder: macOS deletes its files" ;;
esac

NODE_VER=$(git -C "$REPO" show "$SHA:.nvmrc" 2>/dev/null | tr -d '[:space:]'); NODE_VER=${NODE_VER#v}
[ -n "$NODE_VER" ] || die "$SHA has no .nvmrc"
NODE_HOME=$HOME_DIR/node/v$NODE_VER
TARBALL=node-v$NODE_VER-linux-$NARCH.tar.xz
NODE_TREE=$NODE_HOME/node-v$NODE_VER-linux-$NARCH
[ -f "$NODE_HOME/$TARBALL" ] && [ -f "$NODE_HOME/SHASUMS256.txt" ] && [ -x "$NODE_TREE/bin/node" ] ||
  die "Node $NODE_VER for linux-$NARCH isn't set up in $NODE_HOME (docs/HANDOVER.md)"
NODE_SUM=$(shasum -a 256 "$NODE_HOME/$TARBALL" | awk '{print $1}')
[ "$NODE_SUM" = "$(awk -v f="$TARBALL" '$2 == f {print $1}' "$NODE_HOME/SHASUMS256.txt")" ] ||
  die "$TARBALL doesn't match its line in SHASUMS256.txt" 93

IMAGE_ID=$(docker image inspect -f '{{.Id}} {{.Os}}/{{.Architecture}}' "$IMAGE" 2>/dev/null) ||
  die "the image isn't here: pull it by its digest first (docs/HANDOVER.md)"

GUARD_START=$(sed -n 's/^START_GB=\${START_GB:-\([0-9.]*\)}.*/\1/p' "$GUARD")
GUARD_SOFT=$(sed -n 's/.*[; ]SOFT_GB=\([0-9.]*\).*/\1/p' "$GUARD")
GUARD_HARD=$(sed -n 's/.*[; ]HARD_GB=\([0-9.]*\).*/\1/p' "$GUARD")
[ -n "$GUARD_START" ] && [ -n "$GUARD_SOFT" ] && [ -n "$GUARD_HARD" ] || die "couldn't read the guard's levels from $GUARD"

RUN_DIR=$HOME_DIR/runs/$(printf %.12s "$SHA")-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$HOME_DIR/runs" && mkdir "$RUN_DIR" 2>/dev/null || die "couldn't make a new results folder $RUN_DIR"
LOG=$RUN_DIR/linux-check.log
SUMMARY=$RUN_DIR/summary.tsv
log() { local line; line="$(utc) $*"; printf '%s\n' "$line" >> "$LOG"; printf '%s\n' "$line" 2>/dev/null; }

# The guard's own measure of Memory Used (anonymous + wired + compressor pages).
used_gb() { vm_stat | awk '/page size of/{ps=$8} /Anonymous pages/{a=$3} /Pages wired down/{w=$4} /occupied by compressor/{c=$5} END{gsub(/\./,"",a);gsub(/\./,"",w);gsub(/\./,"",c); printf "%.2f", (a+w+c)*ps/1073741824}'; }
# How much of Docker's VM process is resident on the Mac, in GB, then how it was read. Not its
# footprint (top's MEM): that also counts pages macOS has compressed, which come back into
# Memory Used as the VM uses them (6 Nov 2026: footprint 2.01 GB, resident 0.3-0.4 GB). 0 when
# no VM process runs (Resource Saver stopped it) or when it can't be told apart: the VM is then
# counted as still to grow by all of its RAM.
vm_resident() {
  local pids n gb
  pids=$(ps -axo pid=,comm= | awk '{p=$1; sub(/^ *[0-9]+ +/, ""); if ($0 ~ /\/(com\.apple\.Virtualization\.VirtualMachine|com\.docker\.krun|qemu-system-[^\/]*)$/) print p}')
  n=$(printf '%s\n' "$pids" | grep -c '[0-9]')
  [ "$n" -eq 0 ] && { echo "0 no VM process"; return; }
  [ "$n" -eq 1 ] || { echo "0 $n VM processes"; return; }
  gb=$(ps -o rss= -p "$pids" | awk '$1 ~ /^[0-9]+$/ {printf "%.2f", $1/1048576}')
  [ -n "$gb" ] && echo "$gb VM pid $pids: $gb GB resident" || echo "0 no reading from ps"
}
# Waits, without the lock, until Memory Used + G <= the guard's soft limit - 0.15, where G is
# what the VM can still grow (its RAM minus its resident part). Sets USED, G, BAR (the level Memory
# Used must be under) and START (passed to the guard as START_GB: BAR or the guard's start
# level, whichever is lower). Gives up after 2 h.
wait_for_room() {
  local waited=0 fp how calc ok
  while :; do
    USED=$(used_gb)
    set -- $(vm_resident); fp=$1; shift; how=$*
    calc=$(awk -v u="$USED" -v vm="$VM_GB" -v fp="$fp" -v soft="$GUARD_SOFT" -v gs="$GUARD_START" 'BEGIN{
      g = vm - fp; if (g < 0) g = 0; bar = int((soft - 0.15 - g) * 100 + 1e-6) / 100; s = (bar < gs) ? bar : gs
      printf "%.2f %.2f %.2f %d", g, bar, s, (u <= bar)}')
    set -- $calc; G=$1 BAR=$2 START=$3 ok=$4
    [ "$ok" = 1 ] && { HOW=$how; return 0; }
    [ "$waited" -ge 7200 ] && { log "Memory Used stayed above the bar for 2 h (now $USED GB, bar $BAR GB, $how)"; return 98; }
    [ $((waited % 300)) -eq 0 ] && log "waiting, without the lock: Memory Used $USED GB, VM still to grow $G GB ($how), so the bar is $BAR GB"
    sleep 30; waited=$((waited + 30))
  done
}

# After a job: remove our container if it's still there (a guard stop or an interruption), and
# record its state first.
cleanup_container() {
  name_exists
  case $? in
    1) return 0 ;;
    2) log "WARNING: docker ps -a failed: check for a container named $NAME by hand"; return 0 ;;
  esac
  log "$NAME is still there after the guard ended: stopping and removing it"
  docker stop "$NAME" >/dev/null 2>&1
  inspect_to "$1/exit-after-guard.txt"
  docker rm "$NAME" >/dev/null 2>&1 || { name_exists && log "WARNING: couldn't remove $NAME: remove it by hand (docker rm $NAME)"; }
}

# Reads a finished job's results: EC (ExitCode), OOMK (OOMKilled), KILLS (oom_kill), PEAK
# (memory.peak in MB), GPEAK (the guard's peak) and NOTE (the last guard or script message).
# OOM is 1 if the container was killed for memory, whatever the exit code.
read_results() {
  local out=$RUN_DIR/$1
  EC=$(cat "$out/exit.txt" "$out/exit-after-guard.txt" 2>/dev/null | sed -n 's/^ExitCode=\([0-9-]*\).*/\1/p' | head -1)
  OOMK=$(cat "$out/exit.txt" "$out/exit-after-guard.txt" 2>/dev/null | grep -o 'OOMKilled=[a-z]*' | cut -d= -f2 | sort -u | tr '\n' ' ')
  OOMK=${OOMK% }
  KILLS=$(awk '$1 == "oom_kill" {print $2}' "$out/cgroup.txt" 2>/dev/null)
  PEAK=$(awk '$1 == "memory.peak" && $2 ~ /^[0-9]+$/ {printf "%d", $2/1048576}' "$out/cgroup.txt" 2>/dev/null)
  GPEAK=$(sed -n 's/.*peak \([0-9.]*\) GB.*/\1/p' "$out/guard.txt" 2>/dev/null | tail -1)
  NOTE=$(grep -h -E 'guard: STOPPING|giving up|^linux-check: ' "$out/guard.txt" 2>/dev/null | grep -v ": $1: rc=" | tail -1)
  OOM=0
  case "$OOMK" in *true*) OOM=1 ;; esac
  [ "${KILLS:-0}" -gt 0 ] 2>/dev/null && OOM=1
}

# One summary row and log line per job: <step> <rc> <result>, after read_results.
record() {
  local secs=$(( $(date +%s) - T0 ))
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "${EC:--}" "${OOMK:--}" "${KILLS:--}" \
    "${PEAK:--}" "$START_UTC" "$(utc)" "$secs" "${GPEAK:--}" "${USED:--}" "${G:--}" "${START:--}" "${NOTE:--}" >> "$SUMMARY"
  log "$1: $3; rc=$2, ExitCode=${EC:--}, OOMKilled=${OOMK:--}, oom_kill=${KILLS:--}, memory.peak ${PEAK:--} MB, guard peak ${GPEAK:--} GB, ${secs}s${NOTE:+; $NOTE}"
}

finish() {
  local rc=$1
  log "finished: exit $rc"
  name_exists
  case $? in
    0) log "WARNING: a container named $NAME is still there" ;;
    1) log "no container named $NAME is left" ;;
    *) log "WARNING: docker ps -a failed: check for a container named $NAME by hand" ;;
  esac
  log "the volume $VOL is kept for review; to remove it afterwards: docker volume rm $VOL"
  log "results: $RUN_DIR"
  exit "$rc"
}

GUARD_PID= CUR_STEP= T0=$(date +%s) START_UTC=$(utc) USED= G= START=
on_signal() {
  trap '' INT TERM HUP
  log "got SIG$1: stopping"
  echo "SIG$1 at $(utc)" > "$RUN_DIR/stop-requested.txt"
  if [ -n "$GUARD_PID" ]; then
    if grep -q '^guard: start at' "$RUN_DIR/$CUR_STEP/guard.txt" 2>/dev/null; then
      # The job is running: stop its container. The guard keeps the lock until the job ends.
      docker stop "$NAME" >/dev/null 2>&1
    else
      # The guard is still waiting for the lock or memory, so no container runs yet. The job
      # checks for stop-requested.txt before it starts one.
      kill -TERM -- "-$GUARD_PID" 2>/dev/null
    fi
    wait "$GUARD_PID"; rc=$?
    GUARD_PID=
    cleanup_container "$RUN_DIR/$CUR_STEP"
    read_results "$CUR_STEP"
    record "$CUR_STEP" "$rc" stopped
  fi
  finish "$2"
}
trap 'on_signal INT 130' INT
trap 'on_signal TERM 143' TERM
trap 'on_signal HUP 129' HUP

printf 'step\trc\tresult\tExitCode\tOOMKilled\toom_kill\tmemory.peak MB\tstart\tend\tseconds\tguard peak GB\tMemory Used before GB\tVM to grow GB\tSTART_GB\tnote\n' > "$SUMMARY"
rel=${SELF#"$(cd "$REPO" && pwd -P)"/}
log "Linux check of $SHA${FROM:+, from $FROM}"
last=$(git -C "$REPO" log -1 --format='%H %cs' -- "$rel" 2>/dev/null)
changed=$(git -C "$REPO" status --porcelain -- "$rel" 2>/dev/null)
log "script: $rel, last committed in ${last:-no commit}, ${changed:+CHANGED since}${changed:-unchanged since}"
log "commit on remote-tracking branches (local refs, no fetch): $(git -C "$REPO" branch -r --contains "$SHA" 2>/dev/null | tr -d ' ' | tr '\n' ' ')"
log "image: $IMAGE, ID $IMAGE_ID"
log "Docker $DOCKER_VER: VM $VM_GB GB, $VM_CPUS CPUs, $VM_ARCH; Mac: macOS $(sw_vers -productVersion 2>/dev/null), $(uname -m)"
log "Node $NODE_VER: $TARBALL sha256 $NODE_SUM, matches SHASUMS256.txt; tree $NODE_TREE"
log "guard: start $GUARD_START GB, soft $GUARD_SOFT GB, hard $GUARD_HARD GB; this script's bar: soft - 0.15 - what the VM can still grow"
log "steps: $QUEUE"

STOP= FAILED= first=1
while [ -n "$QUEUE" ]; do
  STEP=${QUEUE%% *}; [ "$STEP" = "$QUEUE" ] && QUEUE= || QUEUE=${QUEUE#* }
  [ -n "$first" ] || sleep 30   # the guard retries every 15 s: jobs queued for the lock get a turn
  first=
  CUR_STEP=$STEP out=$RUN_DIR/$STEP T0=$(date +%s) START_UTC=$(utc) USED= G= START=
  mkdir "$out" || { STOP=2; break; }

  # The same checks the job makes, here without the lock, so a refusal doesn't take it.
  rc=0
  if ! others=$(others_running); then rc=125 msg="docker ps failed"
  elif [ -n "$others" ]; then rc=91 msg="other containers are running: $(echo $others)"
  else
    name_exists; case $? in 0) rc=90 msg="a container named $NAME exists" ;; 2) rc=125 msg="docker ps -a failed" ;; esac
  fi
  if [ $rc = 0 ]; then
    if docker volume inspect "$VOL" >/dev/null 2>&1; then
      [ "$STEP" = fill ] && rc=92 msg="the volume $VOL already exists: a full run needs a new one (docker volume rm $VOL, after review)"
    else
      [ "$STEP" = fill ] || rc=92 msg="the volume $VOL is missing: rerun from the start"
    fi
  fi
  if [ $rc != 0 ]; then
    echo "$msg" > "$out/refused.txt"; log "not starting $STEP: $msg"
    read_results "$STEP"; record "$STEP" "$rc" refused; STOP=$rc; break
  fi
  wait_for_room || { rc=$?; read_results "$STEP"; record "$STEP" "$rc" stopped; STOP=$rc; break; }

  log "$STEP: starting; Memory Used $USED GB, VM still to grow $G GB ($HOW), bar $BAR GB, START_GB $START"
  # The guard gets its own process group, so Ctrl-C reaches only this script, whose trap stops
  # the container before the guard can free the lock.
  set -m
  START_GB=$START "$GUARD" "$SELF" __job "$STEP" "$RUN_DIR" "$SHA" "$NODE_TREE" > "$out/guard.txt" 2>&1 &
  GUARD_PID=$!
  set +m
  wait "$GUARD_PID"; rc=$?
  GUARD_PID=
  cleanup_container "$out"

  read_results "$STEP"
  case $rc in
    0) result=passed ;;
    2|90|91|92|93|97|98|99|125|143) result=stopped ;;
    137) [ "$OOM" = 1 ] && result=failed || result=stopped ;;
    *) result=failed ;;
  esac
  [ "$result" = failed ] && [ "$OOM" = 1 ] && result="failed, killed for memory"
  record "$STEP" "$rc" "$result"
  case $result in
    stopped) STOP=$rc; break ;;
    failed*)
      FAILED=1
      case $STEP in fill|npm-ci) log "$STEP failed: stopping"; STOP=$rc; break ;; esac
      [ "$STEP" = unit ] && [ "$OOM" = 1 ] && { QUEUE="unit-1worker${QUEUE:+ $QUEUE}"; log "unit was killed for memory: unit-1worker runs next"; }
      ;;
  esac
done

[ -n "$STOP" ] && finish "$STOP"
[ -n "$FAILED" ] && finish 1
finish 0
