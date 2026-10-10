// 웹에서 모든 화면을 열어 보고 오류를 모으는 점검 스크립트 (한국어·영어)
// 사용: 개발 서버를 켠 상태에서  node scripts/smoke-web.mjs [주소=http://localhost:8081]
// 화면 사진은 .claude/smoke/ 에 저장 (git에 올라가지 않음)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { findBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] ?? 'http://localhost:8081';
const OUT = join(ROOT, '.claude', 'smoke');
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const PROGRESS = {
  onboarded: true,
  tutorial: { king: true },
  campaign: { 1: 3, 2: 2 },
  daily: { streak: 0, bestStreak: 0, lastSolved: null, records: {} },
};

const TEXT = {
  ko: { knowsChess: '체스를 알아요', openRules: '규칙 보기', piecesTab: '기물 움직임', start: '배틀 시작!' },
  en: { knowsChess: 'I know chess', openRules: 'Show rules', piecesTab: 'How pieces move', start: 'Battle start!' },
};

const ROUTES = ['/', '/daily', '/campaign', '/campaign/1', '/play', '/learn', '/learn/knight', '/settings'];

const clickText = async (page, text) => {
  const done = await page.evaluate(label => {
    const el = [...document.querySelectorAll('div[tabindex="0"], [role="button"]')].reverse().find(d => d.innerText?.trim() === label);
    el?.click();
    return !!el;
  }, text);
  if (!done) throw new Error(`"${text}" 버튼을 찾지 못함`);
};

// 보드 칸 중심을 실제 마우스로 탭
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

const clickLabel = async (page, label, index = 0) => {
  const els = await page.$$(`[aria-label="${label}"]`);
  if (!els[index]) throw new Error(`"${label}" 버튼을 찾지 못함`);
  await els[index].click();
};

const run = async (browser, locale) => {
  const errors = [];
  const newPage = async progress => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(VIEWPORT);
    page.on('pageerror', error => errors.push(`${locale} ${page.url()} pageerror: ${error.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`${locale} ${page.url()} console: ${msg.text().slice(0, 300)}`);
    });
    await page.evaluateOnNewDocument(
      (lang, saved) => {
        Object.defineProperty(navigator, 'language', { get: () => lang });
        Object.defineProperty(navigator, 'languages', { get: () => [lang] });
        if (saved) localStorage.setItem('progress:v1', JSON.stringify(saved));
      },
      locale,
      progress
    );
    return { context, page };
  };
  const shot = (page, name) => page.screenshot({ path: join(OUT, `${locale}-${name}.png`) });
  const t = TEXT[locale];

  // 1) 처음 온 사람: 환영 안내 → 체스를 알아요 → 규칙 단계
  {
    const { context, page } = await newPage(null);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(1200);
    await clickText(page, t.knowsChess);
    await wait(500);
    await shot(page, 'welcome-rules');
    await context.close();
  }

  // 2) 모든 화면 열기
  for (const route of ROUTES) {
    const { context, page } = await newPage(PROGRESS);
    await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(900);
    await shot(page, `route${route.replace(/\//g, '_') || '_home'}`);
    await context.close();
  }

  // 3) 홈의 규칙 버튼 → 기본 규칙 / 기물 움직임
  {
    const { context, page } = await newPage(PROGRESS);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(900);
    await clickLabel(page, t.openRules);
    await wait(900);
    await shot(page, 'rules-basics');
    await clickText(page, t.piecesTab);
    await wait(500);
    await shot(page, 'rules-pieces');
    // 시트 안 스크롤을 끝까지 내려 폰·나이트 카드와 배우기 버튼 확인
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height * 0.7);
    await page.mouse.wheel({ deltaY: 3000 });
    await wait(400);
    await shot(page, 'rules-pieces-bottom');
    await context.close();
  }

  // 4) 게임 화면 헤더의 ? 버튼, 그리고 한 수 두기
  {
    const { context, page } = await newPage(PROGRESS);
    await page.goto(BASE + '/campaign/1', { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(900);
    await clickLabel(page, t.openRules);
    await wait(900);
    await shot(page, 'rules-from-game');
    await context.close();
  }

  // 5) 단계 배틀: VS 화면 → 배틀 시작 → 한 수 두고 AI 응수
  {
    const { context, page } = await newPage(PROGRESS);
    await page.goto(BASE + '/campaign/3', { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(1500);
    await shot(page, 'battle-intro');
    await clickText(page, t.start);
    await wait(700);
    await tapSquare(page, 3, 2);
    await wait(250);
    await shot(page, 'battle-select');
    await tapSquare(page, 2, 2);
    await wait(2200);
    await shot(page, 'battle-reply');
    await context.close();
  }
  // 6) 폰 레슨: 끝 줄에 닿아 퀸으로 진화
  {
    const { context, page } = await newPage(PROGRESS);
    await page.goto(BASE + '/learn/pawn', { waitUntil: 'networkidle0', timeout: 120_000 });
    await wait(900);
    for (const [fr, fc, tr, tc] of [[3, 1, 2, 1], [2, 1, 1, 2], [1, 2, 0, 2]]) {
      await tapSquare(page, fr, fc);
      await wait(200);
      await tapSquare(page, tr, tc);
      await wait(600);
    }
    await wait(400);
    await shot(page, 'evolution-flicker');
    await wait(1800);
    await shot(page, 'evolution');
    await context.close();
  }
  return errors;
};

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const all = [];
  for (const locale of ['ko', 'en']) {
    const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true, args: [`--lang=${locale}`, '--hide-scrollbars'] });
    try {
      all.push(...(await run(browser, locale)));
    } finally {
      await browser.close();
    }
  }
  if (all.length) {
    console.log(`오류 ${all.length}개:\n${all.join('\n')}`);
    process.exit(1);
  }
  console.log('오류 없음 ✓');
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
