// 브랜드 아이콘(캡슐 속 폰, 시안 B-2 수정안 2)과 스토어 이미지를 SVG로 만들고 로컬 Edge/Chrome 헤드리스로 PNG를 렌더링한다.
// 사용: node scripts/build-icons.mjs   (브라우저 경로는 BROWSER_PATH 환경변수로 지정 가능)
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const BRAND = {
  mint: '#6FDDB7',
  mintLight: '#CFF3E4',
  coral: '#FF8C94',
  butter: '#FFD86B',
  blush: '#FF9AA2',
  clear: '#EAF6FF',
  ink: '#3A3445',
};

// 동글한 폰 마스코트. 머리 중심이 (0, 0)
const PAWN = `
  <path d="M-11,22 Q-14,38 -24,44 L24,44 Q14,38 11,22 Z" fill="${BRAND.mint}" stroke="${BRAND.ink}" stroke-width="3.6" stroke-linejoin="round"/>
  <rect x="-16" y="15" width="32" height="8" rx="4" fill="${BRAND.mint}" stroke="${BRAND.ink}" stroke-width="3.6"/>
  <circle cx="0" cy="0" r="18" fill="${BRAND.mint}" stroke="${BRAND.ink}" stroke-width="3.6"/>
  <ellipse cx="-7" cy="-9" rx="4.5" ry="2.8" fill="#FFFFFF"/>
  <ellipse cx="-7" cy="1" rx="3" ry="3.6" fill="${BRAND.ink}"/>
  <ellipse cx="7" cy="1" rx="3" ry="3.6" fill="${BRAND.ink}"/>
  <circle cx="-6" cy="-0.4" r="1.1" fill="#FFFFFF"/>
  <circle cx="8" cy="-0.4" r="1.1" fill="#FFFFFF"/>
  <ellipse cx="-12.5" cy="8" rx="4.5" ry="2.6" fill="${BRAND.blush}"/>
  <ellipse cx="12.5" cy="8" rx="4.5" ry="2.6" fill="${BRAND.blush}"/>
  <path d="M-3.5,7.5 Q0,11 3.5,7.5" fill="none" stroke="${BRAND.ink}" stroke-width="2" stroke-linecap="round"/>`;

// 180x180 좌표계의 캡슐. 원 중심 (90, 99), 반지름 78
// 다른 유명 디자인(반반 나뉜 공 + 가운데 띠 + 버튼)과 겹치지 않도록:
// 경계를 중심보다 아래(y=110)에 두고, 가운데 잠금쇠 없이, 아래 반쪽 테두리(립)가 원 밖으로 살짝 튀어나오게 함
const CAPSULE = `
  <defs><clipPath id="dome"><path d="M12.8,110 A78,78 0 1 1 167.2,110 Z"/></clipPath></defs>
  <path d="M12.8,110 A78,78 0 1 1 167.2,110 Z" fill="${BRAND.clear}"/>
  <g clip-path="url(#dome)"><g transform="translate(90,62) scale(1.85)">${PAWN}</g></g>
  <path d="M26,86 A66,66 0 0 1 48,46" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
  <path d="M12.8,110 A78,78 0 1 1 167.2,110" fill="none" stroke="${BRAND.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M12.8,110 A78,78 0 0 0 167.2,110 Z" fill="${BRAND.butter}" stroke="${BRAND.ink}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="6.8" y="103" width="166.4" height="13" rx="6.5" fill="${BRAND.butter}" stroke="${BRAND.ink}" stroke-width="5"/>`;

// scale: 캡슐이 캔버스에서 차지하는 비율을 조절 (1이면 테두리 립 포함 폭이 약 97%)
const buildIconSvg = ({ background, scale, size }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="${size}" height="${size}">
${background ? `<rect width="180" height="180" fill="${background}"/>` : ''}
<g transform="translate(90 90) scale(${scale}) translate(-90 -99)">${CAPSULE}</g>
</svg>
`;

// Android 알림 아이콘: 흰색 실루엣만 (안드로이드가 알파 채널만 써서 색을 입힘). 캡슐 + 폰 머리 모양 구멍
const NOTIFICATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="96" height="96">
<defs><mask id="cut"><rect width="180" height="180" fill="#fff"/><circle cx="90" cy="70" r="30" fill="#000"/><rect x="62" y="96" width="56" height="16" rx="8" fill="#000"/></mask></defs>
<g mask="url(#cut)" transform="translate(90 90) scale(0.95) translate(-90 -99)">
  <circle cx="90" cy="99" r="80" fill="#fff"/>
</g>
<circle cx="90" cy="68" r="20" fill="#fff"/>
</svg>
`;

// Play 스토어 대표 이미지 (1024x500): 왼쪽 캡슐, 오른쪽 제목·한 줄 소개·특징 칩
const FEATURE_TEXT = {
  ko: { titleLines: ['캡슐체스'], titleSize: 104, tagline: '3분이면 끝나는 귀여운 미니 체스', chips: ['오늘의 퍼즐', '20단계 도전', '튜토리얼'], chipSize: 24 },
  en: { titleLines: ['Capsule', 'Chess'], titleSize: 84, tagline: 'Cute mini chess in 3 minutes', chips: ['Daily puzzle', '20 stages', 'Tutorial'], chipSize: 22 },
};
const FONT = `'Malgun Gothic', 'Apple SD Gothic Neo', 'Segoe UI', sans-serif`;
// 칩 너비 대략 계산: 한글은 글자 폭이 넓음
const textWidth = (text, size) => [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x3000 ? 1 : 0.62) * size, 0);

