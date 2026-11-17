# Google Play 출시 가이드 — 캡슐체스

> 작성: 2026-10-05 · 갱신: 2026-11-16 · 대상: 개인 계정(2023-11-13 이후 생성) → **비공개 테스트 테스터 12명 × 14일 필수**

아래 답변은 광고·외부 분석 없이 일회성 앱 내 구매를 사용하는 현재 코드 기준의 초안이다. 최종 빌드와 비교해 데이터 보안 및 정책을 확정한다.

## 0. 먼저 준비할 것

| 항목 | 상태 | 비고 |
|---|---|---|
| 개인정보처리방침 페이지 | 한국어·영어 `site/privacy/index.html` (+ 소개 페이지 `site/index.html`) | **공개 주소 확인 및 스토어 문의 이메일 입력** (아래 4번, GitHub Pages) |
| 스토어 아이콘 512×512 | `assets/store/play-icon.png` | |
| 대표 이미지 1024×500 | `assets/store/feature-ko.png`, `feature-en.png` | `node design/feature.mjs`로 다시 만들기 |
| 휴대폰 스크린샷 1080×2160 | `assets/store/screenshots/ko/`, `en/` (각 6장) | `node scripts/store-screenshots.mjs`로 다시 찍기 |
| 첫 AAB | EAS 빌드 완료 후 Expo 빌드 페이지에서 내려받기 | `npx eas-cli build -p android --profile production` |
| 테스터 12명 이상 | 모집 필요 | Gmail(구글 계정) 이메일 주소 |

## 1. 앱 만들기

Play Console → **앱 만들기**

- 앱 이름: `캡슐체스: 몬스터 미니 체스`
- 기본 언어: 한국어 – ko-KR
- 앱 또는 게임: **게임**
- 무료 또는 유료: **무료**. [전체 게임 상품](monetization.md)은 일회성 앱 내 구매로 설정한다.
- 선언 2개 체크

## 2. 앱 콘텐츠 (대시보드 → 앱 설정)

| 항목 | 답변 |
|---|---|
| 개인정보처리방침 | 공개 주소 입력 (4번 참고) |
| 앱 액세스 권한 | 앱 계정이나 로그인이 없다. 첫 캡슐 등 무료 범위와 설정의 전체 게임 구매 경로를 심사 메모에 설명한다. Play Console이 유료 콘텐츠 접근 안내를 요청하면 내부 테스트에서 검증한 접근 방법을 입력한다. |
| 광고 | **아니요, 앱에 광고가 없습니다** ← 광고 넣으면 "예"로 변경 |
| 콘텐츠 등급 | 아래 설문 답변 → 예상 등급: 전체이용가 / PEGI 3 / ESRB Everyone |
| 타겟층 | 의도한 연령층을 확인한 후 선택 (아래 참고) |
| 뉴스 앱 | 아니요 |
| 정부 앱 | 아니요 |
| 금융 기능 | 해당 없음 |
| 건강 앱 | 아니요 |
| 데이터 보안 | 아래 답변 |
| 광고 ID | **광고 ID를 사용하지 않음** ← 광고 SDK 넣으면 변경 |

> 알림: 퍼즐 알림(POST_NOTIFICATIONS)은 사용자가 앱 안에서 켤 때만 권한을 묻고, 기기 안에서 예약된다. 정확한 알람 권한은 쓰지 않는다.
>
> 별점 요청: Google Play 인앱 리뷰 API(공식 평가 창)만 쓰고, 별점·리뷰 내용은 앱이 받지 않는다 → 데이터 수집 아님. 공식 평가 창은 사전 만족도 질문이나 보상 없이 요청한다.

### 콘텐츠 등급 설문 (IARC)

- 카테고리: **게임**
- 폭력, 공포, 성적 콘텐츠, 비속어, 약물·술·담배: 모두 **아니요**
- 도박(실제 돈·모의 도박): **아니요**
- 사용자 간 소통·콘텐츠 교환(채팅 등): **아니요** (결과 공유는 기기 기본 공유 기능만 씀)
- 위치 공유: **아니요**
- 디지털 상품 구매: **예**. 전체 게임을 여는 일회성 구매가 있다.

### 타겟층 주의

- 실제로 의도한 연령층과 홍보 문구를 확인한 뒤 답한다. 13세 미만을 타깃층에 포함하면 Google Play 가족 정책이 적용된다.
- 귀여운 캐릭터 때문에 "어린이의 관심을 끌 수 있는가" 질문이 나오면 사실대로 답한다. 예시:
  > 귀여운 그림체를 사용하지만 체스 규칙과 전략을 다루는 일반 보드게임이며, 13세 이상 이용자를 대상으로 합니다.

