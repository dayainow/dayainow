# API Layer Codegen MCP

OpenAPI/GraphQL/Postman 같은 API 소스를 탐지하고, 현재는 OpenAPI 스펙에서 TypeScript 타입, Zod 스키마, TanStack Query hook으로 된 프론트엔드 API 레이어를 생성하는 MCP 서버입니다.

AI 클라이언트 없이도 stdio 하네스로 MCP 호출과 파일 생성을 검증할 수 있게 구성되어 있습니다.

현재 생성 대상:

- TypeScript 타입
- Zod 스키마
- TanStack Query fetcher/hook

## OpenAPI만 가능한가요?

아닙니다. 목표는 여러 API 소스를 받아 프론트엔드 API 레이어로 정리하는 것입니다. 다만 현재 안정적으로 코드 생성까지 되는 입력은 OpenAPI 3.x YAML/JSON입니다.

현재 지원 범위:

| API 소스 | 탐지 | 코드 생성 | 설명 |
| --- | --- | --- | --- |
| OpenAPI 3.x JSON/YAML | 지원 | 지원 | TypeScript/Zod/TanStack Query 생성 가능 |
| Swagger 2.0 | 지원 | 변환 필요 | OpenAPI 3.x로 변환 후 생성 권장 |
| GraphQL Schema (`.graphql`, `.gql`) | 지원 | 예정 | schema + operation 문서 기반 생성 어댑터 추가 가능 |
| Postman Collection | 지원 | 예정 | collection을 OpenAPI로 변환하거나 Postman 어댑터 추가 가능 |
| Insomnia Export | 지원 | 예정 | export를 OpenAPI로 변환하거나 Insomnia 어댑터 추가 가능 |
| AsyncAPI | 지원 | 예정 | 이벤트/메시지 클라이언트 생성용 어댑터로 확장 가능 |
| `.http`, `.rest` request file | 지원 | 예정 | 예시 요청을 분석하거나 OpenAPI로 정리 후 생성 가능 |

구조적으로는 `detect_api_spec`가 다양한 API 소스를 찾고, `generate_code`가 생성 가능한 포맷을 처리합니다. 이후 GraphQL/Postman/Insomnia를 각각 입력 어댑터로 붙이면 같은 출력 규칙(TypeScript, Zod, TanStack Query)을 공유할 수 있습니다.

## 어떤 문제를 해결하나요?

프론트엔드에서 API를 붙일 때 자주 생기는 반복 작업을 줄입니다. 백엔드가 OpenAPI 스펙을 제공해도, 프론트엔드에서는 보통 타입 정의, 런타임 검증 스키마, fetcher, TanStack Query hook을 다시 손으로 만들게 됩니다. 이 과정에서 필드 이름이 틀리거나, API 응답 타입과 화면 코드가 어긋나거나, 엔드포인트가 바뀌었는데 일부 hook만 갱신되지 않는 문제가 자주 생깁니다.

`API Layer Codegen MCP`는 AI 클라이언트가 현재 프로젝트의 API 스펙을 직접 찾고, 사용자가 요청한 코드 레이어를 같은 규칙으로 생성하도록 돕습니다. 즉, "스펙은 있는데 프론트엔드 API 레이어를 매번 사람이 정리해야 하는 문제"를 MCP 도구로 자동화합니다.

## 언제 쓰면 좋나요?

- 백엔드에서 `openapi.yaml`, `swagger.json` 같은 API 스펙을 제공하는 프로젝트
- 새 기능을 만들기 전에 `src/api/generated` 같은 폴더에 타입과 API hook을 먼저 깔아야 하는 상황
- API 응답 타입, Zod 검증, TanStack Query hook을 화면마다 따로 만들다가 중복이 늘어난 상황
- Cursor, Claude Desktop 같은 AI 클라이언트에게 "이 프로젝트의 API 스펙을 읽고 필요한 프론트엔드 코드까지 생성해줘"라고 맡기고 싶은 상황
- 여러 프로젝트에서 같은 방식으로 API 레이어를 만들고 싶어 전역 MCP 도구가 필요한 상황

반대로, API 스펙이 없거나 백엔드 응답 형태가 문서화되어 있지 않은 프로젝트에서는 먼저 OpenAPI 스펙을 준비해야 효과가 큽니다.

## 사용 시나리오

### 1. 새 프론트엔드 프로젝트를 시작할 때

`openapi.yaml`을 프로젝트 루트에 두고 다음처럼 요청합니다.

```text
이 프로젝트의 openapi.yaml을 읽어서 src/api/generated에 TypeScript 타입, Zod 스키마, TanStack Query hook을 생성해줘.
```

