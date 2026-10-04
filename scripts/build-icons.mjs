// 브랜드 아이콘(캡슐 속 폰, 시안 B-2 수정안 2)을 SVG로 만들고 로컬 Edge/Chrome 헤드리스로 PNG를 렌더링한다.
// 사용: node scripts/build-icons.mjs   (브라우저 경로는 BROWSER_PATH 환경변수로 지정 가능)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 1024;

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
const buildSvg = ({ background, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="${SIZE}" height="${SIZE}">
${background ? `<rect width="180" height="180" fill="${background}"/>` : ''}
<g transform="translate(90 90) scale(${scale}) translate(-90 -99)">${CAPSULE}</g>
</svg>
`;

const TARGETS = [
  // iOS/기본 아이콘: 배경 꽉 채움 (iOS는 모서리를 자동으로 둥글게 자르고, Expo가 투명도를 제거함)
  { name: 'icon', background: BRAND.mintLight, scale: 0.9 },
  // Android 적응형 아이콘 전경: 런처가 어떤 모양으로 잘라도 안전하도록 전체(립 끝 포함)를 캔버스 지름 61% 원 안에
  { name: 'adaptive-icon', background: null, scale: 0.63 },
  // 스플래시 가운데 이미지 (배경색은 app.json에서 지정)
  { name: 'splash-icon', background: null, scale: 0.95 },
];

const findBrowser = () => {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find(p => existsSync(p));
  if (!found) throw new Error('Edge/Chrome을 찾지 못했습니다. BROWSER_PATH 환경변수로 경로를 지정하세요.');
  return found;
};

const render = (browser, svg, outPath, workDir) => {
  const htmlPath = join(workDir, 'render.html');
  writeFileSync(htmlPath, `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${SIZE},${SIZE}`,
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
  const workDir = mkdtempSync(join(tmpdir(), 'capsule-icons-'));
  try {
    for (const target of TARGETS) {
      const svg = buildSvg(target);
      writeFileSync(join(brandDir, `${target.name}.svg`), svg);
      const outPath = join(ROOT, 'assets', `${target.name}.png`);
      render(browser, svg, outPath, workDir);
      console.log(`✓ assets/${target.name}.png`);
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
};

main();
