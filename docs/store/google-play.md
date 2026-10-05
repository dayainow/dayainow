# Google Play 출시 가이드 — 캡슐체스

> 작성: 2026-10-05 · 대상: 개인 계정(2023-11-13 이후 생성) → **비공개 테스트 테스터 12명 × 14일 필수**

이 문서의 답변은 **지금 버전 기준**이다(광고·분석·결제 없음, 데이터 수집 없음). 광고나 결제를 넣으면 "앱 콘텐츠" 답변과 개인정보처리방침을 반드시 같이 고친다.

## 0. 먼저 준비할 것

| 항목 | 상태 | 비고 |
|---|---|---|
| 개인정보처리방침 페이지 | 초안 완료 `site/privacy/index.html` | **문의 이메일 넣고 공개 주소에 올려야 함** (아래 4번) |
| 스토어 아이콘 512×512 | `assets/store/play-icon.png` | |
| 대표 이미지 1024×500 | `assets/store/feature-ko.png`, `feature-en.png` | |
| 휴대폰 스크린샷 1080×2160 | `assets/store/screenshots/ko/`, `en/` (각 6장) | `node scripts/store-screenshots.mjs`로 다시 찍기 |
| 첫 AAB | 아직 | `npx eas-cli build -p android --profile production` |
| 테스터 12명 이상 | 모집 필요 | Gmail(구글 계정) 이메일 주소 |

## 1. 앱 만들기

Play Console → **앱 만들기**

- 앱 이름: `캡슐체스: 3분 미니 체스`
- 기본 언어: 한국어 – ko-KR
- 앱 또는 게임: **게임**
- 무료 또는 유료: **무료** (나중에 유료로 바꿀 수 없음. 광고 제거는 인앱 구매로)
- 선언 2개 체크

## 2. 앱 콘텐츠 (대시보드 → 앱 설정)

| 항목 | 답변 |
|---|---|
| 개인정보처리방침 | 공개 주소 입력 (4번 참고) |
| 앱 액세스 권한 | **모든 기능을 특별한 액세스 권한 없이 사용 가능** (로그인 없음) |
| 광고 | **아니요, 앱에 광고가 없습니다** ← 광고 넣으면 "예"로 변경 |
| 콘텐츠 등급 | 아래 설문 답변 → 예상 등급: 전체이용가 / PEGI 3 / ESRB Everyone |
| 타겟층 | **13–15세, 16–17세, 18세 이상** 선택 (아래 주의 참고) |
| 뉴스 앱 | 아니요 |
| 정부 앱 | 아니요 |
| 금융 기능 | 해당 없음 |
| 건강 앱 | 아니요 |
| 데이터 보안 | 아래 답변 |
| 광고 ID | **광고 ID를 사용하지 않음** ← 광고 SDK 넣으면 변경 |

### 콘텐츠 등급 설문 (IARC)

- 카테고리: **게임**
- 폭력, 공포, 성적 콘텐츠, 비속어, 약물·술·담배: 모두 **아니요**
- 도박(실제 돈·모의 도박): **아니요**
- 사용자 간 소통·콘텐츠 교환(채팅 등): **아니요** (결과 공유는 기기 기본 공유 기능만 씀)
- 위치 공유: **아니요**
- 디지털 상품 구매: **아니요** ← 광고 제거 구매 넣으면 "예"

### 타겟층 주의

- 13세 미만을 포함하면 **가족 정책**이 적용되어, 나중에 광고를 넣을 때 인증된 광고 SDK만 쓸 수 있는 등 제약이 커진다. 그래서 **13세 이상**으로 시작한다.
- 귀여운 캐릭터 때문에 "어린이의 관심을 끌 수 있는가" 질문이 나오면 사실대로 답한다. 예시:
  > 귀여운 그림체를 사용하지만 체스 규칙과 전략을 다루는 일반 보드게임이며, 13세 이상 이용자를 대상으로 합니다.

### 데이터 보안

- 앱이 필수 사용자 데이터 유형을 수집하거나 공유하나요? → **아니요**
  - 진행 기록·설정은 기기 안에만 저장되고 외부로 보내지 않음. Google 기준으로 기기 안에서만 처리되는 데이터는 "수집"이 아님.
- 그 뒤 질문(암호화, 삭제 요청)은 "아니요"를 고르면 나오지 않음.

## 3. 스토어 등록정보

### 한국어 (기본)

**앱 이름** (30자 이내)
```
캡슐체스: 3분 미니 체스
```

**간단한 설명** (80자 이내)
```
5×5 작은 판에서 3분이면 끝나는 귀여운 미니 체스. 매일 퍼즐과 20단계 도전!
```

**자세한 설명** (4000자 이내)
```
캡슐 하나에 체스 한 판을 담았어요!

캡슐체스는 5×5 작은 판에서 두는 미니 체스예요. 킹, 퀸, 룩, 비숍, 나이트, 폰까지 모든 기물이 다 들어 있지만, 판이 작아서 한 판이 3분이면 끝나요. 출퇴근길이나 쉬는 시간에 스낵처럼 즐겨 보세요.

■ 오늘의 퍼즐
매일 새로운 "N수 만에 메이트" 퍼즐이 열려요. 같은 날엔 모두 같은 문제를 풀어요. 연속 기록을 이어 가고 결과를 친구에게 공유해 보세요.

■ 단계별 도전 20단계
4개의 캡슐, 20단계의 AI와 차례로 겨뤄요. 적은 수로 이길수록 별을 더 많이 받아요.

■ 체스가 처음이어도 괜찮아요
8개의 짧은 레슨으로 기물 움직이는 법부터 체크메이트까지 배워요.

■ 자유 대전
AI 난이도(쉬움·보통·어려움)를 골라 연습하거나, 기기 하나로 친구와 대결하세요.

■ 이런 점이 좋아요
• 인터넷 연결 없이 플레이
• 회원가입 없음, 개인정보 수집 없음
• 귀여운 캡슐 효과음과 진동
• 한국어·영어 지원

[캡슐체스 규칙]
• 폰은 처음에도 한 칸만 앞으로 가요.
• 캐슬링과 앙파상은 없어요.
• 폰이 끝 줄에 닿으면 퀸이 돼요.
```

