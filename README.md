<div align="center">

# Personal Projects

아이디어가 생기면 **웹·모바일로 직접 만들어 보는** 개인 GitHub입니다.  
프론트엔드 중심 풀스택으로 **기획 → 디자인 → 개발 → QA → 배포**까지 해보고,  
AI 협업·CI/CD·자동화 도구 같은 **워크플로우도 함께 시도**합니다.

[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat-square&logo=github)](https://github.com/dayainow)
[![TypeScript](https://img.shields.io/badge/TypeScript-주력-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/dayainow/ci-cd-harness)

[📄 프로젝트 상세 PDF](./personal-projects.pdf)

</div>

---

## 요약

| | |
| --- | --- |
| **주요 영역** | 프론트엔드 · 풀스택 · 프로덕트 (웹/앱, 어드민·커머스 UI) |
| **제품** | 모바일 앱 2종 배포 · 웹 서비스 MVP~운영 · 3D 인터랙션 프로토타입 · **풀 프로세스 레퍼런스** ([Goodz](https://github.com/dayainow/goodz)) |
| **오픈소스** | CI/CD 자동화, Figma↔코드 동기화, GA4 태깅 검증, 모바일 검증, 컴포넌트 격리 개발 등 **15+ 재사용 패키지** |
| **관심사** | TypeScript/React, 복잡한 UI·상태 설계, AI를 검증 가능한 워크플로로 쓰는 것 |

---

## 대표 프로젝트

배포·데모 링크가 있는 프로젝트를 우선 정리했습니다.

### MCP 서버

| 프로젝트 | 한 줄 소개 | 역할·기술 | 링크 |
| --- | --- | --- | --- |
| [**마음길잡이**](https://github.com/dayainow/mind-guide-mcp) | 카카오 PlayMCP 등록 — 카카오톡 한 마디로 정신건강복지센터·복지제도 연결, 위기 시 즉시 연락처 안내 | Python · FastMCP · 공공데이터 · Render · 카카오 PlayMCP | [GitHub](https://github.com/dayainow/mind-guide-mcp) · [PlayMCP](https://playmcp.kakao.com) |

### 웹 서비스

| 프로젝트 | 한 줄 소개 | 역할·기술 | 링크 |
| --- | --- | --- | --- |
| [**CorpBrain**](https://github.com/dayainow/corp-brain) | RBAC 기반 로컬 RAG 사내 문서 챗봇 — 문서 트리 탐색·Slack 연동·품질 게이트(Hit@3 80%)·옵션형 Cross-encoder 리랭킹 | Next.js · Ollama · AI SDK · PgVector · Redis | [GitHub](https://github.com/dayainow/corp-brain) |
| [**Goodz**](https://github.com/dayainow/goodz) | 굿즈 이커머스 풀스택 — **P0~P4 회사식 산출물**(PRD·Figma·ADR·Phase Gate) + 쇼핑몰·어드민·API 모노레포 | Turborepo · pnpm · Next.js · Express · Hermes · GHA CI | [GitHub](https://github.com/dayainow/goodz) |
| [**OlaLab**](https://github.com/dayainow/ola) | 100+ AI 도구 큐레이션·커뮤니티 플랫폼 | Next.js · NestJS · Prisma · Supabase | [GitHub](https://github.com/dayainow/ola) |
| [**HarnessHub**](https://github.com/dayainow/harness-hub) | AI 에이전트·하네스 **발견·평가·설치** 카탈로그 (3D UI, CLI) | Next.js · NestJS · R3F · Redis | [GitHub](https://github.com/dayainow/harness-hub) |

### 모바일 · 인터랙션

| 프로젝트 | 한 줄 소개 | 역할·기술 | 링크 |
| --- | --- | --- | --- |
| [**오늘의 도서관**](https://github.com/dayainow/today-library) | 전국 공공도서관 **지금 열린 곳** 검색·즐겨찾기·길찾기 | Expo · TypeScript · Vercel API | [**배포**](https://today-library-sigma.vercel.app) |
| [**0원의품격**](https://github.com/dayainow/zero-won-poomgyeok) | 0원 문화행사·전시 정보 앱 | Expo · TypeScript · Vercel API | [**배포**](https://zero-won-poomgyeok.vercel.app) |
| [**메모빌**](https://github.com/dayainow/memoville) | 감정 일기 → **3D 마을** 성장 인터랙션 | Expo · Three.js · R3F | [**프로토타입**](https://prototype-web-eosin.vercel.app) |

---

## 핵심 역량

```text
Frontend     TypeScript · React · Next.js · Tailwind · Zustand · TanStack Query
             복잡한 폼·권한·전역 상태 · 반응형 UI · Storybook/격리 개발 패턴

Mobile       Expo · React Native · EAS · 위치·검색·오프라인 즐겨찾기

Backend      NestJS · Node.js · Prisma · Supabase · Vercel Serverless · Redis · PgVector

Delivery     GitHub Actions(CI/CD) · Vercel 배포 · SEO/OG · Rate Limiting

AI Workflow  Cursor · MCP · Figma MCP · 역할 분리 에이전트 · Skill/Rule 표준화 · RAG 품질 게이트(Hit@K)
```

| 영역 | 실무에서 하는 일 |
| --- | --- |
| **프론트엔드** | B2C/B2B UI 구현, 디자인 시스템 연동, 성능·접근성 개선 |
| **풀스택** | API 설계·연동, DB 스키마, 인증·권한, 배포 파이프라인 |
| **AI 활용** | 코드 생성기가 아닌 **검증 가능한 워크플로**로 운영 (역할·게이트·재현) · **MCP 서버 직접 개발·배포** |
| **도구화** | 반복 작업을 npm 패키지·GHA 워크플로·Cursor Skill로 추출 |

---

## 오픈소스 — 개발 자동화 & 워크플로

제품 개발 중 만들어 검증한 도구입니다. 팀에 **이식 가능한 패키지·템플릿** 형태로 공개합니다.

### 배포 · 품질

| 프로젝트 | 소개 |
| --- | --- |
| [**CI/CD Harness**](https://github.com/dayainow/ci-cd-harness) | `build → test → deploy` 표준화, GHA Summary·HTML 리포트·Slack/Discord 알림 |
| [**Frontend Agent Orchestrator Kit**](https://github.com/dayainow/frontend-agent-orchestrator-kit) | 기획/디자인 → 컴포넌트 → Mocking → 테스트 → 배포 검증을 묶는 프론트엔드 AI 에이전트 하네스 · 실전 적용: [Goodz](https://github.com/dayainow/goodz) |
| [**Frontend Collab Kit**](https://github.com/dayainow/frontend-collab-kit) | 팀 단위 ESLint/Prettier/Husky + 컴포넌트 스캐폴딩 CLI |

### AI 협업 · 디자인 연동

| 프로젝트 | 소개 |
| --- | --- |
| [**Figma Publish Harness**](https://github.com/dayainow/figma-publish) | Figma ↔ Next.js **양방향** 퍼블·동기화 (Skill · Rule · MCP 순서 표준화) |
| [**Role-Based AI Harness**](https://github.com/dayainow/ai-agent-harness-methodology) | planner → 설계 → 구현 → QA **역할·핸드오프** 방법론 |
| [**3-Layer Harness**](https://github.com/dayainow/3-layer-harness) | Hooks · 공유 지침 · 전문 에이전트 템플릿 |
| [**Web Performance Audit Skill**](https://github.com/dayainow/web-performance-audit-skill) | Lighthouse → 병목 진단 → 개선안 → 재검증 루프 |

### 프론트엔드 개발 · 검증

| 프로젝트 | 소개 |
| --- | --- |
| [**Frontend Security Suite**](https://github.com/dayainow/frontend-security-harness) | 프론트엔드 **4대 보안(XSS, CSP, API Header, Storage)** 통합 검증 하네스 |
| [**Component Harness**](https://github.com/dayainow/component-harness) | UI **격리 샌드박스** — spec 기반 deterministic 검증 |
| [**Form Validation Harness**](https://github.com/dayainow/form-validation-harness) | 복잡한 폼 **Zod Chaos 주입** · 조건부 의존성 스위칭 · 타임머신 스냅샷 |
| [**GA Analytics Harness**](https://github.com/dayainow/ga-analytics-harness) | Notion GA4 명세 → `trackEvent` 코드 · MSW 캡처 · compliance · Husky/GHA 게이트 |
| [**Auth Permission Harness**](https://github.com/dayainow/auth-permission-harness) | 모노레포 **권한·기관 Mock** — 로그인 없이 RBAC UI 개발 |
| [**Audio Player Harness**](https://github.com/dayainow/audio-player-harness) | 전역 플레이어 상태 주입·MP3/HLS/에러 시나리오 검증 |
| [**WebView Bridge Harness**](https://github.com/dayainow/webview-bridge-harness) | Flutter WebView 브릿지 **브라우저 Mock** — 네이티브 없이 연동 개발 |
| [**Web Vitals RUM Harness**](https://github.com/dayainow/web-vitals-rum-harness) | 실사용자 LCP·INP·CLS·TTFB 수집 → Lighthouse 분석 연결 |

### 모바일 · 앱 개발 검증

| 프로젝트 | 소개 |
| --- | --- |
| [**Expo Release Harness**](https://github.com/dayainow/expo-release-harness) | Expo/EAS 빌드 · OTA 업데이트 · 스토어 배포 전 체크리스트 자동화 |
| [**Mobile Permission Harness**](https://github.com/dayainow/mobile-permission-harness) | 위치·카메라·알림·사진 접근 권한 Mock — 실제 디바이스 없이 상태별 UI 개발 |
| [**Deep Link Harness**](https://github.com/dayainow/deep-link-harness) | 앱 딥링크·Universal Link·App Link 라우팅 검증 |
| [**Offline Sync Harness**](https://github.com/dayainow/offline-sync-harness) | 오프라인 저장·재시도 큐·네트워크 복구 시 동기화 시나리오 검증 |

### 자동화 구성 방식 (요약)

업계 표준에 맞춰, 프로젝트마다 아래 층을 조합합니다.

```text
① AI 규칙      Cursor Skill · Rule · Prompt  (협업 순서·품질 게이트)
② 로컬 품질    Husky · ESLint · Prettier     (커밋 시)
③ UI 검증      Component Harness · Storybook (개발 중)
④ CI/CD        GitHub Actions · CI/CD Harness (push 후 build/test/deploy)
```

```text
제품 루프:  planner → domain-design → data-contract → implementation → qa-reviewer
디자인:     Figma MCP → metadata 재귀 → design_context → 코드 구현
성능:       RUM(실사용자) → Lighthouse(원인) → 코드 수정 → RUM(개선 확인)
```

---

## 기술 스택

```text
Language   TypeScript (주력), JavaScript, Python
Frontend   React, Next.js App Router, Tailwind CSS, Zustand, TanStack Query
Mobile     Expo, React Native, EAS Build
Backend    NestJS, Node.js, Prisma, Supabase, Vercel Serverless
3D / UX    Three.js, React Three Fiber, Framer Motion
Data       공공데이터 API, CDN 캐시, cron, seed fallback
Infra      Vercel, GitHub Actions, Redis, SEO/OG, JSON-LD
Dev / AI   Cursor, Claude, MCP, Figma MCP, Lighthouse, web-vitals
```

---

## 일하는 방식

```text
아이디어 → MVP → 실사용 검증 → 패턴 추출 → 오픈소스·다음 제품에 재사용
```

- **End-to-end**: 기획(PRD)·디자인(Figma)·UI·API·QA·배포·출시 준비(약관·OG 등)까지 직접 수행 — [Goodz](https://github.com/dayainow/goodz)에서 Phase Gate로 문서화
- **프로토타입 우선**: 동작하는 제품 루프를 먼저 만들고 구조를 다듬음
- **품질 게이트**: 린트·테스트·CI를 코드와 함께 유지 — AI 산출물도 동일 기준 적용
- **UX**: 정보는 충실하되 화면은 과하지 않게 — 읽기 쉬운 인터페이스 지향

---




<div align="center">

📫 문의: [GitHub Issues](https://github.com/dayainow/dayainow/issues)

</div>
