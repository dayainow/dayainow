// 디자인 시안 HTML을 로컬 Chrome/Edge 헤드리스로 PNG로 찍는 도우미
import puppeteer from 'puppeteer-core';
import { findBrowser } from '../scripts/lib/browser.mjs';

let browserPromise = null;
const browser = () => (browserPromise ??= puppeteer.launch({ executablePath: findBrowser(), headless: true, args: ['--hide-scrollbars'] }));

export const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Jua&family=Mochiy+Pop+One&family=Fredoka:wght@600;700&display=swap" rel="stylesheet">';

// html 전체 문서를 width 너비로 그려 out에 저장. height를 주면 그 크기로 잘라냄 (없으면 내용 높이에 맞춤)
export const renderHtml = async (html, out, { width = 1200, height, scale = 2 } = {}) => {
  const page = await (await browser()).newPage();
  await page.setViewport({ width, height: height ?? 800, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot(height ? { path: out, clip: { x: 0, y: 0, width, height } } : { path: out, fullPage: true });
  await page.close();
};

export const closeRenderer = async () => {
  if (browserPromise) await (await browserPromise).close();
  browserPromise = null;
};
