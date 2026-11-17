# 캡슐체스 App Store 제출 준비

첫 제출은 무료로 설치하는 광고 없는 게임이다. 전체 게임은 [비소모성 앱 내 구입](monetization.md) 한 번으로 연다.

- 앱 이름: 한국어 **캡슐체스**, 영어 **Capsule Chess**
- 번들 ID: `com.dayainow.capsulechess`
- 버전: `1.0.0`
- 플랫폼: iPhone 및 iPad
- 기본 카테고리 후보: 게임 → 보드

## 스토어 문구

### 한국어

부제: **5×5 판에서 즐기는 미니 체스**

작은 5×5 판에서 체스 한 판을 즐겨 보세요. 캡슐을 열고 기물 몬스터를 만나면 첫 대전이 시작됩니다.

- 캡슐 리그에서 20단계에 도전하고 별과 배지를 모으세요.
- 오늘의 퍼즐을 풀거나 퍼즐 도장에서 120개 문제를 연습하세요.
- 기물별 레슨으로 움직이는 법부터 체크메이트까지 배울 수 있어요.
- 세 가지 난이도의 AI와 대전하거나, 한 기기에서 친구와 번갈아 두세요.

첫 캡슐 5단계, 오늘의 퍼즐, 도장 10문제, 레슨과 자유 대전을 무료로 즐겨 보세요. 나머지 리그 15단계와 도장 110문제는 앱 내 구입 한 번으로 열 수 있어요. 광고와 회원가입 없이 오프라인으로 플레이할 수 있어요. 진행은 기기에 저장되며, 설정에서 한국어와 영어를 바꿀 수 있어요.

키워드 후보: `체스,미니체스,체스퍼즐,체크메이트,보드게임,오프라인`

### English

Subtitle: **Quick chess on a 5×5 board**

Open your first capsule, meet your piece monsters, and play a quick game of chess on a 5×5 board.

- Win stars and badges across 20 stages in the Capsule League.
- Try a new daily puzzle or practice with 120 puzzles.
- Learn how each piece moves and work your way up to checkmate.
- Play an AI opponent at three difficulty levels or take turns with a friend on one device.

Play the first capsule with 5 stages, the Daily Puzzle, the first 10 Dojo puzzles, lessons, and Free Play for free. A one-time in-app purchase unlocks 15 more league stages and 110 more Dojo puzzles. Play offline without ads or an account. Progress is saved on your device. Switch between English and Korean in Settings.

Keyword candidates: `mini chess,board game,checkmate,puzzle,offline,local multiplayer`

## 제출 정보

- 지원 URL: `https://dayainow.github.io/dayainow/site/`
- 개인정보처리방침 URL: `https://dayainow.github.io/dayainow/site/privacy/`
- 한국어와 영어 등록정보를 App Store Connect에 각각 추가한다.
- 출시 노트: `캡슐체스 첫 출시. 5×5 대전, 캡슐 리그, 매일 퍼즐과 퍼즐 도장을 만나 보세요.`
- Release notes: `First release. Play 5×5 chess, take on the Capsule League, and try the Daily Puzzle and Puzzle Dojo.`

심사 메모

> Capsule Chess is an offline 5×5 chess game. Open the first capsule, then choose Start first battle to try the guided match. The home screen gives access to the Capsule League, Daily Puzzle, Puzzle Dojo, lessons, and AI or same-device two-player matches. No login is required. Settings contains the English and Korean language options and the privacy policy. The daily puzzle reminder is optional and uses local notifications. To review the non-consumable purchase, skip the first capsule animation by choosing Explore the home screen, then go to Settings → Unlock the full game. You can purchase or restore there without clearing stages.

## 서명 빌드 전

1. `npm ci`, `npm test -- --runInBand`, `npx tsc --noEmit`, `npx expo export --platform all`을 실행한다.
2. [Google Play 가이드의 공개 절차](google-play.md#4-소개지원-및-개인정보처리방침-공개)에 따라 지원 및 정책 페이지를 게시하고 앱 설정에서 링크가 열리는지 확인한다.
3. `npx eas-cli build --platform ios --profile ios-simulator`로 시뮬레이터 빌드를 만들 수 있다. 로컬 실행에는 Xcode와 iOS Simulator가 필요하다. 배포 바이너리의 SDK는 [Apple 제출 요건](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)에 따라 Xcode 26 및 iOS 26 SDK 이상이어야 한다. 이 프로젝트의 SDK 57용 빌드 이미지를 EAS에서 사용한다.
4. 한국어·영어 각각 iPhone과 iPad에서 첫 캡슐, 첫 배틀, AI 응답, 퍼즐, 공유, 언어·진행 기록 재실행 후 유지, 알림 및 정책 링크를 확인한다. [스크린샷 규격](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)에 맞는 실제 앱 화면을 캡처한다. 예를 들어 iPhone은 1320×2868, iPad는 2064×2752 세로 크기를 쓸 수 있다.

## App Store Connect 제출

1. App Store Connect에 앱을 만들고 위 번들 ID를 연결한다. [앱 추가 안내](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
2. `npx eas-cli build --platform ios --profile production`으로 서명된 빌드를 만들고 TestFlight에 업로드한다. 내부 테스터로 실기기를 확인한다.
3. 최종 빌드와 SDK를 대조하여 [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/), 연령 등급, 수출 규정, 심사 연락처를 입력한다. 개인정보 라벨 후보는 ‘수집하는 데이터 없음’이다. 최종 네이티브 개인정보 매니페스트와 SDK 동작을 확인한다.
4. 앱 가격은 무료로 설정하고 [전체 게임 상품](monetization.md)을 등록한다. 유료 앱 계약, 세금·은행 정보와 [한국 스토어 등록 정보](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-korea-compliance-information/)를 확인한다. 앱 버전과 최초 비소모성 앱 내 구입은 [같이 심사에 제출한다](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase).
5. 언어별 스크린샷, 소개, 지원·정책 URL 및 심사 메모를 등록한 뒤 심사에 제출한다.

최신 의존성 감사와 제출 보류 항목은 [출시 체크리스트](release-checklist.md)를 따른다. 보안 수정 후 출시 빌드의 딥링크를 검증한다.
