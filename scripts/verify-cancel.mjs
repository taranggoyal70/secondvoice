import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const response = await fetch('https://token.us.assemblyai.com/v1/token', { method: 'POST', headers: { Authorization: process.env.ASSEMBLYAI_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ product: 'tts', expires_in_seconds: 60 }), signal: AbortSignal.timeout(15000) });
const { token } = await response.json();
assert.ok(token, 'Token must be issued');
const socket = new WebSocket(`wss://tts.us.assemblyai.com/v1/ws?${new URLSearchParams({ token, voice_id: 'aai-audrey', language: 'english', word_boundaries: 'true' })}`);
let phase = 'initial', cancelAt = 0, cancelledMs = null, firstId = null, resumedId = null, resumedBytes = 0;
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { socket.close(); reject(new Error('Cancel/resume timeout')); }, 25000);
  socket.onmessage = event => {
    const frame = JSON.parse(event.data);
    if (frame.type === 'Error') { clearTimeout(timeout); socket.close(); reject(new Error(frame.error)); }
    if (frame.type === 'Begin') { socket.send(JSON.stringify({ type: 'Generate', text: 'I would like to explain my preferences. Please give me time to finish this sentence before you ask another question. I want to make this choice myself.' })); socket.send(JSON.stringify({ type: 'Flush' })); }
    if (frame.type === 'Audio' && phase === 'initial') { firstId = frame.flush_id; phase = 'cancelling'; cancelAt = performance.now(); socket.send(JSON.stringify({ type: 'Cancel' })); }
    else if (frame.type === 'Cancelled') { cancelledMs = Math.round(performance.now() - cancelAt); phase = 'resuming'; socket.send(JSON.stringify({ type: 'Generate', text: 'I want to answer for myself.' })); socket.send(JSON.stringify({ type: 'Flush' })); }
    else if (frame.type === 'Audio' && phase === 'resuming') { resumedId = frame.flush_id; resumedBytes += Buffer.from(frame.audio, 'base64').length; }
    else if (frame.type === 'FlushDone' && phase === 'resuming') { phase = 'complete'; socket.send(JSON.stringify({ type: 'Terminate' })); }
    else if (frame.type === 'Termination') { clearTimeout(timeout); socket.close(); resolve(); }
  };
  socket.onerror = () => { clearTimeout(timeout); reject(new Error('Socket error')); };
});
assert.equal(phase, 'complete'); assert.ok(cancelledMs !== null); assert.ok(resumedId > firstId); assert.ok(resumedBytes > 0);
const result = { cancelledMs, firstId, resumedId, resumedBytes, sameSocket: true, passed: true };
await mkdir('artifacts/live-verification', { recursive: true });
await writeFile('artifacts/live-verification/cancel-resume.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
