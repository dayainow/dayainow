<div align="center">

# Personal Projects

### 아이디어를 직접 만들어 보고, 쓸 만한 것은 제품으로 남기는 개발자

웹·모바일·백엔드·3D·AI 워크플로우까지 **여러 스택과 방법을 직접 시도**해 왔습니다.  
공공데이터 앱, 커뮤니티, AI 큐레이션 플랫폼, 감정 일기, 에이전트 하네스까지 — 빠르게 프로토타입하고, 검증된 패턴은 재사용 가능한 구조로 정리합니다.

[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat-square&logo=github)](https://github.com/dayainow)
[![TypeScript](https://img.shields.io/badge/TypeScript-주력-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=flat-square&logo=next.js)](https://nextjs.org/)

[📄 Personal Projects PDF](./personal-projects.pdf)

</div>

---

## 한눈에 보기

| 영역 | 경험 요약 |
| --- | --- |
| **프로덕트** | 일상 문제를 푸는 소규모 앱·웹 서비스를 기획부터 배포까지 직접 수행 |
| **풀스택** | Next.js · NestJS · Vercel serverless · Prisma · Supabase 조합 경험 |
| **모바일** | Expo/React Native 기반 위치·검색·즐겨찾기 앱 2종 출시/배포 |
| **인터랙션** | Three.js · React Three Fiber로 3D 갤럭시·마을 프로토타입 구현 |
| **AI 개발** | 역할 분리형 에이전트 하네스 설계·템플릿화, Cursor/Claude 워크플로우, **Figma ↔ Next.js 양방향 MCP** |

---

## 기술 스택

다음 기술들을 **프로젝트 단위로 실제 적용**해 보았습니다.

```text
Frontend   TypeScript · React · Next.js · Tailwind CSS · Zustand · TanStack Query
Mobile     Expo · React Native · EAS Build · 위치 권한 · AsyncStorage
Backend    NestJS · Node.js · Vercel Serverless · Redis · Prisma
3D / UX    Three.js · React Three Fiber · Framer Motion · WebGL Shader
Data       공공데이터포털 API · CDN 캐시 · cron 갱신 · seed fallback
Dev / AI   Cursor · Claude Code · MCP · Figma MCP · 역할 기반 에이전트 · App Delivery Harness
Infra      Vercel · GitHub Actions · SEO/OG · JSON-LD · Rate Limiting
```

한 가지 스택에만 머무르기보다, **제품에 맞는 조합을 고르고 빠르게 검증**하는 방식을 선호합니다.

---

## 프로젝트

### 웹 서비스

| 프로젝트 | 소개 | 스택 | 링크 |
| --- | --- | --- | --- |
| [**OlaLab**](https://github.com/dayainow/ola) | 100+ AI 도구를 탐색하고 커뮤니티·실험실 모임으로 연결하는 **AI 큐레이션 플랫폼** | Next.js · NestJS · Prisma · Supabase | GitHub |
| [**HarnessHub**](https://github.com/dayainow/harness-hub) | GitHub에 흩어진 AI 에이전트를 **발견·평가·설치**하는 카탈로그 플랫폼. 3D 갤럭시 UI, 라이선스 분류, 크롤러, CLI | Next.js · NestJS · R3F · Redis | GitHub |
| [**인류애협회**](https://github.com/dayainow/humanity-association) | "오늘의 인류애, 우리가 지킨다" — 하찮은 일상을 국가급 실적으로 인정하는 **익명 커뮤니티** 웹 MVP | Next.js · Zustand · Tailwind | [배포](https://humanity-association.vercel.app) |

### 앱 서비스

| 프로젝트 | 소개 | 스택 | 링크 |
| --- | --- | --- | --- |
| [**0원의품격**](https://github.com/dayainow/zero-won-poomgyeok) | 0원으로 즐길 수 있는 전시·공연·문화행사를 찾는 앱. 도서관 앱에서 검증한 구조를 확장한 문화 정보 서비스 | Expo · TypeScript · Vercel API | [배포](https://zero-won-poomgyeok.vercel.app) |
| [**오늘의 도서관**](https://github.com/dayainow/today-library) | 전국 공공도서관 데이터로 **지금 열린 곳**을 가까운 순으로 보여주는 모바일 앱. 검색·필터·즐겨찾기·길찾기 지원 | Expo · TypeScript · Vercel API | [배포](https://today-library-sigma.vercel.app) |
| [**메모빌**](https://github.com/dayainow/memoville) | 감정 일기를 쓰면 **3D 마을**이 자라는 인터랙티브 다이어리 앱 프로토타입 | Expo · Three.js · R3F · WebView | [프로토타입](https://prototype-web-eosin.vercel.app) |

### AI 개발 워크플로우

| 프로젝트 | 소개 | 스택 | 링크 |
| --- | --- | --- | --- |
| [**3-Layer Harness**](https://github.com/dayainow/3-layer-harness) | Hooks · 공유 지침 · 전문 에이전트로 구성된 **이식 가능한 AI 개발 하네스** 템플릿 | Shell · Claude/Cursor 구조 | GitHub |
| [**Figma Publish Harness**](https://github.com/dayainow/figma-publish) | Cursor + Figma MCP로 **Figma ↔ Next.js 양방향** 퍼블·동기화를 Skill · Rule · Prompt로 표준화. `get_metadata` 재귀 퍼블, `generate_figma_design` + `use_figma` 병렬 캡처 | Cursor · Figma MCP · Next.js · Tailwind | GitHub |
| [**Role-Based AI Harness**](https://github.com/dayainow/ai-agent-harness-methodology) | AI를 단일 코드 생성기가 아닌 **소규모 제품 팀**처럼 운영하는 역할·핸드오프 방법론 | 방법론 · 문서 | GitHub |

---

## 개발 방식

```text
아이디어 → 빠른 MVP → 실사용 검증 → 패턴 추출 → 다음 제품에 재사용
```

- **프로토타입 우선**: 먼저 동작하는 제품 루프를 만들고, 이후에 구조를 다듬습니다.
- **역할 분리**: 기획·설계·구현·QA를 AI 에이전트 역할로 나누어 맥락 손실을 줄입니다.
- **따뜻한 UX**: 정보 밀도는 높이되, 화면은 과하지 않게 — 읽기 쉬운 인터페이스를 지향합니다.
- **배포까지**: Vercel 배포, Play Store 준비, 개인정보처리방침·OG 이미지 등 출시에 필요한 것까지 직접 다룹니다.

---

## 현재 관심 분야

### 메모빌 — 감정 기록이 마을로 이어지는 경험

```text
DiaryEntry → DiaryMemory → VillageEffect[] → VillageSnapshot → Three.js Village
```

짧은 감정 기록이 날씨·건물·주민 반응으로 시각화되는 **감정 다이어리 + 3D 마을** 실험을 이어가고 있습니다.

### Figma Publish Harness — Design ↔ Code 양방향 MCP

```text
Design → Code: get_variable_defs → get_metadata (재귀) → get_design_context
Code → Figma: generate_figma_design (캡처) + use_figma (DS 조립) → 캡처 레이어 삭제
```

Figma 퍼블과 역동기화를 **하네스 3계층(Skill · Rule · Prompt)** 으로 고정해, AI 에이전트의 UI 누락·토큰 낭비·품질 편차를 줄이는 워크플로우를 정리 중입니다.  
데모 앱: [examples/demo-app](https://github.com/dayainow/figma-publish/tree/main/examples/demo-app)

### 역할 기반 AI 개발 하네스

```text
planner → domain-designer → data-contract → implementation → qa-reviewer
```

AI를 협업자로 쓰되, **역할·산출물·검증 루프**를 명시해 품질과 속도를 함께 잡는 방법을 정리 중입니다.

---

<div align="center">

작은 것을 만들고, 쓸 만해지면 더 단단하게 만듭니다.

</div>