**그래픽**: 앱 아이콘 `play-icon.png`, 대표 이미지 `feature-ko.png`, 휴대폰 스크린샷 `screenshots/ko/01~06`

**분류**: 게임 → 보드 · 태그: 보드, 퍼즐, 캐주얼, 싱글 플레이어, 오프라인

**연락처**: 이메일(필수, 스토어에 공개됨), 웹사이트(선택: 개인정보처리방침 주소)

### 영어 (번역 추가: 스토어 등록정보 → 번역 관리 → English (United States))

**App name**
```
Capsule Chess: Mini Chess
```

**Short description**
```
Cute 5×5 mini chess you can finish in 3 minutes. Daily puzzles & 20 stages!
```

**Full description**
```
A whole game of chess, packed into one tiny capsule!

Capsule Chess is mini chess on a 5×5 board. Every piece is there — king, queen, rook, bishop, knight and pawns — but the small board means a game takes about 3 minutes. Perfect for your commute or a coffee break.

■ Daily Puzzle
A new "mate in N" puzzle every day, the same for everyone. Keep your streak going and share your result with friends.

■ 20-stage Challenge
Work your way through 4 capsules and 20 AI opponents. Win in fewer moves to earn more stars.

■ New to chess? No problem
8 bite-sized lessons take you from how the pieces move all the way to checkmate.

■ Free Play
Practice against the AI (Easy, Normal or Hard) or play a friend on one device.

■ Why you'll love it
• Plays offline
• No sign-up, no personal data collected
• Cute capsule sound effects and haptics
• Korean and English

[Capsule Chess rules]
• Pawns move one square forward, even on their first move.
• No castling and no en passant.
• A pawn that reaches the last row becomes a queen.
```

**Graphics**: `play-icon.png`, `feature-en.png`, `screenshots/en/01~06`

## 4. 개인정보처리방침 공개하기

1. `site/privacy/index.html`의 `[문의 이메일]`, `[contact email]`을 실제 이메일로 바꾼다 (스토어에도 공개되는 주소).
2. 공개 주소에 올린다. 가장 쉬운 방법:
   - **Netlify Drop**: app.netlify.com/drop 에 `site` 폴더를 끌어다 놓으면 바로 주소가 생김
   - **GitHub Pages**: 공개 저장소(예: `capsule-chess-site`)에 `site` 내용을 올리고 Pages 켜기 → `https://dayainow.github.io/capsule-chess-site/privacy/`
   - 나중에 `capsulechess.app` 도메인을 사면 그 주소로 옮김
3. 앱 콘텐츠 → 개인정보처리방침에 주소 입력

## 5. 비공개 테스트 시작

1. 테스트 및 출시 → 테스트 → **비공개 테스트** → 트랙(기본 "Closed testing") 관리
2. **테스터** 탭: 이메일 목록 만들기 → 테스터 12명 이상 Gmail 주소 추가 → 저장
3. **국가/지역**: 대한민국(필요하면 추가)
4. **새 버전 만들기** → EAS로 만든 `.aab` 업로드
   - Google 정책상 **첫 업로드는 반드시 Play Console에서 직접** 해야 함. 이후에는 `eas submit`으로 자동화 가능
   - 앱 서명: Google Play 앱 서명 사용(기본값). EAS가 업로드 키를 관리
5. 출시 노트 예시: `첫 비공개 테스트 버전입니다. 버그나 불편한 점을 알려 주세요!`
6. 검토 시작 → Google 검토(몇 시간~며칠) 후 테스터용 링크 활성화
7. 테스트 탭의 **참여 링크**를 테스터에게 전달 → 각자 "테스터 되기" 수락 후 설치
8. **12명 이상이 14일 연속으로 참여 상태 유지** (중간에 나가면 기간이 다시 늘어날 수 있음)
9. 14일이 지나면 대시보드 → **프로덕션 액세스 신청** (테스트 방식·받은 피드백·수정 내용 질문에 답함)

## 6. 테스터 모집 메시지 (복사해서 쓰기)

```
안녕하세요! 제가 만든 미니 체스 게임 "캡슐체스"를 구글 플레이에 출시하려고 하는데,
출시 전에 테스터 12명이 2주 동안 참여해야 해서 도움을 부탁드려요 🙏

✔ 안드로이드 폰 + 구글(Gmail) 계정만 있으면 돼요
✔ 앱을 설치하고 2주 동안 지우지만 않으면 돼요 (가끔 한 판씩 해 주면 더 좋아요!)
✔ 5×5 작은 판이라 한 판에 3분, 매일 퍼즐도 있어요

참여해 주실 분은 구글 계정 이메일을 알려 주세요. 초대 링크를 보내 드릴게요!
```
