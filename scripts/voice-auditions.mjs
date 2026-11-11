import { spawnSync } from 'node:child_process';
const text = 'I need a little more time, but I want to answer this in my own words.';
for (const voice of ['peter', 'carrie', 'yasmin', 'titus']) {
  const run = spawnSync(process.execPath, ['scripts/verify-provider.mjs', text, 'english', `voice-${voice}`, `aai-${voice}`], { env: process.env, encoding: 'utf8' });
  if (run.status !== 0) { process.stderr.write(run.stderr || 'Voice synthesis failed.'); process.exit(run.status || 1); }
  const result = JSON.parse(run.stdout.trim());
  console.log(JSON.stringify({ voice: result.voice, durationMs: result.durationMs, wordTimingReceived: result.wordTimingReceived }));
}
