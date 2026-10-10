// 캡슐몬 기물: 체스 실루엣(왕관·탑·말머리·주교관·동그란 머리)을 그대로 살린 몬스터.
// 게임 중 한눈에 어떤 기물인지 읽히는 것이 먼저라, 윤곽은 체스 기물 그대로 두고 얼굴·발·팀 색으로 생명을 넣음.
// 100x100 좌표계 SVG 조각을 돌려줌 (앱 이미지 빌드와 디자인 시안에서 함께 씀)

export const INK = '#2E2A3A';
export const GOLD = '#FFD23F';
const GEM = '#7EE0C3'; // 킹 왕관 보석
const WHITE = '#FFFFFF';
const S = 4.5; // 외곽선 굵기

export const TEAMS = {
  w: { name: 'blue', body: '#58AEFF', shade: '#2E86E8', light: '#D6ECFF', blush: '#FF9AA2' },
  b: { name: 'red', body: '#FF6B6B', shade: '#D9404A', light: '#FFE0E0', blush: '#FFC2C7' },
};

const line = (extra = '') => `stroke="${INK}" stroke-width="${S}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;

const feet = t => `
  <ellipse cx="39" cy="91" rx="9" ry="5.5" fill="${t.shade}" ${line()}/>
  <ellipse cx="61" cy="91" rx="9" ry="5.5" fill="${t.shade}" ${line()}/>`;

// 아래가 넓은 종 모양 몸통 (폰·비숍·퀸·킹 공통)
const bell = (t, top, half) => `
  <path d="M28,88 Q27,${top + 12} ${50 - half},${top} L${50 + half},${top} Q73,${top + 12} 72,88 Q50,94 28,88 Z" fill="${t.body}" ${line()}/>
  <path d="M38,86 Q37,${top + 16} 44,${top + 6}" fill="none" stroke="${t.light}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>`;

const collar = (t, y, w) => `<rect x="${50 - w / 2}" y="${y}" width="${w}" height="9" rx="4.5" fill="${t.shade}" ${line()}/>`;

const eye = (x, y, r = 1) => `
  <ellipse cx="${x}" cy="${y}" rx="${3.4 * r}" ry="${4 * r}" fill="${INK}"/>
  <circle cx="${x + 1.1 * r}" cy="${y - 1.5 * r}" r="${1.3 * r}" fill="${WHITE}"/>`;

