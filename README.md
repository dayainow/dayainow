# 캡슐체스 (Capsule Chess)

5×5 작은 판에서 3분 안에 끝나는 미니 체스를, 귀여운 **몬스터 배틀 RPG** 감성으로 만든 Expo(React Native) 앱. iOS·Android 출시 준비 중.

<p>
  <img src="assets/store/screenshots/ko/01-home.png" width="180" alt="홈" />
  <img src="assets/store/screenshots/ko/03-versus.png" width="180" alt="VS 화면" />
  <img src="assets/store/screenshots/ko/02-battle.png" width="180" alt="배틀" />
  <img src="assets/store/screenshots/ko/05-evolution.png" width="180" alt="진화" />
</p>

- 출시 계획과 진행 체크리스트: [docs/ROADMAP.md](docs/ROADMAP.md)
- UX·디자인 기획과 변경 기록: [docs/ux/UX_PLAN.md](docs/ux/UX_PLAN.md) · 디자인 시안: [docs/design/](docs/design/)
- 처음 만든 웹 프로토타입: [dayainow/dayainow](https://github.com/dayainow/dayainow)의 `minichess-prototype`

## 게임 구성

| 모드 | 내용 |
|---|---|
| **캡슐 리그** | 캡슐 4개 × 5단계, 상대 20명(캡슐마다 마스터전). 단계 시작 VS 화면, 별 3개 목표(무르기 없이), 캡슐을 다 깨면 배지 |
| **오늘의 퍼즐** | 매일 하나, 전 세계 같은 문제(2·3수 메이트). 연속 기록 🔥, 결과 공유 카드, 아침 9시 알림 |
| **퍼즐 도장** | 오늘의 퍼즐과 겹치지 않는 연습 퍼즐 120개 (1수 → 2수 → 3수, 순서대로 열림) |
| **체스 배우기** | 기물별 레슨 8개 (★ 모으기, 체크 벗어나기, 체크메이트) |
| **자유 대전** | AI(쉬움·보통·어려움) 또는 친구와 한 기기로 2인 대전 |

공통 요소: 첫 실행 **"첫 캡슐 열기"**(톡톡톡 → 블루 팀 등장 → 바로 첫 배틀), 기물 몬스터 12종, 배틀 손맛(잡기 반짝이·전력 -N·체크/체크메이트 도장), 실황 대사 상자, 전력 게이지, 폰 → 퀸 **진화 연출**, 업적 15종, 첫 배틀 손가락 가이드, 어디서나 여는 규칙 안내(? 버튼), 판 꾸미기(업적 보상 7종), 한국어·영어·일본어.

**규칙(일반 체스와 다른 점)**: 5×5 판 · 폰은 처음에도 한 칸 · 캐슬링·앙파상 없음 · 끝 줄에 닿은 폰은 자동으로 퀸 · 둘 곳이 없거나 킹만 남으면 무승부.

## 실행

```bash
npm install
npx expo start        # Expo Go 앱으로 QR 코드를 찍어 휴대폰에서 실행 (알림 기능만 빼고 확인 가능)
npm run web           # 브라우저에서 실행
npm test              # 자동 테스트 (Jest)
```

## 구조

| 경로 | 내용 |
|---|---|
| `app/` | 화면 (expo-router): 홈, 캡슐 리그 지도·배틀, 오늘의 퍼즐, 퍼즐 도장, 배우기, 자유 대전, 업적, 설정 |
| `src/engine/` | 규칙 엔진, AI(미니맥스 + 실수 확률), N수 메이트 풀이기 |
| `src/campaign/` | 20단계 난이도 표(`stages.ts`), 캡슐·상대·배지(`league.ts`) |
| `src/game/` | 한 판 상태(`useChessGame`), 퍼즐 풀이(`usePuzzle`), 실황 대사, 전력 계산, 첫 배틀 가이드 |
| `src/puzzles/` | 데일리 퍼즐 550개(`bank.json`), 퍼즐 도장 120개(`practice.json`) |
| `src/achievements/` | 업적 15종 판정과 달성 알림 이벤트 |
| `src/ui/boardThemes.ts` | 판 테마 7종 (업적 보상) |
| `src/components/` | 보드(이동·손가락 가이드), VS 화면, 진화 연출, 결과·공유 카드, 규칙 안내, 업적 알림 |
| `src/ui/` | 디자인 시스템 부품: 패널, 장난감 버튼, 대사 상자, 전력 게이지, 기물 이미지, 배지, 글꼴 |
| `src/feedback/` | 효과음 + 진동 |
| `src/storage/` | 설정·진행 기록 저장 (AsyncStorage, 저장은 한 줄로 차례 처리) |
| `src/i18n/` | 한국어·영어·일본어 문구 (기기 언어로 자동 선택) |
| `design/` | 기물 몬스터 원본(SVG 코드), 디자인 시안, 스토어 대표 이미지 |

## 디자인

"캡슐 리그": 굵은 잉크 외곽선 + 쨍한 블루·레드 팀 색 + 아래 그림자로 장난감·스티커 같은 손맛. 기물은 체스 실루엣을 그대로 살린 몬스터(얼굴·발·팀 색)라서 처음 보는 사람도 어떤 기물인지 바로 알아봄. 글꼴은 주아(한국어)·모치이 팝 원(일본어)·Fredoka(영어), 모두 OFL.

포켓몬 같은 몬스터 배틀 **감성**만 가져오고, 다른 작품의 이름·캐릭터·공 모양·로고 글꼴·유명 대사는 쓰지 않음.

## 생성 스크립트

에셋과 데이터는 스크립트로 만들어져 있어서, 숫자만 바꾸고 다시 실행하면 됨. 브라우저가 필요한 스크립트는 로컬 Edge/Chrome을 씀(`BROWSER_PATH`로 지정 가능).

```bash
node scripts/build-pieces.mjs       # 기물 몬스터 12종 PNG (design/creatures.mjs → assets/pieces/)
node scripts/build-icons.mjs        # 앱 아이콘·스플래시·마스코트 표정
node scripts/build-sounds.mjs       # 효과음 합성
node design/concept.mjs             # 디자인 시안 이미지
node design/feature.mjs             # 스토어 대표 이미지 (1024×500, 한·영·일)
node --no-warnings --import ./scripts/register-ts.mjs scripts/generate-puzzles.ts 400 150                       # 데일리 퍼즐
node --no-warnings --import ./scripts/register-ts.mjs scripts/generate-puzzles.ts 60 30 20261011 30 practice.json # 퍼즐 도장
node --no-warnings --import ./scripts/register-ts.mjs scripts/campaign-balance.ts 40                              # 단계 난이도 시뮬레이션
node scripts/store-screenshots.mjs  # 스토어 스크린샷 (개발 서버를 켠 상태에서)
node scripts/smoke-web.mjs          # 웹에서 모든 화면을 열어 오류 점검 (개발 서버를 켠 상태에서)
```

스토어 등록 절차와 입력할 내용: [docs/store/google-play.md](docs/store/google-play.md)

## 빌드 (EAS)

Expo 프로젝트 `@dayainow/capsule-chess`에 연결되어 있음. 앱 서명 키는 Expo 서버에 보관.

```bash
npx eas-cli build -p android --profile preview      # 내 휴대폰에 바로 설치할 APK
npx eas-cli build -p android --profile production   # Google Play용 AAB
```

APK를 직접 설치하면 Play 프로텍트가 "처음 보는 앱"으로 막을 수 있음 → 차단 창의 "자세히 보기 → 그래도 설치". 경고 없이 설치하려면 Play Console 내부 테스트로 배포.
