// 브랜드 아이콘(캡슐 속 폰, 시안 B-2 수정안 2)과 스토어 아이콘을 SVG로 만들고 로컬 Edge/Chrome 헤드리스로 PNG를 렌더링한다.
// 스토어 대표 이미지(1024x500)는 design/feature.mjs에서 만든다.
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

// 동글한 폰 마스코트. 머리 중심이 (0, 0). 얼굴(눈·입)만 표정별로 바꿈
const INK = BRAND.ink;
const FACES = {
  normal: `
  <ellipse cx="-7" cy="1" rx="3" ry="3.6" fill="${INK}"/>
  <ellipse cx="7" cy="1" rx="3" ry="3.6" fill="${INK}"/>
  <circle cx="-6" cy="-0.4" r="1.1" fill="#FFFFFF"/>
  <circle cx="8" cy="-0.4" r="1.1" fill="#FFFFFF"/>
  <path d="M-3.5,7.5 Q0,11 3.5,7.5" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  // 눈웃음 ^^ + 활짝 웃는 입
  happy: `
  <path d="M-10,2.5 Q-7,-2.5 -4,2.5" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M4,2.5 Q7,-2.5 10,2.5" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-5,6.5 Q0,14 5,6.5 Z" fill="${INK}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
  <ellipse cx="0" cy="10.2" rx="2" ry="1.2" fill="${BRAND.coral}"/>`,
  // 동그란 눈 + 오 모양 입
  surprised: `
  <circle cx="-7" cy="0.5" r="3.6" fill="${INK}"/>
  <circle cx="7" cy="0.5" r="3.6" fill="${INK}"/>
  <circle cx="-5.8" cy="-0.8" r="1.3" fill="#FFFFFF"/>
  <circle cx="8.2" cy="-0.8" r="1.3" fill="#FFFFFF"/>
  <ellipse cx="0" cy="9" rx="2.6" ry="3.2" fill="${INK}"/>`,
  // 위를 올려다보며 고민
  thinking: `
  <ellipse cx="-6" cy="-0.5" rx="2.6" ry="3.2" fill="${INK}"/>
  <ellipse cx="8" cy="-0.5" rx="2.6" ry="3.2" fill="${INK}"/>
  <circle cx="-5" cy="-2" r="1" fill="#FFFFFF"/>
  <circle cx="9" cy="-2" r="1" fill="#FFFFFF"/>
  <path d="M-2.5,8.6 L3.5,7.6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  // 처진 눈썹 + 시무룩한 입 + 땀방울
  sad: `
  <path d="M-11,-2 L-4,-4.5" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M4,-4.5 L11,-2" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="-7" cy="2" rx="2.8" ry="3" fill="${INK}"/>
  <ellipse cx="7" cy="2" rx="2.8" ry="3" fill="${INK}"/>
  <circle cx="-6.2" cy="1" r="0.9" fill="#FFFFFF"/>
  <circle cx="7.8" cy="1" r="0.9" fill="#FFFFFF"/>
  <path d="M-3.5,10 Q0,7 3.5,10" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <path d="M15,-11 Q18,-6 15,-4 Q12,-6 15,-11 Z" fill="#8EC5FF" stroke="${INK}" stroke-width="1.2"/>`,
};

const pawn = (face = 'normal') => `
  <path d="M-11,22 Q-14,38 -24,44 L24,44 Q14,38 11,22 Z" fill="${BRAND.mint}" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>
  <rect x="-16" y="15" width="32" height="8" rx="4" fill="${BRAND.mint}" stroke="${INK}" stroke-width="3.6"/>
  <circle cx="0" cy="0" r="18" fill="${BRAND.mint}" stroke="${INK}" stroke-width="3.6"/>
  <ellipse cx="-7" cy="-9" rx="4.5" ry="2.8" fill="#FFFFFF"/>
  <ellipse cx="-12.5" cy="8" rx="4.5" ry="2.6" fill="${BRAND.blush}"/>
  <ellipse cx="12.5" cy="8" rx="4.5" ry="2.6" fill="${BRAND.blush}"/>${FACES[face]}`;

// 180x180 좌표계의 캡슐. 원 중심 (90, 99), 반지름 78
// 다른 유명 디자인(반반 나뉜 공 + 가운데 띠 + 버튼)과 겹치지 않도록:
// 경계를 중심보다 아래(y=110)에 두고, 가운데 잠금쇠 없이, 아래 반쪽 테두리(립)가 원 밖으로 살짝 튀어나오게 함
const capsule = (face = 'normal') => `
  <defs><clipPath id="dome"><path d="M12.8,110 A78,78 0 1 1 167.2,110 Z"/></clipPath></defs>
  <path d="M12.8,110 A78,78 0 1 1 167.2,110 Z" fill="${BRAND.clear}"/>
  <g clip-path="url(#dome)"><g transform="translate(90,62) scale(1.85)">${pawn(face)}</g></g>
  <path d="M26,86 A66,66 0 0 1 48,46" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
  <path d="M12.8,110 A78,78 0 1 1 167.2,110" fill="none" stroke="${BRAND.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M12.8,110 A78,78 0 0 0 167.2,110 Z" fill="${BRAND.butter}" stroke="${BRAND.ink}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="6.8" y="103" width="166.4" height="13" rx="6.5" fill="${BRAND.butter}" stroke="${BRAND.ink}" stroke-width="5"/>`;

// scale: 캡슐이 캔버스에서 차지하는 비율을 조절 (1이면 테두리 립 포함 폭이 약 97%)
const buildIconSvg = ({ background, scale, size, face = 'normal' }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="${size}" height="${size}">
${background ? `<rect width="180" height="180" fill="${background}"/>` : ''}
<g transform="translate(90 90) scale(${scale}) translate(-90 -99)">${capsule(face)}</g>
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

const TARGETS = [
  // iOS/기본 아이콘: 배경 꽉 채움 (iOS는 모서리를 자동으로 둥글게 자르고, Expo가 투명도를 제거함)
  { name: 'icon', out: 'assets/icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: BRAND.mintLight, scale: 0.9, size: 1024 }) },
  // Android 적응형 아이콘 전경: 런처가 어떤 모양으로 잘라도 안전하도록 전체(립 끝 포함)를 캔버스 지름 61% 원 안에
  { name: 'adaptive-icon', out: 'assets/adaptive-icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: null, scale: 0.63, size: 1024 }) },
  // 스플래시 가운데 이미지 (배경색은 app.json에서 지정)
  { name: 'splash-icon', out: 'assets/splash-icon.png', width: 1024, height: 1024, svg: buildIconSvg({ background: null, scale: 0.95, size: 1024 }) },
  // Android 알림 작은 아이콘 96x96 (흰색 실루엣)
  { name: 'notification-icon', out: 'assets/notification-icon.png', width: 96, height: 96, svg: NOTIFICATION_SVG },
  // 게임 화면 마스코트 표정 5종 (말풍선 옆 아바타)
  ...Object.keys(FACES).map(face => ({
    name: `mascot-${face}`,
    out: `assets/mascot/${face}.png`,
    width: 192,
    height: 192,
    svg: buildIconSvg({ background: null, scale: 0.95, size: 192, face }),
  })),
  // Google Play 스토어 아이콘 512x512 (꽉 찬 정사각형, 모서리는 스토어가 둥글게 처리)
  { name: 'play-icon', out: 'assets/store/play-icon.png', width: 512, height: 512, svg: buildIconSvg({ background: BRAND.mintLight, scale: 0.9, size: 512 }) },
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
  mkdirSync(join(ROOT, 'assets', 'mascot'), { recursive: true });
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