### 데이터 보안

- 진행 기록과 설정은 앱이 개발자 서버로 보내지 않는다. 마지막으로 확인한 이용 권한은 기기에 저장한다.
- 스토어 결제와 복원은 Google Play Billing으로 처리한다. 최종 번들의 SDK와 실제 결제 흐름을 [데이터 보안 양식 안내](https://support.google.com/googleplay/android-developer/answer/10787469)와 대조해 답변을 확정한다.

## 3. 스토어 등록정보

### 한국어 (기본)

**앱 이름** (30자 이내)
```
캡슐체스: 몬스터 미니 체스
```

**간단한 설명** (80자 이내)
```
귀여운 몬스터와 즐기는 5×5 미니 체스. 캡슐 리그, 매일 퍼즐, 폰 진화까지
```

**자세한 설명** (4000자 이내)
```
캡슐에서 튀어나온 체스 몬스터들과 한 판 붙어 볼까요?

캡슐체스는 5×5 작은 판에서 두는 미니 체스예요. 킹, 퀸, 룩, 비숍, 나이트, 폰까지 모든 기물이 귀여운 몬스터가 되어 등장하고, 짧은 한 판을 즐길 수 있어요.

■ 캡슐 리그
4개의 캡슐, 20명의 레드 팀 상대와 차례로 배틀! 캡슐마다 마지막엔 마스터전이 기다려요. 적은 수로 이길수록 별을 더 받고, 캡슐을 모두 깨면 배지를 모아요.

■ 폰이 퀸으로 진화!
폰이 끝 줄에 닿는 순간, 반짝반짝 진화 연출과 함께 퀸으로 변신해요.

■ 오늘의 퍼즐
매일 새로운 "N수 만에 메이트" 퍼즐. 같은 날엔 모두 같은 문제를 풀어요. 연속 기록을 이어 가고 결과 카드를 친구에게 공유해 보세요.

■ 퍼즐 도장 120문제
1수 메이트부터 3수 메이트까지, 쉬운 문제부터 차근차근 실력을 키워요.

■ 체스가 처음이어도 괜찮아요
8개의 짧은 레슨과 첫 배틀 손가락 가이드로 기물 움직이는 법부터 체크메이트까지 배워요. 규칙은 언제든 ? 버튼으로 다시 볼 수 있어요.

■ 모으는 재미
업적 15종을 달성하면 숲·바다·사탕·밤하늘 같은 새 판이 열려요.

■ 자유 대전
AI 난이도(쉬움·보통·어려움)를 골라 연습하거나, 기기 하나로 친구와 대결하세요.

■ 이런 점이 좋아요
• 광고 없이 오프라인 플레이
• 회원가입 없음
• 첫 캡슐 5단계, 오늘의 퍼즐, 도장 10문제, 레슨과 자유 대전은 무료. 한 번 구매하면 리그 15단계와 도장 110문제가 추가돼요.
• 손맛 나는 효과음과 진동
• 한국어·영어 지원. 앱 설정에서 변경 가능

[캡슐체스 규칙]
• 폰은 처음에도 한 칸만 앞으로 가요.
• 캐슬링과 앙파상은 없어요.
• 폰이 끝 줄에 닿으면 퀸으로 진화해요.
```

**그래픽**: 앱 아이콘 `play-icon.png`, 대표 이미지 `feature-ko.png`, 휴대폰 스크린샷 `screenshots/ko/01~06`

**분류**: 게임 → 보드 · 태그: 보드, 퍼즐, 캐주얼, 싱글 플레이어, 오프라인

**연락처**: 이메일(필수, 스토어에 공개됨), 웹사이트(선택: 개인정보처리방침 주소)

### 영어 (번역 추가: 스토어 등록정보 → 번역 관리 → English (United States))

**App name**
```
Capsule Chess: Monster Mini
```

**Short description**
```
Quick 5×5 chess with monster pieces, daily puzzles, and an offline campaign.
```

**Full description**
```
Chess monsters just popped out of their capsules. Ready to battle?

Capsule Chess is mini chess on a 5×5 board. Every piece is a monster, from the king and queen to the pawns. Play a quick match on a small board.

■ Capsule League
Battle 20 Red team opponents across 4 capsules, each ending in a Master battle. Win in fewer moves to earn more stars, and collect a badge for every capsule you clear.

■ Pawns evolve!
The moment a pawn reaches the far row, it sparkles and evolves into a Queen.

■ Daily Puzzle
A new "mate in N" puzzle every day, the same for everyone. Keep your streak going and share your result card with friends.

■ Puzzle Dojo: 120 puzzles
From mate in 1 to mate in 3, sharpen your skills step by step.

■ New to chess? No problem
8 bite-sized lessons and a first-battle finger guide take you from how the pieces move all the way to checkmate. Tap ? anytime to see the rules.

■ Collect them all
Earn 15 achievements to unlock new boards like Forest, Ocean, Candy and Night Sky.

■ Free Play
Practice against the AI (Easy, Normal or Hard) or play a friend on one device.

■ Why you'll love it
• Play offline without ads
• No sign-up
• Play 5 league stages, the Daily Puzzle, 10 Dojo puzzles, lessons, and Free Play for free. A one-time purchase unlocks 15 more stages and 110 Dojo puzzles.
• Satisfying sound effects and haptics
• Switch between English and Korean in Settings

[Capsule Chess rules]
• Pawns move one square forward, even on their first move.
• No castling and no en passant.
• A pawn that reaches the last row evolves into a queen.
```

**Graphics**: `play-icon.png`, `feature-en.png`, `screenshots/en/01~06`

## 4. 소개·지원 및 개인정보처리방침 공개

1. 저장소 `dayainow/dayainow`의 **Settings → Pages**에서 Source를 **GitHub Actions**로 설정한다.
2. **Actions → Publish Capsule Chess web → Run workflow**를 실행한다.
3. 로그인하지 않은 브라우저에서 아래 주소가 열리는지 확인한다. 앱 설정의 개인정보처리방침 링크도 같은 주소를 사용한다.
   - 개인정보처리방침: `https://dayainow.github.io/dayainow/site/privacy/`
   - 소개·지원: `https://dayainow.github.io/dayainow/site/`
4. Play Console의 개인정보처리방침 URL과 개발자 연락처를 입력한다. 공개 문의 이메일은 계정 소유자가 관리하는 주소를 사용한다.

## 5. 비공개 테스트 시작

1. 테스트 및 출시 → 테스트 → **비공개 테스트** → 트랙(기본 "Closed testing") 관리
2. **테스터** 탭: 이메일 목록 만들기 → 테스터 12명 이상 Gmail 주소 추가 → 저장
   - 가능하면 내부 테스트에서 먼저 [라이선스 테스터](https://developer.android.com/google/play/billing/test)를 이용해 결제를 확인한다. 테스트 트랙 참여자도 라이선스 테스터가 아니면 앱 내 구매 시 실제 청구될 수 있다.
3. **국가/지역**: 대한민국(필요하면 추가)
4. **새 버전 만들기** → EAS로 만든 `.aab` 업로드
   - Play Developer API를 쓰기 전에 **첫 업로드는 Play Console에서 직접** 한다. 이후에는 `eas submit`으로 자동화 가능
   - 앱 서명: Google Play 앱 서명 사용(기본값). EAS가 업로드 키를 관리
   - 번들 검사에서 Android 16(API 36) 이상을 타깃으로 하는지와 네이티브 라이브러리의 16KB 페이지 크기 지원을 확인한다. [타깃 API](https://support.google.com/googleplay/android-developer/answer/11926878) · [16KB 지원](https://developer.android.com/guide/practices/page-sizes)
5. 출시 노트 예시: `첫 비공개 테스트 버전입니다. 버그나 불편한 점을 알려 주세요!`
6. 검토 시작 → Google 검토(몇 시간~며칠) 후 테스터용 링크 활성화
7. 테스트 탭의 **참여 링크**를 테스터에게 전달 → 각자 "테스터 되기" 수락 후 설치
8. **12명 이상이 14일 연속으로 참여 상태 유지** (중간에 나가면 기간이 다시 늘어날 수 있음)
9. 14일이 지나면 대시보드 → **프로덕션 액세스 신청** (테스트 방식·받은 피드백·수정 내용 질문에 답함)

## 6. 테스터 모집 메시지 (복사해서 쓰기)

```
안녕하세요! 제가 만든 몬스터 미니 체스 게임 "캡슐체스"를 구글 플레이에 출시하려고 하는데,
출시 전에 테스터 12명이 2주 동안 참여해야 해서 도움을 부탁드려요 🙏

✔ 안드로이드 폰과 Google 계정이 필요해요
✔ 초대 링크에서 참여를 누르고 14일 동안 참여 상태를 유지해 주세요. 직접 플레이하고 불편한 점을 알려 주시면 도움이 됩니다.
✔ 5×5 작은 판에서 몬스터 기물로 대전하고, 캡슐 리그와 매일 퍼즐을 즐길 수 있어요
✔ 체스를 몰라도 손가락 가이드와 레슨으로 바로 배울 수 있어요

참여해 주실 분은 구글 계정 이메일을 알려 주세요. 초대 링크를 보내 드릴게요!
```
