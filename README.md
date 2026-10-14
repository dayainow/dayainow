# dayainow · 프론트엔드 중심 풀스택 개발

**React·TypeScript를 중심으로 웹과 모바일 제품을 만들고, AI 서비스와 개발 인프라로 확장합니다.**
기획부터 UI·API 구현, 테스트와 배포까지 연결하며, 반복되는 개발 작업은 재사용 가능한 도구로 정리합니다.

[포트폴리오 사이트](https://candid-blini-c6f102.netlify.app/) · [프로젝트 상세 문서](./personal-projects.md) · [문의](https://github.com/dayainow/dayainow/issues)

## 핵심 역량

| 분야 | 구현 경험 | 주요 기술 |
| --- | --- | --- |
| **프론트엔드** | 복잡한 폼·상태 관리, 문서 편집·칸반, 반응형 UI | TypeScript · React · Next.js |
| **풀스택** | API·인증·권한, 데이터 모델링, 배포 구성 | Node.js · NestJS · Supabase · PostgreSQL |
| **모바일** | 검색·위치·즐겨찾기, 게임 UI와 상호작용 | Expo · React Native |
| **AI·개발 인프라** | RAG·MCP 연동, 자동 테스트, CI/CD와 개발 도구 | Python · MCP · GitHub Actions · Vercel |

## 먼저 살펴볼 프로젝트

### Folio — 개발자 워크스페이스

일지·문서·칸반·프로세스를 한 화면에서 연결해 개발 기록을 관리합니다.

- **구현:** 로컬 우선 저장, 문서 편집과 위키 링크, 칸반, MCP·Beacon 연동
- **기술:** Next.js · React · TypeScript · Supabase
- **확인 자료:** [코드·아키텍처·실행 화면](https://github.com/dayainow/folio)

### 청년정책 처방전 — 정책 안내 앱

청년정책을 맞춤형 약봉투 형태로 안내하는 진단 앱입니다.

- **활용:** 마포청년축제 부스에서 체험용으로 운영
- **기술:** React · Vite · TypeScript · Tailwind
- **확인 자료:** [프로젝트 설명·코드](https://github.com/dayainow/youthrx-app)

### CorpBrain — 사내 문서 검색·질의 서비스

권한을 고려해 사내 문서를 검색하고 답변하는 로컬 RAG 프로젝트입니다.

- **구현:** RBAC, 문서 트리 탐색, Slack 연동, 검색 품질 평가와 선택형 리랭킹
- **기술:** Next.js · Ollama · AI SDK · PgVector · Redis
- **확인 자료:** [구조·평가 방법·코드](https://github.com/dayainow/corp-brain)

## 모바일 · 인터랙션

| 프로젝트 | 구현 내용 | 기술·확인 자료 |
| --- | --- | --- |
| **[캡슐체스](./capsule-chess)** | 5×5 체스 기반 몬스터 배틀. 리그·퍼즐·진화·업적 기능, 스토어 출시 준비 | Expo · React Native / [README](./capsule-chess) |
| **[오늘의 도서관](https://github.com/dayainow/today-library)** | 전국 도서관 운영 시간 검색·즐겨찾기·길찾기 | Expo · TypeScript / [웹 데모](https://today-library-sigma.vercel.app) |
| **[0원의품격](https://github.com/dayainow/zero-won-poomgyeok)** | 무료 문화행사·전시 정보 탐색 | Expo · TypeScript / [웹 데모](https://zero-won-poomgyeok.vercel.app) |
| **[메모빌](https://github.com/dayainow/memoville)** | 감정 일기와 3D 마을 성장을 연결한 프로토타입 | Expo · Three.js · R3F / [데모](https://prototype-web-eosin.vercel.app) |

## Astra Forge · 아스트라포지

**문의 데스크(Inquiry Desk)** — 고객 문의를 원문·요구사항·확인 질문으로 나누고 상담 상태를 관리하는 파일 기반 도구입니다.

- **구현:** 상담 생성·수정·필터, JSON 백업·복원, 중복 병합 방지, 잘못된 입력 검증
- **검증:** 핵심 테스트 5개와 브라우저 저장·수정·복원 확인. Node.js만으로 실행
- **기술·범위:** Vanilla JavaScript · HTML · CSS · Node.js. AI API 미연결, 메모리 저장과 파일 백업 방식의 사이드 프로젝트
- **확인 자료:** [코드·아키텍처·스크린샷·실행 방법](./inquiry-desk)

## 그 밖의 프로젝트

<details>
<summary>웹 서비스·개발 도구·MCP 프로젝트 펼치기</summary>

| 프로젝트 | 구현 내용 | 주요 기술 |
| --- | --- | --- |
| [OlaLab](https://github.com/dayainow/ola) | AI 도구 큐레이션·커뮤니티 | Next.js · NestJS · Prisma |
| [HarnessHub](https://github.com/dayainow/harness-hub) | AI 에이전트·하네스 발견·설치 카탈로그와 CLI | Next.js · NestJS · R3F |
| [Zarami](https://github.com/dayainow/zarami) | 채용 데이터 기반 커리어 로드맵·퀘스트 | Next.js · Supabase · React Flow / [데모](https://zarami-iota.vercel.app/) |
| [Beacon](https://github.com/dayainow/beacon-project-os) | 파일·Git 관찰, 단계별 검증·산출물·변경 이력 관리 | TypeScript · Node.js · SQLite |
| [Goodz](https://github.com/dayainow/goodz) | 기획부터 배포까지 작업·검증·증거·감사 이력 관리 | React · Express · SQLite · Turborepo |
| [Critter](https://github.com/dayainow/critter) | AI 에이전트 기반 랜딩·온보딩 사전 점검과 보고서 설계 | Product Planning · UX Research · AI Agent Design |
| [마음길잡이](https://github.com/dayainow/mind-guide-mcp) | 카카오 PlayMCP 기반 정신건강·복지 정보 안내 | Python · FastMCP · 공공데이터 |
| [API Layer Codegen MCP](./api-layer-codegen-mcp) | OpenAPI에서 TypeScript·Zod·TanStack Query 레이어 생성 및 검증 | TypeScript · MCP · OpenAPI |

</details>

## 개발 방식

- **동작하는 흐름부터 구현:** 입력·처리·결과를 연결한 뒤 기능을 확장합니다.
- **검증을 코드와 함께 관리:** 테스트·린트·CI를 구성하고 AI가 만든 코드에도 같은 확인 절차를 적용합니다.
- **재사용 가능한 단위로 정리:** 반복되는 배포·폼·권한·모바일 검증을 도구와 템플릿으로 분리합니다.

## 개발 자동화 · 오픈소스

<details>
<summary>분야별 도구와 저장소 펼치기</summary>

### 배포 · 품질


| 프로젝트 | 소개 |
| --- | --- |
| [**CI/CD Harness**](https://github.com/dayainow/ci-cd-harness) | `build → test → deploy` 표준화, GHA Summary·HTML 리포트·Slack/Discord 알림 |
| [**Frontend Agent Orchestrator Kit**](https://github.com/dayainow/frontend-agent-orchestrator-kit) | 기획/디자인 → 컴포넌트 → Mocking → 테스트 → 배포 검증을 묶는 프론트엔드 AI 에이전트 하네스 · 실전 적용: [Goodz Process Control Plane](https://github.com/dayainow/goodz) |
| [**Frontend Collab Kit**](https://github.com/dayainow/frontend-collab-kit) | 팀 단위 ESLint/Prettier/Husky + 컴포넌트 스캐폴딩 CLI |

### AI 협업 · 디자인 연동

| 프로젝트 | 소개 |
| --- | --- |
| [**Figma-to-Code Harness**](https://github.com/dayainow/figma-to-code-harness) | Figma REST API Node → TypeScript React AST 파이프라인 & Webhook 자동 PR & 4대 업계 엔진(Figma Code Connect, Visual Copilot, Locofy, MCP AST) 샌드박스 |
| [**Figma Publish Harness**](https://github.com/dayainow/figma-publish) | Figma ↔ Next.js **양방향** 퍼블·동기화 (Skill · Rule · MCP 순서 표준화) |
| [**Role-Based AI Harness**](https://github.com/dayainow/ai-agent-harness-methodology) | planner → 설계 → 구현 → QA **역할·핸드오프** 방법론 |
| [**3-Layer Harness**](https://github.com/dayainow/3-layer-harness) | Hooks · 공유 지침 · 전문 에이전트 템플릿 |
| [**Web Performance Audit Skill**](https://github.com/dayainow/web-performance-audit-skill) | Lighthouse → 병목 진단 → 개선안 → 재검증 루프 |

### 프론트엔드 개발 · 검증

| 프로젝트 | 소개 |
| --- | --- |
| [**AI Test Guard**](https://github.com/dayainow/ai-test-guard) | 프론트엔드 테스트 **3층**(Vitest Unit · Storybook Visual · Playwright E2E + Stagehand AI E2E) 하이브리드 하네스 |
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


</details>

## 조직 랩 · Skill Step Labs

제품 프로젝트와 별도로, 아키텍처와 성능·보안 주제를 실습하는 저장소를 **[Skill Step Labs](https://github.com/skill-step-labs)**에 정리합니다.

<details>
<summary>아키텍처 실습 저장소 펼치기</summary>

| 도메인 카테고리 | 랩 레포지토리 (Public) | 핵심 다루는 주제 |
| --- | --- | --- |
| **🎨 Frontend & Web** | [**b2b-mes-admin-lab**](https://github.com/skill-step-labs/b2b-mes-admin-lab) | FSD Next.js 16, AG-Grid/Handsontable 대용량 그리드, Module Federation, BFF 게이트웨이, Zustand & TanStack Query |
| | [**frontend-performance-lab**](https://github.com/skill-step-labs/frontend-performance-lab) | Vite vs Webpack 빌드 최적화, Canvas(Chart.js) 대 SVG(D3), RN WebView 비동기 RPC 브릿지, PWA, App Store 파이프라인 |
| | [**frontend-coding-interview-lab**](https://github.com/skill-step-labs/frontend-coding-interview-lab) | IT 대기업 프론트엔드 코딩 테스트 & 자료구조/알고리즘 및 바닐라 JS/React 하드코딩 유닛 테스트 |
| | [**frontend-security-lab**](https://github.com/skill-step-labs/frontend-security-lab) | XSS DOMPurify 방어, CSRF & HTTP-Only SameSite Cookie 이중 토큰, CSP 헤더, CORS Preflight |
| **⚡ Fullstack & Backend** | [**fullstack-reliability-lab**](https://github.com/skill-step-labs/fullstack-reliability-lab) | HTTP Idempotency Key 멱등성 보장, Exponential Backoff + Jitter 재시도, 낙관적 락(Optimistic Lock), SWR 캐싱 |
| | [**backend-performance-lab**](https://github.com/skill-step-labs/backend-performance-lab) | Python FastAPI 비동기 서빙, PostgreSQL 커넥션 풀링, N+1 쿼리 차단, Redis 캐시 및 Stampede 방지 |
| **🐳 Infra & DevOps** | [**docker-infra-lab**](https://github.com/skill-step-labs/docker-infra-lab) | Multi-stage Dockerfile 최적화, Docker Compose 오케스트레이션, Nginx Reverse Proxy |
| **🧠 AI & Data Platform** | [**llm-rag-data-platform-lab**](https://github.com/skill-step-labs/llm-rag-data-platform-lab) | RAG(검색 증강 생성), ChromaDB/FAISS 벡터 스토어, 코사인 유사도 검색, AWS Bedrock 파이프라인 |
| | [**ai-product-patterns-lab**](https://github.com/skill-step-labs/ai-product-patterns-lab) | SSE(Server-Sent Events) 실시간 토큰 스트리밍, AI Provider Fallback 서킷 브레이커, Token Rate Limiter |
| **📱 Mobile Native** | [**android-architecture-lab**](https://github.com/skill-step-labs/android-architecture-lab) | Android Clean Architecture 3계층, MVI (Model-View-Intent), Jetpack Compose, Kotlin Coroutines / StateFlow |

</details>
