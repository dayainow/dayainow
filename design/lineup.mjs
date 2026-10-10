// 캡슐몬 기물 라인업 시안: 큰 크기 + 실제 판 크기(약 60px)에서 읽히는지 함께 확인
// 사용: node design/lineup.mjs  → design/out/lineup.png
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, PIECE_TYPES, piece } from './creatures.mjs';
import { FONT_LINK, closeRenderer, renderHtml } from './render.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(OUT, { recursive: true });

const NAMES = { K: '킹', Q: '퀸', R: '룩', B: '비숍', N: '나이트', P: '폰' };
const START = [
  ['bR', 'bN', 'bB', 'bQ', 'bK'],
  ['bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK'],
];

const board = cell => `
  <div class="board" style="--cell:${cell}px">
    ${START.map((row, r) => row.map((p, c) => `<div class="cell ${(r + c) % 2 ? 'dark' : 'light'}">${p ? piece(p[0], p[1], cell * 0.86) : ''}</div>`).join('')).join('')}
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>
  body { margin: 0; background: #EAF6FF; font-family: 'Jua', sans-serif; color: ${INK}; padding: 40px; }
  h1 { font-size: 40px; margin: 0 0 6px; } p { margin: 0 0 24px; font-size: 20px; color: #6E6878; }
  .row { display: flex; gap: 18px; margin-bottom: 18px; }
  .card { background: #fff; border: 4px solid ${INK}; border-radius: 26px; padding: 14px 10px 12px; width: 170px; text-align: center; box-shadow: 0 6px 0 ${INK}; }
  .card .name { font-size: 24px; margin-top: 2px; }
  .boards { display: flex; gap: 40px; align-items: flex-start; margin-top: 30px; }
  .board { display: grid; grid-template-columns: repeat(5, var(--cell)); border: 5px solid ${INK}; border-radius: 18px; overflow: hidden; }
  .cell { width: var(--cell); height: var(--cell); display: flex; align-items: center; justify-content: center; }
  .light { background: #FFFBF3; } .dark { background: #CFF3E4; }
  .label { font-size: 20px; margin-bottom: 10px; }
</style></head><body>
  <h1>캡슐몬 기물 시안</h1>
  <p>윤곽은 체스 기물 그대로(왕관·탑·말머리·주교관), 얼굴·발·팀 색으로 몬스터 느낌</p>
  ${['w', 'b'].map(team => `<div class="row">${PIECE_TYPES.map(t => `<div class="card">${piece(team, t, 150)}<div class="name">${team === 'w' ? '블루' : '레드'} ${NAMES[t]}</div></div>`).join('')}</div>`).join('')}
  <div class="boards">
    <div><div class="label">실제 게임 크기 (칸 72px)</div>${board(72)}</div>
    <div><div class="label">작은 휴대폰 (칸 56px)</div>${board(56)}</div>
  </div>
</body></html>`;

await renderHtml(html, join(OUT, 'lineup.png'), { width: 1240, scale: 1.5 });
await closeRenderer();
console.log('✓ design/out/lineup.png');