const blush = (t, x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="2.5" fill="${t.blush}" opacity="0.95"/>`;

const smile = (x, y, w = 4) => `<path d="M${x - w},${y} Q${x},${y + 4} ${x + w},${y}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;

const shine = (x, y, rx = 5, ry = 3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${WHITE}" opacity="0.85"/>`;

const PIECES = {
  // 폰: 캡슐에서 막 나온 아기 몬스터 (마스코트와 같은 종)
  P: t => `${feet(t)}${bell(t, 62, 10)}${collar(t, 56, 32)}
  <circle cx="50" cy="36" r="22" fill="${t.body}" ${line()}/>
  ${shine(41, 24, 6, 3.4)}
  ${eye(42, 38, 1.1)}${eye(58, 38, 1.1)}
  ${blush(t, 35, 46)}${blush(t, 65, 46)}
  ${smile(50, 46.5)}`,

  // 나이트: 갈기가 몽글몽글한 망아지, 눈썹으로 씩씩하게
  N: t => `${feet(t)}
  <circle cx="58" cy="24" r="6.5" fill="${t.shade}" ${line()}/>
  <circle cx="66" cy="32" r="6.5" fill="${t.shade}" ${line()}/>
  <circle cx="71" cy="42" r="6.5" fill="${t.shade}" ${line()}/>
  <circle cx="72" cy="53" r="6.5" fill="${t.shade}" ${line()}/>
  <path d="M30,88 Q28,74 37,64 L31,59 Q20,56 21,47 Q22,37 34,31 L39,15 L48,25 Q63,25 67,40 Q72,55 68,68 Q70,79 70,88 Q50,94 30,88 Z" fill="${t.body}" ${line()}/>
  <ellipse cx="52" cy="76" rx="9" ry="9" fill="${t.light}" opacity="0.9"/>
  ${shine(46, 32, 4.5, 2.6)}
  <path d="M34,32.5 L44,35.5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  ${eye(40, 42, 1.08)}
  <ellipse cx="25.5" cy="47" rx="1.6" ry="2" fill="${INK}"/>
  <path d="M25,53.5 Q29,56 33,54" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  ${blush(t, 48, 50)}`,

  // 비숍: 주교관 머리의 느긋한 현자, 눈웃음
  B: t => `${feet(t)}${bell(t, 68, 9)}${collar(t, 61, 28)}
  <path d="M50,13 Q71,29 67,46 Q65,60 50,62 Q35,60 33,46 Q29,29 50,13 Z" fill="${t.body}" ${line()}/>
  <path d="M54.5,22 L63,33" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
  <circle cx="50" cy="11" r="5" fill="${GOLD}" ${line()}/>
  ${shine(42, 30, 3.5, 5)}
  <path d="M40.5,46 Q44,41.5 47.5,46" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M52.5,46 Q56,41.5 59.5,46" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
  ${blush(t, 38, 51)}${blush(t, 62, 51)}
  ${smile(50, 52, 3.5)}`,

  // 룩: 성벽을 머리에 인 듬직한 탑 몬스터
  R: t => `${feet(t)}
  <path d="M31,88 L34,46 L66,46 L69,88 Q50,94 31,88 Z" fill="${t.body}" ${line()}/>
  <path d="M39,84 L40.5,54" stroke="${t.light}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  <path d="M27,48 L27,24 L37,24 L37,31 L45,31 L45,24 L55,24 L55,31 L63,31 L63,24 L73,24 L73,48 Z" fill="${t.shade}" ${line()}/>
  ${shine(32, 30, 2.2, 3.5)}
  <path d="M40,56 L46,58" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M60,56 L54,58" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  ${eye(43.5, 64)}${eye(56.5, 64)}
  ${blush(t, 38, 71)}${blush(t, 62, 71)}
  <path d="M44,72 Q50,78 56,72 Z" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,

  // 퀸: 별빛 왕관을 쓴 당찬 몬스터, 속눈썹
  Q: t => `${feet(t)}${bell(t, 62, 10)}${collar(t, 56, 30)}
  <circle cx="50" cy="40" r="19" fill="${t.body}" ${line()}/>
  <path d="M33,31 L35,13 L43,23 L50,9 L57,23 L65,13 L67,31 Q50,26 33,31 Z" fill="${GOLD}" ${line()}/>
  <circle cx="35" cy="12" r="3.4" fill="${GOLD}" ${line('stroke-width="3"')}/>
  <circle cx="50" cy="8" r="3.4" fill="${GOLD}" ${line('stroke-width="3"')}/>
  <circle cx="65" cy="12" r="3.4" fill="${GOLD}" ${line('stroke-width="3"')}/>
  ${eye(43, 42, 1.05)}${eye(57, 42, 1.05)}
  <path d="M38.5,38 L36.5,36.5 M61.5,38 L63.5,36.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  ${blush(t, 36.5, 49)}${blush(t, 63.5, 49)}
  ${smile(50, 49.5, 3.5)}`,

  // 킹: 십자 왕관 + 콧수염의 다정한 대장
  K: t => `${feet(t)}${bell(t, 62, 11)}${collar(t, 56, 32)}
  <circle cx="50" cy="42" r="19" fill="${t.body}" ${line()}/>
  <path d="M34,32 L34,22 Q50,12 66,22 L66,32 Q50,28 34,32 Z" fill="${GOLD}" ${line()}/>
  <path d="M47,4 L53,4 L53,9 L58,9 L58,15 L53,15 L53,20 L47,20 L47,15 L42,15 L42,9 L47,9 Z" fill="${GOLD}" ${line('stroke-width="3.4"')}/>
  <circle cx="50" cy="26" r="2.6" fill="${GEM}" ${line('stroke-width="2"')}/>
  ${eye(43, 42, 1.05)}${eye(57, 42, 1.05)}
  ${blush(t, 36, 49)}${blush(t, 64, 49)}
  <path d="M42.5,50.5 Q46.5,46.5 50,50 Q53.5,46.5 57.5,50.5 Q53.5,53.5 50,51.5 Q46.5,53.5 42.5,50.5 Z" fill="${INK}"/>`,
};

// 기물 하나의 SVG (예: piece('w', 'N')). 레드 나이트는 마주 보도록 좌우 반전
export const piece = (team, type, size = 100) => {
  const t = TEAMS[team];
  const body = PIECES[type](t);
  const flip = team === 'b' && type === 'N' ? ' transform="translate(100,0) scale(-1,1)"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><g${flip}>${body}</g></svg>`;
};

export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
