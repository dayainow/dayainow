# MCP Codegen Agent Harness

`mcp-codegen-agent`는 프로젝트 안의 OpenAPI/GraphQL 스펙을 찾고, OpenAPI 스펙에서 프론트엔드 API 레이어를 생성하는 MCP 서버입니다.

현재 생성 대상:

- TypeScript 타입
- Zod 스키마
- TanStack Query fetcher/hook

## 구조

```text
mcp-codegen-harness/
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
cd mcp-codegen-harness/mcp-server
npm install
npm run build
npm link
```

이후 어느 디렉토리에서든 다음 명령으로 MCP 서버를 실행할 수 있습니다.

```bash
mcp-codegen
```

## Cursor 등록 예시

- Name: `CodegenAgent`
- Type: `command`
- Command: `mcp-codegen`

## Claude Desktop 등록 예시

```json
{
  "mcpServers": {
    "mcp-codegen-agent": {
      "command": "mcp-codegen"
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