AI 클라이언트는 `detect_api_spec`로 스펙을 찾고, `generate_code`로 필요한 파일을 생성합니다. 이후 화면 개발자는 생성된 타입과 hook을 가져다 쓰면 됩니다.

### 2. API 스펙이 바뀐 뒤 프론트엔드 코드를 동기화할 때

백엔드에서 필드나 엔드포인트가 바뀌면 손으로 타입을 찾아 고치는 대신 다시 생성합니다.

```text
openapi.yaml이 업데이트됐어. 기존 src/api/generated 폴더를 기준으로 타입, Zod, TanStack Query 코드를 다시 생성해줘.
```

이렇게 하면 API 계약 변경을 프론트엔드 코드에 빠르게 반영할 수 있습니다.

### 3. 여러 서비스에서 같은 코드 생성 규칙을 쓰고 싶을 때

`api-layer-codegen-mcp`를 전역 CLI로 등록하면 프로젝트마다 별도 설정을 복사하지 않아도 됩니다. Cursor나 Claude Desktop이 열려 있는 프로젝트 루트 기준으로 상대경로를 해석하므로, A 프로젝트에서는 `./openapi.yaml`, B 프로젝트에서는 `./schema.graphql`이나 `./petstore.postman_collection.json`처럼 각각의 API 소스를 탐지할 수 있습니다.

## 무엇이 생성되나요?

예를 들어 Petstore 스펙을 입력하면 다음 같은 코드가 생성됩니다.

- `types.ts`: OpenAPI schemas와 operation별 request/response 타입
- `zod.ts`: 런타임 검증에 사용할 Zod schema
- `tanstack-query.ts`: `fetch` 기반 API 함수와 `useXxxQuery` hook
- `index.ts`: 생성 파일 re-export
- `codegen-report.json`: 어떤 스펙에서 어떤 feature를 생성했는지 기록

현재 구현은 OpenAPI 3.x YAML/JSON 생성을 지원합니다. GraphQL, Postman, Insomnia, AsyncAPI, HTTP request 파일은 탐지할 수 있으며, 각 포맷별 생성 어댑터를 붙이는 구조로 확장할 수 있습니다.

## 구조

```text
api-layer-codegen-mcp/
├── mcp-server/           # MCP 서버 코드(TypeScript)
│   ├── src/server.ts
│   └── package.json
├── test-project-a/       # 테스트용 REST/OpenAPI 프로젝트
│   ├── openapi.yaml
│   └── src/
└── run-harness.ts        # stdio JSON-RPC 테스트 하네스
```

## 빠른 테스트

```bash
npm install
npm test
```

`npm test`는 다음 순서로 동작합니다.

1. `mcp-server/src/server.ts`를 `dist/server.js`로 빌드
2. `run-harness.ts`가 MCP 서버를 stdio 프로세스로 실행
3. `initialize`, `tools/list`, `detect_api_spec`, `generate_code` 요청 전송
4. `test-project-a/src/api/generated` 아래 생성 파일 검증

## MCP Tools

### `detect_api_spec`

현재 프로젝트 디렉토리에서 API 스펙 후보를 탐색합니다.

```json
{
  "projectRoot": "."
}
```

### `generate_code`

OpenAPI 스펙을 읽어 지정된 출력 디렉토리에 코드를 생성합니다.

```json
{
  "specPath": "./openapi.yaml",
  "outputDir": "./src/api/generated",
  "features": ["types", "zod", "tanstack-query"]
}
```

경로는 MCP 서버가 실행된 현재 작업 디렉토리(`process.cwd()`) 기준으로 해석합니다. Cursor나 Claude Desktop에서 프로젝트 루트에서 서버를 실행하면 `./openapi.yaml` 같은 상대경로를 그대로 사용할 수 있습니다.

## 전역 CLI로 등록

```bash
cd api-layer-codegen-mcp/mcp-server
npm install
npm run build
npm link
```

이후 어느 디렉토리에서든 다음 명령으로 MCP 서버를 실행할 수 있습니다.

```bash
api-layer-codegen-mcp
```

## Cursor 등록 예시

- Name: `ApiLayerCodegen`
- Type: `command`
- Command: `api-layer-codegen-mcp`

## Claude Desktop 등록 예시

```json
{
  "mcpServers": {
    "mcp-api-layer-codegen": {
      "command": "api-layer-codegen-mcp"
    }
  }
}
```

## 생성 결과

테스트 프로젝트 기준으로 생성되는 파일:

```text
src/api/generated/
├── types.ts
├── zod.ts
├── tanstack-query.ts
├── index.ts
└── codegen-report.json
```

`codegen-report.json`에는 생성 엔진, 입력 스펙, 출력 경로, features, operation 수가 기록됩니다.
