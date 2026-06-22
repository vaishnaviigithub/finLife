// Generates tiny 8-bit style sound effects as base64 WAV data URIs.
// We synthesize square waves with a simple amplitude envelope.
// This avoids shipping any audio assets and works fully offline.

import { createAudioPlayer, AudioPlayer } from 'expo-audio';

const SAMPLE_RATE = 8000;

function squareEnvelope(freq: number, durMs: number, vol = 0.5): Uint8Array {
  const total = Math.floor((SAMPLE_RATE * durMs) / 1000);
  const samples = new Uint8Array(total);
  const period = SAMPLE_RATE / freq;
  for (let i = 0; i < total; i++) {
    // simple linear decay envelope
    const env = 1 - i / total;
    const phase = (i % period) / period;
    const sq = phase < 0.5 ? 1 : -1;
    const s = sq * vol * env;
    // unsigned 8-bit PCM: 128 = silence
    samples[i] = Math.max(0, Math.min(255, Math.round(128 + s * 127)));
  }
  return samples;
}

function concatSamples(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function wavHeader(dataLen: number): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  // RIFF
  view.setUint8(0, 0x52);
  view.setUint8(1, 0x49);
  view.setUint8(2, 0x46);
  view.setUint8(3, 0x46);
  view.setUint32(4, 36 + dataLen, true);
  // WAVE
  view.setUint8(8, 0x57);
  view.setUint8(9, 0x41);
  view.setUint8(10, 0x56);
  view.setUint8(11, 0x45);
  // fmt
  view.setUint8(12, 0x66);
  view.setUint8(13, 0x6d);
  view.setUint8(14, 0x74);
  view.setUint8(15, 0x20);
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE, true); // byte rate (mono 8-bit)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  // data
  view.setUint8(36, 0x64);
  view.setUint8(37, 0x61);
  view.setUint8(38, 0x74);
  view.setUint8(39, 0x61);
  view.setUint32(40, dataLen, true);
  return header;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // global.btoa exists on web; for native we polyfill simple base64.
  if (typeof btoa === 'function') return btoa(binary);
  // fallback base64 polyfill (RN should have global btoa via core-js polyfills,
  // but just in case)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 1 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i < binary.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
}

function buildWav(parts: Uint8Array[]): string {
  const data = concatSamples(parts);
  const header = wavHeader(data.length);
  const full = new Uint8Array(header.length + data.length);
  full.set(header, 0);
  full.set(data, header.length);
  return 'data:audio/wav;base64,' + toBase64(full);
}

const SOUNDS = {
  click: () => buildWav([squareEnvelope(660, 60, 0.4)]),
  coin: () => buildWav([squareEnvelope(880, 60, 0.5), squareEnvelope(1320, 90, 0.5)]),
  win: () =>
    buildWav([
      squareEnvelope(523, 80, 0.5),
      squareEnvelope(659, 80, 0.5),
      squareEnvelope(784, 80, 0.5),
      squareEnvelope(1046, 220, 0.55),
    ]),
  bad: () =>
    buildWav([
      squareEnvelope(330, 120, 0.55),
      squareEnvelope(220, 220, 0.55),
    ]),
  tick: () => buildWav([squareEnvelope(1200, 25, 0.3)]),
  whoosh: () =>
    buildWav([
      squareEnvelope(200, 50, 0.3),
      squareEnvelope(300, 50, 0.3),
      squareEnvelope(500, 50, 0.3),
      squareEnvelope(800, 80, 0.3),
    ]),
};

type Key = keyof typeof SOUNDS;

const cache: Partial<Record<Key, AudioPlayer>> = {};
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function isSoundEnabled() {
  return enabled;
}

export function play(name: Key) {
  if (!enabled) return;
  try {
    let player = cache[name];
    if (!player) {
      const uri = SOUNDS[name]();
      player = createAudioPlayer({ uri });
      cache[name] = player;
    }
    player.seekTo(0);
    player.play();
  } catch {
    // swallow — audio is non-critical
  }
}
