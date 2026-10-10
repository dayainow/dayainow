// 기물 몬스터(design/creatures.mjs)를 앱에서 쓰는 투명 배경 PNG로 렌더링
// 사용: node scripts/build-pieces.mjs  → assets/pieces/{w,b}{K,Q,R,B,N,P}.png (240x240)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PIECE_TYPES, piece } from '../design/creatures.mjs';
import { findBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'pieces');
const SIZE = 240;

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
  for (const team of ['w', 'b']) {
    for (const type of PIECE_TYPES) {
      await page.setContent(`<html><body style="margin:0;background:transparent">${piece(team, type, SIZE)}</body></html>`);
      await page.screenshot({ path: join(OUT, `${team}${type}.png`), omitBackground: true, clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
      console.log(`✓ assets/pieces/${team}${type}.png`);
    }
  }
} finally {
  await browser.close();
}
