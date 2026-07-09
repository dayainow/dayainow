import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};

type ToolContent = {
  type: string;
  text: string;
};

type ToolResult = {
  content?: ToolContent[];
};

type DetectApiSpecResult = {
  found?: Array<{
    format?: string;
    generationSupport?: string;
  }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "./mcp-server/dist/server.js");
const testProjectRoot = path.resolve(__dirname, "./test-project-a");
const generatedRoot = path.resolve(testProjectRoot, "./src/api");

let nextId = 1;
let stdoutBuffer = "";

const pending = new Map<
  number,
  {
    resolve: (value: JsonRpcResponse) => void;
    reject: (error: Error) => void;
  }
>();

const mcpServer = spawn("node", [serverPath], {
  cwd: testProjectRoot,
  stdio: ["pipe", "pipe", "pipe"],
});

mcpServer.stdout.on("data", (data: Buffer) => {
  stdoutBuffer += data.toString();
  const lines = stdoutBuffer.split("\n");
  stdoutBuffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const response = JSON.parse(line) as JsonRpcResponse;
    console.log(
      "[MCP Server Response]:\n",
      JSON.stringify(response, null, 2),
    );

    const waiter = pending.get(response.id);

    if (waiter) {
      pending.delete(response.id);

      if (response.error) {
        waiter.reject(new Error(response.error.message));
      } else {
        waiter.resolve(response);
      }
    }
  }
});

mcpServer.stderr.on("data", (data: Buffer) => {
  console.error("[Server Error]:", data.toString());
});

mcpServer.on("exit", (code) => {
  for (const waiter of pending.values()) {
    waiter.reject(new Error(`MCP server exited with code ${code}`));
  }

  pending.clear();
});

async function main(): Promise<void> {
  await fs.rm(generatedRoot, { recursive: true, force: true });

  console.log("[Harness] MCP 서버 초기화 요청을 전송합니다.");
  await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "api-layer-codegen-mcp-harness",
      version: "0.1.0",
    },
  });

  await notify("notifications/initialized", {});

  console.log("[Harness] 사용 가능한 MCP 도구 목록을 확인합니다.");
  await request("tools/list", {});

  console.log("[Harness] 테스트 프로젝트에서 API 스펙을 탐지합니다.");
  const detectionResponse = await request("tools/call", {
    name: "detect_api_spec",
    arguments: {},
  });
  const detectionResult = parseToolJson<DetectApiSpecResult>(detectionResponse);

  assertDetectedFormat(detectionResult, "openapi-yaml", "supported");
  assertDetectedFormat(detectionResult, "swagger-json", "supported");
  assertDetectedFormat(detectionResult, "graphql", "supported");
  assertDetectedFormat(detectionResult, "postman-collection", "supported");
  assertDetectedFormat(detectionResult, "insomnia-export", "supported");
  assertDetectedFormat(detectionResult, "asyncapi-yaml", "supported");
  assertDetectedFormat(detectionResult, "http-file", "supported");

  console.log("[Harness] MCP 서버에 코드 생성 명령을 전송합니다.");
  await generateCodeFor("./openapi.yaml", "./src/api/generated-openapi");

  await assertGeneratedFile(
    "generated-openapi",
    "types.ts",
    "export interface Pet",
    "TypeScript schema type was not generated.",
  );
  await assertGeneratedFile(
    "generated-openapi",
    "zod.ts",
    "export const PetSchema",
    "Zod schema was not generated.",
  );
  await assertGeneratedFile(
    "generated-openapi",
    "tanstack-query.ts",
    "useListPetsQuery",
    "TanStack Query hook was not generated.",
  );
  await assertGeneratedFile(
    "generated-openapi",
    "codegen-report.json",
    "\"engine\": \"builtin-openapi\"",
    "Codegen report was not generated.",
  );

  await generateCodeFor("./swagger.json", "./src/api/generated-swagger");
  await assertGeneratedFile(
    "generated-swagger",
    "tanstack-query.ts",
    "useListSwaggerPetsQuery",
    "Swagger TanStack Query hook was not generated.",
  );

  await generateCodeFor("./schema.graphql", "./src/api/generated-graphql");
  await assertGeneratedFile(
    "generated-graphql",
    "tanstack-query.ts",
    "usePetsQuery",
    "GraphQL TanStack Query hook was not generated.",
  );

  await generateCodeFor(
    "./petstore.postman_collection.json",
    "./src/api/generated-postman",
  );
  await assertGeneratedFile(
    "generated-postman",
    "tanstack-query.ts",
    "useListPetsQuery",
    "Postman TanStack Query hook was not generated.",
  );

  await generateCodeFor("./insomnia.json", "./src/api/generated-insomnia");
  await assertGeneratedFile(
    "generated-insomnia",
    "tanstack-query.ts",
    "useListInsomniaPetsQuery",
    "Insomnia TanStack Query hook was not generated.",
  );

  await generateCodeFor("./api.http", "./src/api/generated-http");
  await assertGeneratedFile(
    "generated-http",
    "tanstack-query.ts",
    "useHttpRequest1Query",
    "HTTP file TanStack Query hook was not generated.",
  );

  await generateCodeFor("./asyncapi.yaml", "./src/api/generated-asyncapi");
  await assertGeneratedFile(
    "generated-asyncapi",
    "asyncapi-client.ts",
    "createAsyncApiClient",
    "AsyncAPI client was not generated.",
  );

  console.log("[Harness] 생성 파일 검증이 완료되었습니다.");
}

async function generateCodeFor(specPath: string, outputDir: string): Promise<void> {
  await request("tools/call", {
    name: "generate_code",
    arguments: {
      specPath,
      outputDir,
      features: ["types", "zod", "tanstack-query"],
    },
  });
}

function request(method: string, params: unknown): Promise<JsonRpcResponse> {
  const id = nextId++;
  const payload = {
    jsonrpc: "2.0",
    id,
    method,
    params,
  };

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    mcpServer.stdin.write(`${JSON.stringify(payload)}\n`);
  });
}

function notify(method: string, params: unknown): Promise<void> {
  const payload = {
    jsonrpc: "2.0",
    method,
    params,
  };

  return new Promise((resolve) => {
    mcpServer.stdin.write(`${JSON.stringify(payload)}\n`, () => resolve());
  });
}

async function assertGeneratedFile(
  outputName: string,
  fileName: string,
  expected: string,
  failureMessage: string,
): Promise<void> {
  const filePath = path.join(generatedRoot, outputName, fileName);
  const contents = await fs.readFile(filePath, "utf8");

  if (!contents.includes(expected)) {
    throw new Error(`${failureMessage} File: ${filePath}`);
  }
}

function parseToolJson<T>(response: JsonRpcResponse): T {
  const result = response.result as ToolResult;
  const text = result.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("MCP tool response did not include text content.");
  }

  return JSON.parse(text) as T;
}

function assertDetectedFormat(
  result: DetectApiSpecResult,
  format: string,
  generationSupport: string,
): void {
  const matched = result.found?.some(
    (item) =>
      item.format === format && item.generationSupport === generationSupport,
  );

  if (!matched) {
    throw new Error(
      `Expected detect_api_spec to find ${format} with ${generationSupport} support.`,
    );
  }
}

main()
  .catch((error) => {
    console.error("[Harness] 실패:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    mcpServer.stdin.end();
    mcpServer.kill();
  });
