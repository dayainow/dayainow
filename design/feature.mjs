// Google Play 대표 이미지(1024x500)를 "캡슐 리그" 디자인으로 렌더링
// 사용: node design/feature.mjs  → assets/store/feature-ko.png, feature-en.png
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLD, INK, TEAMS, piece } from './creatures.mjs';
import { FONT_LINK, closeRenderer, renderHtml } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const MASCOT = `data:image/png;base64,${readFileSync(join(ROOT, 'assets/splash-icon.png')).toString('base64')}`;

const TEXT = {
  ko: { title: '캡슐체스', titleSize: 108, font: 'Jua', tagline: '귀여운 몬스터와 3분 미니 체스', chips: ['⚔️ 캡슐 리그', '🧩 오늘의 퍼즐', '✨ 폰 진화'] },
  en: { title: 'Capsule Chess', titleSize: 76, font: 'Fredoka', tagline: 'Cute monster mini chess in 3 minutes', chips: ['⚔️ League', '🧩 Daily puzzle', '✨ Evolve'] },
};

const html = t => `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1024px; height: 500px; overflow: hidden; position: relative; font-family: '${t.font}', 'Jua', sans-serif; color: ${INK};
         background: ${TEAMS.w.body}; }
  .red { position: absolute; left: -200px; top: -330px; width: 1500px; height: 600px; background: ${TEAMS.b.body};
         border-bottom: 9px solid ${INK}; transform: rotate(-14deg); transform-origin: center; }
  .dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.16) 3px, transparent 3.5px); background-size: 26px 26px; }
  .left { position: absolute; left: 54px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 112px; height: 112px; filter: drop-shadow(0 6px 0 rgba(46,42,58,.35)); }
  .title { font-size: ${t.titleSize}px; line-height: 1; color: #fff; -webkit-text-stroke: 12px ${INK}; paint-order: stroke fill; text-shadow: 0 8px 0 ${INK}; white-space: nowrap; }
  .tagline { align-self: flex-start; background: #fff; border: 4px solid ${INK}; border-bottom-width: 8px; border-radius: 20px; padding: 8px 18px; font-size: 27px; }
  .chips { display: flex; gap: 10px; }
  .chip { background: ${GOLD}; border: 4px solid ${INK}; border-bottom-width: 7px; border-radius: 999px; padding: 4px 14px; font-size: 21px; white-space: nowrap; }
  .p { position: absolute; filter: drop-shadow(0 8px 0 rgba(46,42,58,.28)); }
  .vs { position: absolute; left: 706px; top: 178px; font-family: 'Fredoka'; font-weight: 700; font-size: 86px; color: ${GOLD};
        -webkit-text-stroke: 9px ${INK}; paint-order: stroke fill; text-shadow: 0 7px 0 ${INK}; transform: rotate(-10deg); }
</style></head><body>
  <div class="red"></div><div class="dots"></div>
  <!-- 레드 팀 (오른쪽 위) -->
  <div class="p" style="left:842px; top:8px">${piece('b', 'K', 170)}</div>
  <div class="p" style="left:690px; top:-6px">${piece('b', 'R', 132)}</div>
  <div class="vs">VS</div>
  <!-- 블루 팀 (오른쪽 아래) -->
  <div class="p" style="left:612px; top:262px">${piece('w', 'N', 170)}</div>
  <div class="p" style="left:780px; top:266px">${piece('w', 'Q', 200)}</div>
  <div class="p" style="left:930px; top:356px">${piece('w', 'P', 120)}</div>
  <div class="left">
    <div class="brand"><img src="${MASCOT}"><div class="title">${t.title}</div></div>
    <div class="tagline">${t.tagline}</div>
    <div class="chips">${t.chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
  </div>
</body></html>`;

for (const locale of ['ko', 'en']) {
  await renderHtml(html(TEXT[locale]), join(ROOT, 'assets', 'store', `feature-${locale}.png`), { width: 1024, height: 500, scale: 1 });
  console.log(`✓ assets/store/feature-${locale}.png`);
}
await closeRenderer();
