// 효과음을 코드로 합성해서 assets/sounds/*.wav로 저장 (외부 음원 저작권 걱정 없음, 숫자만 바꿔 음색 조절)
// 사용: node scripts/build-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
const RATE = 44100;
const PEAK = 0.7;

const samplesFor = seconds => Math.round(seconds * RATE);

// 재현 가능한 잡음용 난수
let seed = 1;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

// 캡슐이 "뽁" 터지는 소리: 음높이가 from → to로 빠르게 떨어지는 사인파 + 짧은 어택 + 지수 감쇠
const pop = ({ from, to, duration, decay = 30, gain = 0.8 }) => {
  const out = new Float32Array(samplesFor(duration));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const freq = from * Math.pow(to / from, t / duration);
    phase += (2 * Math.PI * freq) / RATE;
    const envelope = Math.min(1, t / 0.003) * Math.exp(-decay * t);
    out[i] = Math.sin(phase) * envelope * gain;
  }
  return out;
};

// 실로폰 같은 종소리: 사인 + 약한 2배음
const bell = ({ freq, duration, decay = 8, gain = 0.5 }) => {
  const out = new Float32Array(samplesFor(duration));
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const envelope = Math.min(1, t / 0.004) * Math.exp(-decay * t);
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) * envelope * gain;
  }
  return out;
};

// 아주 짧은 "딸깍" 질감
const click = ({ duration = 0.006, gain = 0.3 }) => {
  const out = new Float32Array(samplesFor(duration));
  for (let i = 0; i < out.length; i++) out[i] = (random() * 2 - 1) * (1 - i / out.length) * gain;
  return out;
};

// 음높이가 쭉 올라가는 "슈웅" (VS 등장, 진화 직전)
const riser = ({ from, to, duration, gain = 0.4 }) => {
  const out = new Float32Array(samplesFor(duration));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const freq = from * Math.pow(to / from, t / duration);
    phase += (2 * Math.PI * freq) / RATE;
    // 서서히 커졌다가 끝에서 빠르게 사라짐 + 살짝 떨림
    const envelope = Math.min(1, t / (duration * 0.7)) * Math.min(1, (duration - t) / 0.03);
    const wobble = 1 + 0.25 * Math.sin(2 * Math.PI * 18 * t);
    out[i] = Math.sin(phase) * envelope * wobble * gain;
  }
  return out;
};

// [소리, 시작 시각(초)] 목록을 겹쳐서 하나로
const mix = (...parts) => {
  const length = Math.max(...parts.map(([sound, at]) => samplesFor(at) + sound.length));
  const out = new Float32Array(length);
  for (const [sound, at] of parts) {
    const offset = samplesFor(at);
    for (let i = 0; i < sound.length; i++) out[offset + i] += sound[i];
  }
  // 끝부분 5ms 페이드 아웃(딸깍 잡음 방지) + 최대 음량 맞춤
  const fade = Math.min(samplesFor(0.005), out.length);
  for (let i = 0; i < fade; i++) out[out.length - 1 - i] *= i / fade;
  const peak = Math.max(...out.map(Math.abs));
  if (peak > PEAK) for (let i = 0; i < out.length; i++) out[i] *= PEAK / peak;
  return out;
};

const NOTE = { C4: 262, E4: 330, G4: 392, C5: 523, E5: 659, G5: 784, C6: 1047, E6: 1319, G6: 1568, A6: 1760, C7: 2093 };

