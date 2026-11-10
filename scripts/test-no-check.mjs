#!/usr/bin/env node
// The Check-off variant's job (Q9, audit B26): build the shipped list with TBPH_CHECK=false
// (check-links and check-dashes run in the build), run the no-check Playwright project against it, then rebuild
// the other browser projects' fixture, the 93-row sample (npm run build:sample), so later test
// runs find it. Run it on its own guarded job:
//   GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run test:no-check'

import { spawnSync } from 'node:child_process';

const run = (command, args, env = {}) => spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1;

let status = run('npm', ['run', 'build'], { TBPH_CHECK: 'false' });
if (status === 0) status = run('npx', ['playwright', 'test', '--project=no-check']);
const rebuilt = run('npm', ['run', 'build:sample']);
process.exit(status || rebuilt);
