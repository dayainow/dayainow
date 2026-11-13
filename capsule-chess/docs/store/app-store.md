# 캡슐체스 App Store 제출 준비

첫 제출의 기준은 현재 소스에 있는 오프라인 게임이다. 광고, 앱 내 구매, 외부 분석은 추가하지 않았다. 무료 또는 유료 다운로드 가격은 출시 전에 결정한다.

- 앱 이름: 한국어 **캡슐체스**, 영어 **Capsule Chess**, 일본어 **カプセルチェス**
- 번들 ID: `com.dayainow.capsulechess`
- 버전: `1.0.0`
- 플랫폼: iPhone 및 iPad. `supportsTablet: true` 설정을 유지한다.
- 기본 카테고리 후보: 게임 → 보드

## 스토어 문구

### 한국어

부제: **5×5 판에서 즐기는 미니 체스**

작은 5×5 판에서 체스 한 판을 즐겨 보세요. 캡슐을 열고 기물 몬스터를 만나면 첫 대전이 시작됩니다.

- 캡슐 리그에서 20단계에 도전하고 별과 배지를 모으세요.
- 오늘의 퍼즐을 풀거나 퍼즐 도장에서 120개 문제를 연습하세요.
- 기물별 레슨으로 움직이는 법부터 체크메이트까지 배울 수 있어요.
- 세 가지 난이도의 AI와 대전하거나, 한 기기에서 친구와 번갈아 두세요.

진행은 기기에 저장됩니다. 한국어, 영어, 일본어로 플레이할 수 있어요.

키워드 후보: `체스,미니체스,체스퍼즐,체크메이트,보드게임,오프라인`

### English

Subtitle: **Quick chess on a 5×5 board**

Open your first capsule, meet your piece monsters, and play a quick game of chess on a 5×5 board.

- Win stars and badges across 20 stages in the Capsule League.
- Try a new daily puzzle or practice with 120 puzzles.
- Learn how each piece moves and work your way up to checkmate.
- Play an AI opponent at three difficulty levels or take turns with a friend on one device.

Progress is saved on your device. Play in English, Korean, or Japanese.

Keyword candidates: `mini chess,board game,checkmate,puzzle,offline,local multiplayer`

### 日本語

サブタイトル: **5×5の盤で遊ぶミニチェス**

最初のカプセルを開けて、駒のモンスターたちと5×5の盤でチェスを楽しみましょう。

- カプセルリーグの20ステージに挑戦して、星とバッジを集めましょう。
- 毎日のパズルに挑戦したり、パズル道場で120問を練習したりできます。
- 駒の動かし方からチェックメイトまで、レッスンで学べます。
- 3つの強さのAIと対戦したり、1台の端末で友達と交互に指したりできます。

進行状況は端末に保存されます。日本語、英語、韓国語で遊べます。

キーワード候補: `ミニチェス,ボードゲーム,パズル,チェックメイト,オフライン`

## 가입 전 확인

1. `npm ci`, `npm test -- --runInBand`, `npx tsc --noEmit`, `npx expo export --platform all`을 실행한다.
2. [Expo iOS 시뮬레이터 빌드](https://docs.expo.dev/build-reference/simulators/)는 `npx eas-cli build --platform ios --profile ios-simulator`로 만들 수 있다. Expo 계정과 빌드 사용량을 확인하고 실행한다. 설치·실행에는 Xcode의 iOS Simulator가 필요하다.
3. iPhone과 iPad에서 첫 실행, 첫 대전, AI 응답, 데일리 퍼즐, 저장 후 재실행, 공유 및 선택 알림을 확인한다. 앱의 실제 실행 화면으로 [Apple 규격](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)에 맞는 iPhone과 iPad 스크린샷을 캡처한다. 기존 1080×2160 PNG는 Play용이다.
4. 공개 [지원 페이지](https://dayainow.github.io/dayainow/site/)와 [개인정보처리방침](https://dayainow.github.io/dayainow/site/privacy/)이 로그인 없이 열리는지 확인한다. 지원 요청은 공개 GitHub 이슈로 연결한다.
5. 공개할 정책 링크를 앱에서 찾기 쉽게 연결하고 [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/) 응답을 최종 번들과 대조한다. 현재 앱 소스의 분석 이벤트는 외부 전송 대상이 연결되어 있지 않다. 최종 SDK 동작과 네이티브 개인정보 매니페스트는 배포 빌드에서 확인한다.

## 가입 후 제출

1. App Store Connect에 앱을 만들고 위 번들 ID를 연결한다. [앱 추가 안내](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
2. `npx eas-cli build --platform ios --profile production`으로 서명된 빌드를 만들고 해당 빌드를 TestFlight에 올린다. 내부 테스터로 실기기에서 확인한다.
3. 최종 빌드를 기준으로 스크린샷·소개·지원 URL·개인정보처리방침 URL·연령 등급·수출 규정 답변을 채운다. 심사 메모에 로그인 없이 첫 캡슐을 열고 대전을 시작할 수 있다고 안내한다.
4. 유료 다운로드로 결정하면 유료 앱 계약, 정산 정보와 가격 설정을 마친 뒤 심사에 제출한다.

2026-11-13에 자동 테스트 143개, 타입 검사, iOS·Android·웹 번들 생성, iOS prebuild를 확인했다. Expo SDK 57 권장 패치로 맞춘 뒤에도 테스트와 번들 생성이 통과했다. iOS 서명 빌드와 실기기 실행은 별도로 확인한다.

2026-11-13 기준 운영 의존성 감사에서 6개 항목이 남았다. 높은 등급의 3개 항목은 Expo Router의 URL 처리 의존성 체인에 속한다. Expo SDK 57 권장 버전에는 자동 해결 경로가 없으므로 심사 제출 전에 호환 가능한 패치와 딥링크 동작을 확인한다.
