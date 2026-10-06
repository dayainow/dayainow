// 스토어용 휴대폰 스크린샷(1080x2160, 1:2 — Google Play 허용 최대 비율)을 한국어·영어로 자동 촬영
// 사용: 개발 서버(npm run web)를 켠 상태에서  node scripts/store-screenshots.mjs [주소=http://localhost:8081]
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { findBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] ?? 'http://localhost:8081';
const VIEWPORT = { width: 360, height: 720, deviceScaleFactor: 3 };
const LOCALES = ['ko', 'en'];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const pad = n => String(n).padStart(2, '0');
const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// 스크린샷에 보일 진행 상태: 튜토리얼 완료, 앞쪽 단계 몇 개 클리어, 어제까지 연속 기록
const yesterday = new Date(Date.now() - 86_400_000);
const PROGRESS = {
  onboarded: true,
  tutorial: Object.fromEntries(['king', 'rook', 'bishop', 'queen', 'knight', 'pawn', 'escape', 'mate'].map(id => [id, true])),
  campaign: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 3, 6: 2, 7: 3, 8: 1 },
  daily: { streak: 6, bestStreak: 6, lastSolved: dateKey(yesterday), records: {} },
};
const SETTINGS = { difficulty: 'normal', soundEnabled: true, hapticsEnabled: true };

// 보드 칸 중심 좌표를 찾아 실제 마우스로 탭
const tapSquare = async (page, r, c) => {
  const point = await page.evaluate(
    (row, col) => {
      const board = [...document.querySelectorAll('div')].find(
        d => getComputedStyle(d).borderTopWidth === '4px' && d.querySelectorAll('div[tabindex="0"]').length === 25
      );
      const rect = board.querySelectorAll('div[tabindex="0"]')[row * 5 + col].getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    },
    r,
    c
  );
  await page.mouse.click(point.x, point.y);
};

const move = async (page, [fromR, fromC, toR, toC]) => {
  await tapSquare(page, fromR, fromC);
  await wait(150);
  await tapSquare(page, toR, toC);
};

const SCENES = [
  { name: '01-home', path: '/' },
  // 오늘의 퍼즐: 블루 기물 하나를 골라 갈 수 있는 칸 표시
  {
    name: '02-daily',
    path: '/daily',
    setup: async page => {
      const square = await page.evaluate(() => {
        const board = [...document.querySelectorAll('div')].find(
          d => getComputedStyle(d).borderTopWidth === '4px' && d.querySelectorAll('div[tabindex="0"]').length === 25
        );
        const cells = [...board.querySelectorAll('div[tabindex="0"]')];
        // 퀸 > 룩 > 나이트 > 비숍 순으로 눈에 띄는 기물 선택
        for (const symbol of ['♕', '♖', '♘', '♗']) {
          const index = cells.findIndex(cell => cell.innerText.includes(symbol));
          if (index >= 0) return { r: Math.floor(index / 5), c: index % 5 };
        }
        return null;
      });
      if (square) await tapSquare(page, square.r, square.c);
    },
  },
  // 튜토리얼: 나이트를 골라 L자 이동과 ★ 보여 주기
  { name: '03-learn', path: '/learn/knight', setup: page => tapSquare(page, 4, 1) },
  { name: '04-campaign', path: '/campaign' },
  // 대국 중: 한 수 두고 AI 응수 뒤 나이트 선택
  {
    name: '05-play',
    path: '/play',
    setup: async page => {
      await move(page, [3, 2, 2, 2]);
      await wait(1800);
      await tapSquare(page, 4, 1);
    },
  },
  // 튜토리얼 졸업: 체크메이트 후 색종이가 터지는 순간
  {
    name: '06-clear',
    path: '/learn/mate',
    setup: async page => {
      await move(page, [4, 0, 0, 0]);
      await wait(1150);
    },
    settle: 0,
  },
];

const shoot = async (browser, locale, scene) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(VIEWPORT);
  await page.evaluateOnNewDocument(
    (lang, progress, settings) => {
      Object.defineProperty(navigator, 'language', { get: () => lang });
      Object.defineProperty(navigator, 'languages', { get: () => [lang] });
      localStorage.setItem('progress:v1', JSON.stringify(progress));
      localStorage.setItem('settings:v1', JSON.stringify(settings));
    },
    locale,
    PROGRESS,
    SETTINGS
  );
  await page.goto(BASE + scene.path, { waitUntil: 'networkidle0', timeout: 120_000 });
  await wait(1500);
  if (scene.setup) await scene.setup(page);
  await wait(scene.settle ?? 700);
  const out = join(ROOT, 'assets', 'store', 'screenshots', locale, `${scene.name}.png`);
  await page.screenshot({ path: out });
  await context.close();
  console.log(`✓ ${locale}/${scene.name}.png`);
};

const main = async () => {
  for (const locale of LOCALES) {
    mkdirSync(join(ROOT, 'assets', 'store', 'screenshots', locale), { recursive: true });
    const browser = await puppeteer.launch({
      executablePath: findBrowser(),
      headless: true,
      args: [`--lang=${locale}`, '--hide-scrollbars'],
    });
    try {
      for (const scene of SCENES) await shoot(browser, locale, scene);
    } finally {
      await browser.close();
    }
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
