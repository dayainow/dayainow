// "캡슐 리그" 디자인 시안: 몬스터 배틀 RPG 감성(팀 색 · 배틀 창 · 대사 상자 · 진화 · 배지)
// 사용: node design/concept.mjs  → design/out/concept-screens.png, concept-system.png
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLD, INK, TEAMS, piece } from './creatures.mjs';
import { FONT_LINK, closeRenderer, renderHtml } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
mkdirSync(OUT, { recursive: true });

const png = path => `data:image/png;base64,${readFileSync(join(HERE, '..', path)).toString('base64')}`;
const MASCOT = png('assets/splash-icon.png');

const C = {
  ink: INK,
  sky: '#E4F3FF',
  cream: '#FFFBF3',
  mint: '#6FDDB7',
  mintLight: '#CFF3E4',
  sun: GOLD,
  blue: TEAMS.w.body,
  blueDark: TEAMS.w.shade,
  red: TEAMS.b.body,
  redDark: TEAMS.b.shade,
  soft: '#6E6878',
  hpGreen: '#4CD38A',
};

const css = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Jua', sans-serif; color: ${C.ink}; background: #DCEBFA; }
  .page { padding: 48px; }
  .title { font-size: 44px; margin: 0; }
  .sub { font-size: 20px; color: ${C.soft}; margin: 6px 0 34px; }
  .phones { display: flex; gap: 34px; align-items: flex-start; }
  .cap { font-size: 22px; text-align: center; margin-top: 14px; }
  .capsub { font-size: 16px; color: ${C.soft}; text-align: center; margin-top: 4px; }

  .phone { width: 360px; height: 760px; border: 8px solid ${C.ink}; border-radius: 46px; overflow: hidden; position: relative;
           background: ${C.sky}; box-shadow: 0 14px 0 rgba(46,42,58,.18); }
  .status { height: 30px; display: flex; justify-content: space-between; padding: 8px 22px 0; font-family: 'Fredoka'; font-size: 13px; }
  .dots { background-image: radial-gradient(rgba(88,174,255,.18) 2px, transparent 2.5px); background-size: 18px 18px; }

  /* RPG 창: 잉크 외곽선 + 안쪽 밝은 테두리 + 아래 그림자 */
  .win { background: #fff; border: 4px solid ${C.ink}; border-radius: 18px; box-shadow: inset 0 0 0 3px #E8F2FF, 0 5px 0 ${C.ink}; }
  .btn { display: flex; align-items: center; justify-content: center; gap: 6px; border: 4px solid ${C.ink}; border-radius: 18px;
         box-shadow: 0 5px 0 ${C.ink}; font-size: 20px; padding: 10px 14px; white-space: nowrap; flex-shrink: 0; }
  .btn.sun { background: ${C.sun}; } .btn.white { background: #fff; } .btn.blue { background: ${C.blue}; color: #fff; text-shadow: 0 2px 0 ${C.blueDark}; }
  .btn.red { background: ${C.red}; color: #fff; text-shadow: 0 2px 0 ${C.redDark}; }
  .chip { display: inline-flex; align-items: center; gap: 4px; border: 3px solid ${C.ink}; border-radius: 999px; padding: 2px 10px; font-size: 15px; background: #fff; }
  .tag { display: inline-block; font-size: 13px; padding: 2px 9px; border-radius: 999px; color: ${C.ink}; border: 2.5px solid ${C.ink}; }

  .hp { height: 14px; border: 3px solid ${C.ink}; border-radius: 999px; background: #E9E4EF; overflow: hidden; }
  .hp > i { display: block; height: 100%; background: ${C.hpGreen}; border-radius: 999px; box-shadow: inset 0 3px 0 rgba(255,255,255,.45); }

  .board { display: grid; grid-template-columns: repeat(5, 60px); border: 5px solid ${C.ink}; border-radius: 20px; overflow: hidden; box-shadow: 0 7px 0 ${C.ink}; }
  .cell { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; position: relative; }
  .l { background: ${C.cream}; } .d { background: ${C.mintLight}; }
  .last { background: #FFF1B8 !important; } .check { background: #FFC7CC !important; }
  .dot::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: rgba(46,42,58,.25); }

  .dialog { position: absolute; left: 14px; right: 14px; padding: 14px 18px 16px; font-size: 19px; line-height: 1.45; }
  .dialog .more { position: absolute; right: 16px; bottom: 8px; font-size: 14px; color: ${C.red}; }

  .badge { width: 46px; height: 46px; border-radius: 50%; border: 4px solid ${C.ink}; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 -5px 0 rgba(0,0,0,.12); }
  .badge.off { background: #E3E0E8 !important; }
  .badge.off svg { filter: grayscale(1) brightness(1.6) opacity(.35); }
`;

const BADGES = [
  { color: C.mint, piece: ['w', 'P'] },
  { color: C.blue, piece: ['w', 'N'] },
  { color: '#B18CFF', piece: ['w', 'B'] },
  { color: C.sun, piece: ['w', 'Q'] },
];
const badge = (b, on = true, size = 46) =>
  `<div class="badge ${on ? '' : 'off'}" style="background:${b.color};width:${size}px;height:${size}px">${piece(b.piece[0], b.piece[1], size * 0.78)}</div>`;

const boardHtml = (rows, { last = [], check = null, dots = [] } = {}) => `
  <div class="board">${rows
    .map((row, r) =>
      row
        .map((p, c) => {
          const cls = [(r + c) % 2 ? 'd' : 'l'];
          if (last.some(([lr, lc]) => lr === r && lc === c)) cls.push('last');
          if (check && check[0] === r && check[1] === c) cls.push('check');
          if (dots.some(([dr, dc]) => dr === r && dc === c)) cls.push('dot');
          return `<div class="cell ${cls.join(' ')}">${p ? piece(p[0], p[1], 54) : ''}</div>`;
        })
        .join('')
    )
    .join('')}</div>`;

// 1) 홈: 트레이너 카드 + 배지 케이스 + 오늘의 퍼즐 퀘스트
const home = `
<div class="phone dots">
  <div class="status"><span>9:41</span><span>●●● ▮</span></div>
  <div style="padding: 8px 18px;">
    <div class="win" style="display:flex;align-items:center;gap:12px;padding:12px 14px;">
      <img src="${MASCOT}" style="width:58px;height:58px">
      <div style="flex:1">
        <div style="font-size:21px">캡슐 트레이너</div>
        <div style="display:flex;gap:6px;margin-top:4px"><span class="chip">🔥 6</span><span class="chip">★ 23</span></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div class="btn white" style="width:38px;height:38px;padding:0;border-radius:50%;font-size:18px;box-shadow:0 3px 0 ${C.ink}">?</div>
      </div>
    </div>

    <div class="win" style="margin-top:14px;padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:17px">🏅 배지 케이스</span><span style="font-size:14px;color:${C.soft}">2 / 4</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px">${BADGES.map((b, i) => badge(b, i < 2, 54)).join('')}</div>
    </div>

    <div class="win" style="margin-top:16px;padding:14px;background:${C.sun};position:relative">
      <span class="tag" style="background:${C.red};color:#fff;position:absolute;top:-12px;right:14px;font-size:14px">NEW!</span>
      <div style="font-size:15px;color:#7A5B00">오늘의 퍼즐 #12</div>
      <div style="font-size:27px;margin-top:2px">2수 만에 메이트!</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
        <span style="font-size:15px">오늘 풀면 🔥 7일 연속</span>
        <div class="btn white" style="padding:8px 16px;font-size:19px">도전 ▶</div>
      </div>
    </div>

    <div class="win" style="margin-top:16px;padding:12px;display:flex;gap:10px;align-items:center">
      <div style="width:60px;height:60px;flex-shrink:0;border-radius:16px;border:3px solid ${C.ink};background:#FFE0E0;display:flex;align-items:center;justify-content:center">${piece('b', 'N', 52)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;color:${C.soft}">캡슐 리그 · 캡슐 2</div>
        <div style="font-size:18px;white-space:nowrap">다음 상대: 날쌘 레드</div>
        <div style="display:flex;gap:5px;margin-top:7px">${[1, 1, 0, 0, 0].map(v => `<i style="width:22px;height:9px;border-radius:5px;border:2px solid ${C.ink};background:${v ? C.mint : '#fff'}"></i>`).join('')}</div>
      </div>
      <div class="btn blue" style="padding:8px 12px;font-size:18px">배틀</div>
    </div>

    <div style="display:flex;gap:12px;margin-top:16px">
      <div class="win" style="flex:1;padding:12px;display:flex;align-items:center;gap:8px">${piece('w', 'B', 40)}<div><div style="font-size:18px">캡슐 도감</div><div style="font-size:13px;color:${C.soft}">규칙 · 기물</div></div></div>
      <div class="win" style="flex:1;padding:12px;display:flex;align-items:center;gap:8px">${piece('w', 'K', 40)}<div><div style="font-size:18px">자유 대전</div><div style="font-size:13px;color:${C.soft}">AI · 친구</div></div></div>
    </div>
  </div>
</div>`;

// 2) 단계 시작: VS 화면
const vs = `
<div class="phone" style="background:linear-gradient(160deg, ${C.red} 0 47%, ${C.ink} 47% 48.4%, ${C.blue} 48.4% 100%)">
  <div class="status" style="color:#fff"><span>9:41</span><span>●●● ▮</span></div>
  <div style="text-align:center;margin-top:16px"><span class="win" style="display:inline-block;padding:6px 16px;font-size:17px">캡슐 1 · 5단계 · 마스터전</span></div>
  <div style="position:absolute;right:20px;top:100px;text-align:center">
    <div style="width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center">${piece('b', 'K', 150)}</div>
    <div class="win" style="padding:6px 14px;font-size:19px;margin-top:-6px">레드 마스터 <span style="color:${C.redDark}">Lv.5</span></div>
  </div>
  <div style="position:absolute;left:50%;top:276px;transform:translateX(-50%) rotate(-8deg);font-family:'Fredoka';font-size:84px;font-weight:700;color:${C.sun};
              -webkit-text-stroke:6px ${C.ink};paint-order:stroke fill;text-shadow:0 6px 0 ${C.ink}">VS</div>
  <div style="position:absolute;left:20px;top:356px;text-align:center">
    <div style="width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center">${piece('w', 'P', 150)}</div>
    <div class="win" style="padding:6px 14px;font-size:19px;margin-top:-6px">나 · 블루 팀</div>
  </div>
  <div class="win dialog" style="bottom:22px">
    레드 마스터가 승부를 걸어왔다!<br><span style="font-size:15px;color:${C.soft}">★★★ 조건: 21수 안에 이기기 · 상대 기물 전부 출전</span>
    <span class="more">▼</span>
  </div>
</div>`;

// 3) 배틀 화면: 상대/내 정보 창 + 판 + 대사 상자
const battleRows = [
  ['bR', 'bN', 'bB', 'bQ', 'bK'],
  ['bP', 'bP', 'wN', 'bP', 'bP'],
  [null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', null, 'wB', 'wQ', 'wK'],
];
const teamPanel = (team, name, sub, hp, max) => `
  <div class="win" style="padding:9px 12px;display:flex;align-items:center;gap:10px">
    <div style="width:44px;height:44px;border-radius:12px;border:3px solid ${C.ink};background:${team === 'b' ? '#FFE0E0' : '#D6ECFF'};display:flex;align-items:center;justify-content:center">${piece(team, 'K', 38)}</div>
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;font-size:17px"><span>${name}</span><span style="font-size:14px;color:${C.soft}">${sub}</span></div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <span style="font-family:'Fredoka';font-size:12px;background:${C.ink};color:${C.sun};border-radius:6px;padding:0 5px">전력</span>
        <div class="hp" style="flex:1"><i style="width:${(hp / max) * 100}%;${hp / max < 0.5 ? `background:${C.sun}` : ''}"></i></div>
        <span style="font-family:'Fredoka';font-size:13px">${hp}/${max}</span>
      </div>
    </div>
  </div>`;
const battle = `
<div class="phone dots">
  <div class="status"><span>9:41</span><span>●●● ▮</span></div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 16px 10px">
    <span style="font-size:22px">‹ 캡슐 2 · 3단계</span>
    <span class="chip" style="background:${C.sun}">?</span>
  </div>
  <div style="padding:0 14px">${teamPanel('b', '레드 팀', '체크!', 24, 25)}</div>
  <div style="display:flex;justify-content:center;margin:16px 0 18px">${boardHtml(battleRows, { last: [[2, 0], [1, 2]], check: [0, 4] })}</div>
  <div style="padding:0 14px">${teamPanel('w', '블루 팀 (나)', '내가 둔 수 6', 25, 25)}</div>
  <div class="win dialog" style="bottom:86px">블루 나이트의 점프 공격!<br>레드 킹에게 <b style="color:${C.redDark}">체크</b>! 룩도 노리고 있다!<span class="more">▼</span></div>
  <div style="position:absolute;left:14px;right:14px;bottom:18px;display:flex;gap:10px">
    <div class="btn white" style="flex:1;font-size:18px">↶ 무르기</div>
    <div class="btn white" style="flex:1;font-size:18px">↻ 처음부터</div>
  </div>
</div>`;

// 4) 승급 = 진화 연출
const rays = Array.from({ length: 16 }, (_, i) => `<i style="position:absolute;left:50%;top:50%;width:520px;height:34px;margin:-17px 0 0 -260px;background:rgba(255,255,255,.13);transform:rotate(${i * 22.5}deg)"></i>`).join('');
const evolve = `
<div class="phone" style="background:radial-gradient(circle at 50% 42%, #9FD3FF 0, ${C.blue} 45%, ${C.blueDark} 100%)">
  <div class="status" style="color:#fff"><span>9:41</span><span>●●● ▮</span></div>
  <div style="position:absolute;inset:0;overflow:hidden">${rays}</div>
  <div style="position:absolute;left:0;right:0;top:70px;text-align:center;font-size:30px;color:#fff;text-shadow:0 3px 0 ${C.blueDark}, 0 0 14px rgba(255,255,255,.6)">✨ 진화! ✨</div>
  <div style="position:absolute;left:34px;top:250px;opacity:.9;filter:brightness(0) invert(1) drop-shadow(0 0 10px #fff)">${piece('w', 'P', 90)}</div>
  <div style="position:absolute;left:132px;top:282px;font-size:34px;color:#fff">➜</div>
  <div style="position:absolute;right:28px;top:170px;filter:drop-shadow(0 0 18px rgba(255,255,255,.9))">${piece('w', 'Q', 190)}</div>
  ${['14%:22%', '80%:18%', '18%:62%', '86%:58%', '50%:12%', '62%:70%'].map(p => { const [x, y] = p.split(':'); return `<span style="position:absolute;left:${x};top:${y};font-size:22px;color:${C.sun}">✦</span>`; }).join('')}
  <div class="win dialog" style="bottom:100px">축하해요! 끝 줄에 닿은<br>블루 폰이 <b style="color:${C.blueDark}">퀸</b>으로 진화했다!<span class="more">▼</span></div>
  <div style="position:absolute;left:14px;right:14px;bottom:24px"><div class="btn sun">계속하기</div></div>
</div>`;

const screens = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${css}</style></head><body><div class="page">
  <h1 class="title">캡슐 리그 — 디자인 시안 v1</h1>
  <div class="sub">몬스터 배틀 RPG 감성: 팀 색 몬스터 · 배틀 창 · 대사 상자 · 진화 · 배지 (폰트: 주아)</div>
  <div class="phones">
    <div>${home}<div class="cap">① 홈</div><div class="capsub">트레이너 카드 · 배지 케이스 · 퍼즐 퀘스트</div></div>
    <div>${vs}<div class="cap">② 단계 시작</div><div class="capsub">VS 연출 + 상대 소개 + ★ 조건</div></div>
    <div>${battle}<div class="cap">③ 배틀</div><div class="capsub">전력 게이지 · 실황 대사 · 3D 버튼</div></div>
    <div>${evolve}<div class="cap">④ 진화</div><div class="capsub">폰이 끝 줄에 닿으면 퀸으로 진화 연출</div></div>
  </div>
</div></body></html>`;

// 디자인 시스템 한 장: 색 · 글꼴 · 부품
const swatch = (color, name, hex) => `<div style="text-align:center"><div style="width:110px;height:80px;border-radius:18px;border:4px solid ${C.ink};background:${color};box-shadow:0 5px 0 ${C.ink}"></div><div style="font-size:18px;margin-top:10px">${name}</div><div style="font-family:Fredoka;font-size:14px;color:${C.soft}">${hex}</div></div>`;
const system = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${css}</style></head><body><div class="page" style="width:1520px">
  <h1 class="title">디자인 시스템</h1>
  <div class="sub">굵은 잉크 외곽선 + 쨍한 팀 색 + 아래 그림자로 '스티커·장난감' 같은 손맛</div>
  <div style="display:flex;gap:22px">
    ${swatch(C.blue, '블루 팀', C.blue)}${swatch(C.red, '레드 팀', C.red)}${swatch(C.sun, '선샤인', C.sun)}${swatch(C.mint, '캡슐 민트', C.mint)}${swatch(C.sky, '하늘 배경', C.sky)}${swatch(C.cream, '크림 칸', C.cream)}${swatch(C.ink, '잉크', C.ink)}
  </div>
  <div style="display:flex;gap:40px;margin-top:44px;align-items:flex-start">
    <div class="win" style="padding:22px 26px;width:470px">
      <div style="font-size:16px;color:${C.soft}">제목 · 본문 — 주아 (OFL 무료 글꼴)</div>
      <div style="font-size:40px;margin-top:6px">배틀 시작!</div>
      <div style="font-size:22px;margin-top:4px">레드 마스터가 승부를 걸어왔다!</div>
      <div style="font-size:16px;color:${C.soft};margin-top:18px">숫자 · 영문 — Fredoka</div>
      <div style="font-family:Fredoka;font-weight:700;font-size:40px">CAPSULE CHESS 24/25</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;width:300px">
      <div class="btn sun">도전 ▶</div><div class="btn blue">배틀</div><div class="btn white">↶ 무르기</div><div class="btn red">기권</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;width:560px">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <span class="tag" style="background:${C.mint};font-size:16px">점프</span><span class="tag" style="background:${C.blue};font-size:16px">직진</span>
        <span class="tag" style="background:#B18CFF;font-size:16px">대각</span><span class="tag" style="background:${C.sun};color:${C.ink};font-size:16px">진화</span>
        <span class="chip">🔥 6</span><span class="chip">★ 23</span>
      </div>
      ${teamPanel('b', '레드 팀', 'Lv.4', 16, 25)}
      <div class="win" style="padding:14px 18px;font-size:19px;position:relative">블루 비숍의 대각선 공격! 레드 룩을 잡았다!<span style="position:absolute;right:14px;bottom:6px;font-size:14px;color:${C.red}">▼</span></div>
      <div style="display:flex;gap:14px;align-items:center">${BADGES.map(b => badge(b, true, 64)).join('')}<span style="font-size:17px;color:${C.soft}">캡슐 1~4 배지</span></div>
    </div>
  </div>
</div></body></html>`;

await renderHtml(screens, join(OUT, 'concept-screens.png'), { width: 1640, scale: 1.25 });
await renderHtml(system, join(OUT, 'concept-system.png'), { width: 1620, scale: 1.1 });
await closeRenderer();
console.log('✓ design/out/concept-screens.png, concept-system.png');