const CONFETTI = [
  [480, 40, 20, BRAND.butter], [960, 70, -30, BRAND.coral], [600, 455, 35, '#8EC5FF'], [990, 430, 15, BRAND.mint],
  [430, 400, -20, BRAND.coral], [55, 60, 25, BRAND.butter], [40, 440, -35, '#8EC5FF'], [880, 470, 50, BRAND.butter],
];

const buildFeatureSvg = ({ titleLines, titleSize, tagline, chips, chipSize }) => {
  const textX = 470;
  const titleTop = 205 - (titleLines.length - 1) * titleSize * 0.5;
  const titles = titleLines
    .map((line, i) => `<text x="${textX}" y="${titleTop + i * titleSize * 0.98}" font-family="${FONT}" font-size="${titleSize}" font-weight="900" fill="${BRAND.ink}">${line}</text>`)
    .join('');
  const taglineY = titleTop + (titleLines.length - 1) * titleSize * 0.98 + 62;
  let chipX = textX;
  const chipSvg = chips
    .map(label => {
      const width = textWidth(label, chipSize) + 36;
      const chip = `<rect x="${chipX}" y="${taglineY + 30}" width="${width}" height="46" rx="23" fill="#FFFFFF" stroke="${BRAND.ink}" stroke-width="3"/>
<text x="${chipX + width / 2}" y="${taglineY + 61}" text-anchor="middle" font-family="${FONT}" font-size="${chipSize}" font-weight="700" fill="${BRAND.ink}">${label}</text>`;
      chipX += width + 12;
      return chip;
    })
    .join('');
  const confetti = CONFETTI.map(
    ([x, y, rotate, color]) => `<rect x="${x - 9}" y="${y - 15}" width="18" height="30" rx="9" fill="${color}" stroke="${BRAND.ink}" stroke-width="3" transform="rotate(${rotate} ${x} ${y})"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
<rect width="1024" height="500" fill="${BRAND.mintLight}"/>
${confetti}
<g transform="translate(240 250) scale(2.05) translate(-90 -99)">${CAPSULE}</g>
${titles}
<text x="${textX}" y="${taglineY}" font-family="${FONT}" font-size="32" font-weight="700" fill="${BRAND.ink}">${tagline}</text>
${chipSvg}
</svg>
`;
};

const TARGETS = [
  // iOS/기본 아이콘: 배경 꽉 채움 (iOS는 모서리를 자동으로 둥글게 자르고, Expo가 투명도를 제거함)
  { name: 'icon', out: 'assets/icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: BRAND.mintLight, scale: 0.9, size: 1024 }) },
  // Android 적응형 아이콘 전경: 런처가 어떤 모양으로 잘라도 안전하도록 전체(립 끝 포함)를 캔버스 지름 61% 원 안에
  { name: 'adaptive-icon', out: 'assets/adaptive-icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: null, scale: 0.63, size: 1024 }) },
  // 스플래시 가운데 이미지 (배경색은 app.json에서 지정)
  { name: 'splash-icon', out: 'assets/splash-icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: null, scale: 0.95, size: 1024 }) },
  // Android 알림 작은 아이콘 96x96 (흰색 실루엣)
  { name: 'notification-icon', out: 'assets/notification-icon.png', width: 96, height: 96, svg: NOTIFICATION_SVG },
  // Google Play 스토어 아이콘 512x512 (꽉 찬 정사각형, 모서리는 스토어가 둥글게 처리)
  { name: 'play-icon', out: 'assets/store/play-icon.png', width: 512, height: 512, svg: buildIconSvg({ background: BRAND.mintLight, scale: 0.9, size: 512 }) },
  // Google Play 대표 이미지 1024x500
  { name: 'feature-ko', out: 'assets/store/feature-ko.png', width: 1024, height: 500, svg: buildFeatureSvg(FEATURE_TEXT.ko) },
  { name: 'feature-en', out: 'assets/store/feature-en.png', width: 1024, height: 500, svg: buildFeatureSvg(FEATURE_TEXT.en) },
];

const render = (browser, { svg, width, height }, outPath, workDir) => {
  const htmlPath = join(workDir, 'render.html');
  writeFileSync(htmlPath, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:transparent">${svg}</body></html>`);
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    '--default-background-color=00000000',
    `--user-data-dir=${join(workDir, 'profile')}`,
    `--screenshot=${outPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: 'ignore' });
};

const main = () => {
  const browser = findBrowser();
  const brandDir = join(ROOT, 'assets', 'brand');
  mkdirSync(brandDir, { recursive: true });
  mkdirSync(join(ROOT, 'assets', 'store'), { recursive: true });
  const workDir = mkdtempSync(join(tmpdir(), 'capsule-icons-'));
  try {
    for (const target of TARGETS) {
      writeFileSync(join(brandDir, `${target.name}.svg`), target.svg);
      render(browser, target, join(ROOT, target.out), workDir);
      console.log(`✓ ${target.out}`);
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
};

main();
