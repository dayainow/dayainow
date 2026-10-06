# 캡슐체스 (Capsule Chess)

5×5 작은 판에서 3분 안에 끝나는 귀여운 미니 체스. Expo(React Native) 앱으로 iOS·Android에 출시 준비 중.

- 출시 계획과 진행 체크리스트: [docs/ROADMAP.md](docs/ROADMAP.md)
- 원래 프로토타입: [dayainow/dayainow](https://github.com/dayainow/dayainow)의 `tiny-chess-app`

## 실행

```bash
npm install
npx expo start        # Expo Go 앱으로 QR 코드를 찍어 휴대폰에서 실행
npm run web           # 브라우저에서 실행
npm test              # 자동 테스트 (Jest)
```

## 구조

| 경로 | 내용 |
|---|---|
| `app/` | 화면 (expo-router): 홈, 체스 배우기, 오늘의 퍼즐, 단계별 도전, 자유 대전, 설정 |
| `src/engine/` | 규칙 엔진, AI(미니맥스 + 실수 확률), N수 메이트 풀이기 |
| `src/campaign/stages.ts` | 단계별 도전 20단계 난이도 표 |
| `src/puzzles/` | 데일리 퍼즐 뱅크(550개)와 날짜별 선택 |
| `src/tutorial/` | 튜토리얼 레슨 8개 |
| `src/components/` | 보드(이동 애니메이션), 결과 팝업, 색종이, 환영 안내 |
| `src/feedback/` | 효과음 + 진동 |
| `src/storage/` | 설정·진행 기록 저장 (AsyncStorage) |
| `src/i18n/` | 한국어·영어 문구 (기기 언어로 자동 선택) |
| `src/theme.ts` | 캡슐 브랜드 색상 |

## 생성 스크립트

에셋과 데이터는 스크립트로 만들어져 있어서, 숫자만 바꾸고 다시 실행하면 됨.

```bash
node scripts/build-icons.mjs        # 앱 아이콘·스플래시 (로컬 Edge/Chrome 필요)
node scripts/build-sounds.mjs       # 효과음 합성
node --no-warnings --import ./scripts/register-ts.mjs scripts/generate-puzzles.ts 400 150   # 데일리 퍼즐 뱅크
node --no-warnings --import ./scripts/register-ts.mjs scripts/campaign-balance.ts 40        # 단계 난이도 시뮬레이션
node scripts/store-screenshots.mjs  # 스토어 스크린샷 (npm run web을 켠 상태에서)
```

스토어 등록 절차와 입력할 내용: [docs/store/google-play.md](docs/store/google-play.md)

## 빌드 (EAS)

```bash
npx eas-cli build -p android --profile preview      # 내 휴대폰에 바로 설치할 APK
npx eas-cli build -p android --profile production   # Google Play용 AAB
```
