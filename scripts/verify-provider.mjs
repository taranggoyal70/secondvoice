import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const text = process.argv[2] || 'I need a little more time, but I want to answer this in my own words.';
const language = process.argv[3] || 'english';
const name = process.argv[4] || language;
if (!/^[a-z-]+$/.test(name)) throw new Error('Invalid output name');
const voice = process.argv[5] || (language === 'spanish' ? 'aai-constanza' : 'aai-peter');
if (!/^aai-[a-z]+$/.test(voice)) throw new Error('Invalid catalog voice');
const response = await fetch('https://token.us.assemblyai.com/v1/token', {
  method: 'POST', headers: { Authorization: process.env.ASSEMBLYAI_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ product: 'tts', expires_in_seconds: 60, max_session_duration_seconds: 120 }),
  signal: AbortSignal.timeout(15000),
});
const payload = await response.json();
if (!response.ok || !payload.token) throw new Error(`Token service returned ${response.status}`);
const query = new URLSearchParams({ token: payload.token, voice_id: voice, language, sample_rate: '24000', encoding: 'pcm_s16le', word_boundaries: 'true' });
const socket = new WebSocket(`wss://tts.us.assemblyai.com/v1/ws?${query}`);
const chunks = [], frames = [];
let start = 0, firstAudio = null, sampleRate = 24000, ended = false;
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { socket.close(); reject(new Error('Provider synthesis timed out')); }, 25000);
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.type === 'Error') { clearTimeout(timeout); socket.close(); reject(new Error(`${message.error_type}: ${message.error}`)); return; }
    if (message.type === 'Begin') {
      sampleRate = message.configuration.sample_rate;
      start = performance.now();
      socket.send(JSON.stringify({ type: 'Generate', text }));
      socket.send(JSON.stringify({ type: 'Flush' }));
    } else if (message.type === 'Audio') {
      firstAudio ??= Math.round(performance.now() - start);
      chunks.push(Buffer.from(message.audio, 'base64'));
    } else if (message.type === 'FlushDone') {
      frames.push(message);
      socket.send(JSON.stringify({ type: 'Terminate' }));
    } else if (message.type === 'WordBoundaries') frames.push(message);
    else if (message.type === 'Termination') { ended = true; clearTimeout(timeout); socket.close(); resolve(); }
  };
  socket.onerror = () => { clearTimeout(timeout); reject(new Error('Provider WebSocket error')); };
  socket.onclose = () => { if (!ended) { clearTimeout(timeout); reject(new Error('Provider closed before completion')); } };
});
const pcm = Buffer.concat(chunks);
const header = Buffer.alloc(44);
header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const dir = 'artifacts/live-verification';
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/${name}.wav`, Buffer.concat([header, pcm]));
const summary = { text, language, voice, sampleRate, firstAudioMs: firstAudio, audioBytes: pcm.length, durationMs: Math.round(pcm.length / 2 / sampleRate * 1000), wordTimingReceived: frames.some(frame => frame.type === 'WordBoundaries'), frames };
await writeFile(`${dir}/${name}.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, frames: frames.map(frame => frame.type) }));
