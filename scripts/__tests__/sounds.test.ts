import { readFileSync } from 'fs';
import { join } from 'path';

// scripts/build-sounds.mjs가 만든 파일 검사
const ROOT = join(__dirname, '..', '..');
const SOUND_DIR = join(ROOT, 'assets', 'sounds');
const SOUND_NAMES = ['select', 'move', 'capture', 'check', 'star', 'wrong', 'clear', 'win', 'lose'];

describe('sound files', () => {
  it.each(SOUND_NAMES)('%s.wav is a short 16-bit mono PCM wave', name => {
    const wav = readFileSync(join(SOUND_DIR, `${name}.wav`));
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt16LE(22)).toBe(1); // 모노
    expect(wav.readUInt16LE(34)).toBe(16);
    const seconds = wav.readUInt32LE(40) / (wav.readUInt32LE(24) * 2);
    expect(seconds).toBeGreaterThan(0.03);
    expect(seconds).toBeLessThan(1.2); // 효과음은 짧게
  });

  it('feedback.ts loads exactly these sounds', () => {
    const source = readFileSync(join(ROOT, 'src', 'feedback', 'feedback.ts'), 'utf8');
    const required = [...source.matchAll(/assets\/sounds\/(\w+)\.wav/g)].map(m => m[1]);
    expect(required.sort()).toEqual([...SOUND_NAMES].sort());
  });
});
