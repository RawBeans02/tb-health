#!/usr/bin/env bash
# Guard for heavy commands on the owner's 8 GB laptop. Usage: lowmem-run.sh <cmd...>
# One heavy job per machine (lock). Starts only at Memory Used <= 6.3 GB (waits up
# to 2 h). Stops the job above 6.7 GB, above 6.6 GB for 300 s, below 25% free, or
# on CPU heat throttling. Memory Used = anonymous + wired + compressor pages.
set -u
LOCK=/tmp/kitamo-heavy.lock
START_GB=${START_GB:-6.45}; HARD_GB=6.7; SOFT_GB=6.6; SOFT_S=300; MIN_FREE=25
used_gb() { vm_stat | awk '/page size of/{ps=$8} /Anonymous pages/{a=$3} /Pages wired down/{w=$4} /occupied by compressor/{c=$5} END{gsub(/\./,"",a);gsub(/\./,"",w);gsub(/\./,"",c); printf "%.2f", (a+w+c)*ps/1073741824}'; }
free_pct() { memory_pressure 2>/dev/null | awk -F': ' '/free percentage/{gsub(/%/,"",$2); print $2}'; }
throttled() { pmset -g therm 2>/dev/null | awk -F'= ' '/CPU_Speed_Limit/{if ($2+0 < 100) t=1} END{exit !t}'; }
gt() { awk -v a="$1" -v b="$2" 'BEGIN{exit !(a>b)}'; }
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  if [ -f "$LOCK/pid" ] && ! kill -0 "$(cat "$LOCK/pid")" 2>/dev/null; then rm -rf "$LOCK"; continue; fi
  [ $waited -ge 7200 ] && { echo "guard: lock busy for 2 h, giving up"; exit 97; }
  sleep 15; waited=$((waited+15))
done
echo $$ > "$LOCK/pid"; trap 'rm -rf "$LOCK"' EXIT
waited=0
while gt "$(used_gb)" "$START_GB"; do
  [ $waited -ge 7200 ] && { echo "guard: memory stayed above ${START_GB} GB for 2 h ($(used_gb) GB), giving up"; exit 98; }
  [ $((waited % 300)) -eq 0 ] && echo "guard: waiting, Memory Used $(used_gb) GB > ${START_GB} GB"
  sleep 15; waited=$((waited+15))
done
# GUARD_NO_DOCKER=1: a job that needs no Docker (typecheck, lint, vitest) must
# not bring the VM up, which holds ~1-2 GB until Docker quits.
if [ "${GUARD_NO_DOCKER:-0}" != 1 ] && ! docker info >/dev/null 2>&1; then open -a Docker; for i in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 5; done; fi
export E2E_WORKERS=1 NODE_OPTIONS="--max-old-space-size=1536"
echo "guard: start at $(used_gb) GB, free $(free_pct)%"
set -m; nice -n 10 "$@" & child=$!; set +m
peak=0; soft=0; reason=""
while kill -0 $child 2>/dev/null; do
  u=$(used_gb); f=$(free_pct); gt "$u" "$peak" && peak=$u
  if gt "$u" "$HARD_GB"; then reason="Memory Used $u GB > $HARD_GB"; fi
  if gt "$u" "$SOFT_GB"; then soft=$((soft+5)); else soft=0; fi
  [ $soft -ge $SOFT_S ] && reason="Memory Used > $SOFT_GB GB for ${SOFT_S}s"
  [ -n "$f" ] && [ "$f" -lt $MIN_FREE ] && reason="free memory $f% < $MIN_FREE%"
  throttled && reason="CPU heat throttling"
  if [ -n "$reason" ]; then echo "guard: STOPPING ($reason)"; kill -TERM -- -$child 2>/dev/null; sleep 5; kill -KILL -- -$child 2>/dev/null; echo "guard: peak $peak GB"; exit 99; fi
  sleep 5
done
wait $child; rc=$?
echo "guard: done rc=$rc, peak $peak GB"; exit $rc