const SOUNDS = {
  select: mix([pop({ from: 1100, to: 800, duration: 0.05, decay: 60, gain: 0.35 }), 0]),
  move: mix([pop({ from: 560, to: 240, duration: 0.09, decay: 35 }), 0], [click({ gain: 0.25 }), 0]),
  capture: mix(
    [pop({ from: 760, to: 300, duration: 0.08, decay: 40 }), 0],
    [pop({ from: 420, to: 170, duration: 0.1, decay: 30 }), 0.05],
    [click({ gain: 0.35 }), 0]
  ),
  check: mix([bell({ freq: 880, duration: 0.09, decay: 25, gain: 0.45 }), 0], [bell({ freq: 1175, duration: 0.14, decay: 18, gain: 0.45 }), 0.08]),
  star: mix(
    [bell({ freq: NOTE.E6, duration: 0.07, decay: 30, gain: 0.35 }), 0],
    [bell({ freq: NOTE.A6, duration: 0.07, decay: 30, gain: 0.35 }), 0.045],
    [bell({ freq: NOTE.C7, duration: 0.16, decay: 14, gain: 0.35 }), 0.09]
  ),
  wrong: mix([pop({ from: 330, to: 130, duration: 0.24, decay: 9, gain: 0.6 }), 0]),
  clear: mix([bell({ freq: NOTE.G5, duration: 0.2, decay: 9, gain: 0.4 }), 0], [bell({ freq: NOTE.C6, duration: 0.45, decay: 7, gain: 0.4 }), 0.1]),
  win: mix(
    [bell({ freq: NOTE.C5, duration: 0.25, decay: 8, gain: 0.4 }), 0],
    [bell({ freq: NOTE.E5, duration: 0.25, decay: 8, gain: 0.4 }), 0.09],
    [bell({ freq: NOTE.G5, duration: 0.25, decay: 8, gain: 0.4 }), 0.18],
    [bell({ freq: NOTE.C6, duration: 0.7, decay: 5, gain: 0.45 }), 0.27]
  ),
  // VS 등장: 슈웅 → 쿵 → 짠
  versus: mix(
    [riser({ from: 220, to: 880, duration: 0.26, gain: 0.35 }), 0],
    [pop({ from: 200, to: 60, duration: 0.22, decay: 14, gain: 0.9 }), 0.25],
    [click({ duration: 0.02, gain: 0.4 }), 0.25],
    [bell({ freq: NOTE.G5, duration: 0.3, decay: 9, gain: 0.32 }), 0.3],
    [bell({ freq: NOTE.C6, duration: 0.45, decay: 7, gain: 0.32 }), 0.3]
  ),
  // 진화: 빠르게 올라가는 반짝임 → 높은 종소리
  evolve: mix(
    [riser({ from: 400, to: 1600, duration: 0.35, gain: 0.22 }), 0],
    ...[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].map((freq, i) => [bell({ freq, duration: 0.18, decay: 16, gain: 0.3 }), 0.05 + i * 0.055]),
    [bell({ freq: NOTE.C7, duration: 0.7, decay: 5, gain: 0.35 }), 0.4],
    [bell({ freq: NOTE.G6, duration: 0.7, decay: 5, gain: 0.25 }), 0.4]
  ),
  // 배지 획득: 짧은 팡파르
  badge: mix(
    [bell({ freq: NOTE.G4, duration: 0.14, decay: 14, gain: 0.38 }), 0],
    [bell({ freq: NOTE.C5, duration: 0.14, decay: 14, gain: 0.38 }), 0.1],
    [bell({ freq: NOTE.E5, duration: 0.14, decay: 14, gain: 0.38 }), 0.2],
    [bell({ freq: NOTE.G5, duration: 0.2, decay: 10, gain: 0.4 }), 0.3],
    [bell({ freq: NOTE.E5, duration: 0.12, decay: 16, gain: 0.34 }), 0.46],
    [bell({ freq: NOTE.C6, duration: 0.6, decay: 5, gain: 0.45 }), 0.56],
    [bell({ freq: NOTE.G5, duration: 0.6, decay: 5, gain: 0.3 }), 0.56]
  ),
  lose: mix(
    [bell({ freq: NOTE.G4, duration: 0.3, decay: 7, gain: 0.38 }), 0],
    [bell({ freq: NOTE.E4, duration: 0.3, decay: 7, gain: 0.38 }), 0.14],
    [bell({ freq: NOTE.C4, duration: 0.6, decay: 6, gain: 0.38 }), 0.28]
  ),
};

// 16비트 모노 PCM WAV
const toWav = samples => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt 청크 크기
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // 모노
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // 초당 바이트
  header.writeUInt16LE(2, 32); // 블록 정렬
  header.writeUInt16LE(16, 34); // 비트 수
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  writeFileSync(join(OUT_DIR, `${name}.wav`), toWav(samples));
  console.log(`✓ assets/sounds/${name}.wav (${Math.round((samples.length / RATE) * 1000)}ms)`);
}
