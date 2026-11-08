// Upload approved server secrets over stdin, never in command arguments or output.
import { spawnSync } from 'node:child_process';
process.loadEnvFile('.env.local');
for (const name of ['ASSEMBLYAI_API_KEY']) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  const result = spawnSync('vercel', ['env', 'add', name, 'production', '--sensitive'], { input: process.env[name], encoding: 'utf8' });
  if (result.status !== 0) { console.error(`Could not configure ${name}. Inspect Vercel project settings.`); process.exit(1); }
  console.log(`Configured ${name} securely.`);
}
