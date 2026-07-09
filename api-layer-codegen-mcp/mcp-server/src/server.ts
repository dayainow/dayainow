#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { parse as parseYaml } from "yaml";

type JsonObject = Record<string, unknown>;
type JsonRpcId = string | number | null;
type Feature = "types" | "zod" | "tanstack-query";
type ApiSourceFormat = ApiSpecDetection["format"];

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: JsonObject;
};

type ApiSpecDetection = {
  path: string;
  absolutePath: string;
  format:
    | "openapi-json"
    | "openapi-yaml"
    | "swagger-json"
    | "swagger-yaml"
    | "graphql"
    | "postman-collection"
    | "insomnia-export"
    | "asyncapi-json"
    | "asyncapi-yaml"
    | "http-file";
  diagnosis: string;
  generationSupport: "supported";
  recommendedAction: string;
};

type Operation = {
  method: string;
  pathTemplate: string;
  operationId: string;
  functionName: string;
  typePrefix: string;
  responseType: string;
  bodyType?: string;
  parameters: Parameter[];
};

type Parameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  type: string;
};

type GeneratedBundle = {
  engine: string;
  itemCount: number;
  files: Array<{
    fileName: string;
    contents: string;
  }>;
};

type RequestItem = {
  name: string;
  method: string;
  url: string;
  functionName: string;
  typePrefix: string;
  bodyType?: string;
};

type GraphqlField = {
  name: string;
  operationType: "query" | "mutation";
  args: Parameter[];
  responseType: string;
  selection: string;
};

type GraphqlObjectType = {
  kind: "type" | "input" | "interface";
  fields: Array<{
    name: string;
    rawType: string;
    type: string;
    required: boolean;
  }>;
};

const MCP_TOOLS = [
  {
    name: "detect_api_spec",
    description:
      "현재 프로젝트 디렉토리에서 OpenAPI/Swagger, GraphQL, Postman, Insomnia, AsyncAPI, HTTP 파일을 탐색하고 형식을 진단합니다.",
    inputSchema: {
      type: "object",
      properties: {
        projectRoot: {
          type: "string",
          description:
            "탐색할 프로젝트 루트입니다. 생략하면 MCP 서버가 실행된 현재 작업 디렉토리를 사용합니다.",
        },
      },
    },
  },
  {
    name: "generate_code",
    description:
      "API 스펙 파일을 읽어 TypeScript 타입, Zod 스키마, TanStack Query 훅 또는 API 클라이언트를 자동 생성합니다.",
    inputSchema: {
      type: "object",
      properties: {
        specPath: {
          type: "string",
          description: "스펙 파일 경로 (예: ./openapi.yaml)",
        },
        outputDir: {
          type: "string",
          description: "코드가 생성될 목적지 (예: ./src/api/generated)",
        },
        features: {
          type: "array",
          items: {
            type: "string",
            enum: ["types", "zod", "tanstack-query"],
          },
          description: "생성할 코드의 종류",
        },
      },
      required: ["specPath", "outputDir"],
    },
  },
];

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
]);

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
]);

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  let request: JsonRpcRequest;

  try {
    request = JSON.parse(line) as JsonRpcRequest;
  } catch (error) {
    writeError(null, -32700, "Parse error", error);
    return;
  }

  try {
    const result = await handleRequest(request);

    if (request.id !== undefined && result !== undefined) {
      writeResult(request.id, result);
    }
  } catch (error) {
    writeError(
      request.id ?? null,
      -32603,
      error instanceof Error ? error.message : "Internal error",
      error,
    );
  }
});

async function handleRequest(request: JsonRpcRequest): Promise<unknown> {
  switch (request.method) {
    case "initialize":
      return {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "mcp-api-layer-codegen",
          version: "0.1.0",
        },
      };
    case "notifications/initialized":
      return undefined;
    case "tools/list":
      return {
        tools: MCP_TOOLS,
      };
    case "tools/call":
      return callTool(asRecord(request.params));
    default:
      throw new Error(`Unsupported JSON-RPC method: ${request.method}`);
  }
}

async function callTool(params: JsonObject): Promise<unknown> {
  const toolName = readString(params.name, "params.name");
  const args = asRecord(params.arguments);

  if (toolName === "detect_api_spec") {
    return toolResponse(await detectApiSpec(args));
  }

  if (toolName === "generate_code") {
    return toolResponse(await generateCode(args));
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

async function detectApiSpec(args: JsonObject): Promise<unknown> {
  const projectRoot = resolveFromCwd(readOptionalString(args.projectRoot) ?? ".");
  const files = await findCandidateSpecs(projectRoot);
  const detected: ApiSpecDetection[] = [];

  for (const filePath of files) {
    const detection = await diagnoseSpecFile(filePath, projectRoot);

    if (detection) {
      detected.push(detection);
    }
  }

  detected.sort(compareDetectedSpecs);

  return {
    projectRoot,
    found: detected,
    primarySpec: detected[0]?.path ?? null,
    message:
      detected.length > 0
        ? `${detected.length} API spec/source file(s) detected.`
        : "No supported API spec/source file was detected.",
  };
}

function compareDetectedSpecs(a: ApiSpecDetection, b: ApiSpecDetection): number {
  const supportDiff =
    generationSupportRank(a.generationSupport) -
    generationSupportRank(b.generationSupport);

  if (supportDiff !== 0) {
    return supportDiff;
  }

  const formatDiff = formatRank(a.format) - formatRank(b.format);

  if (formatDiff !== 0) {
    return formatDiff;
  }

  return a.path.localeCompare(b.path);
}

function generationSupportRank(
  generationSupport: ApiSpecDetection["generationSupport"],
): number {
  return generationSupport === "supported" ? 0 : 1;
}

function formatRank(format: ApiSourceFormat): number {
  if (format === "openapi-json" || format === "openapi-yaml") {
    return 0;
  }

  if (format === "swagger-json" || format === "swagger-yaml") {
    return 1;
  }

  return 2;
}

async function generateCode(args: JsonObject): Promise<unknown> {
  const specPath = readString(args.specPath, "specPath");
  const outputDir = readString(args.outputDir, "outputDir");
  const features = readFeatures(args.features);
  const absoluteSpecPath = resolveFromCwd(specPath);
  const absoluteOutputDir = resolveFromCwd(outputDir);
  const raw = await fs.readFile(absoluteSpecPath, "utf8");
  const spec = parseSpecByExtension(absoluteSpecPath, raw);
  const format = inferApiSourceFormat(absoluteSpecPath, raw, spec);

  let bundle: GeneratedBundle;

  if (format === "openapi-json" || format === "openapi-yaml") {
    bundle = buildOpenApiBundle(asRecord(spec), features, "builtin-openapi");
  } else if (format === "swagger-json" || format === "swagger-yaml") {
    bundle = buildOpenApiBundle(
      convertSwaggerToOpenApi(asRecord(spec)),
      features,
      "builtin-swagger2-adapter",
    );
  } else if (format === "graphql") {
    bundle = buildGraphqlBundle(raw, features);
  } else if (format === "postman-collection") {
    bundle = buildRequestCollectionBundle(
      collectPostmanRequests(asRecord(spec)),
      features,
      "builtin-postman-adapter",
    );
  } else if (format === "insomnia-export") {
    bundle = buildRequestCollectionBundle(
      collectInsomniaRequests(asRecord(spec)),
      features,
      "builtin-insomnia-adapter",
    );
  } else if (format === "http-file") {
    bundle = buildRequestCollectionBundle(
      collectHttpFileRequests(raw),
      features,
      "builtin-http-file-adapter",
    );
  } else if (format === "asyncapi-json" || format === "asyncapi-yaml") {
    bundle = buildAsyncApiBundle(asRecord(spec), features);
  } else {
    throw new Error(`Unsupported API source format: ${format}`);
  }

  await fs.mkdir(absoluteOutputDir, { recursive: true });

  const generatedFiles: string[] = [];
  for (const file of bundle.files) {
    generatedFiles.push(
      await writeGeneratedFile(absoluteOutputDir, file.fileName, file.contents),
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    engine: bundle.engine,
    sourceFormat: format,
    specPath: absoluteSpecPath,
    outputDir: absoluteOutputDir,
    features,
    itemCount: bundle.itemCount,
    files: generatedFiles,
  };

  generatedFiles.push(
    await writeGeneratedFile(
      absoluteOutputDir,
      "codegen-report.json",
      `${JSON.stringify(report, null, 2)}\n`,
    ),
  );

  return {
    ok: true,
    message: `Generated ${generatedFiles.length} file(s).`,
    ...report,
    files: generatedFiles,
  };
}

function buildOpenApiBundle(
  spec: JsonObject,
  features: Feature[],
  engine: string,
): GeneratedBundle {
  const operations = collectOperations(spec);
  const files: GeneratedBundle["files"] = [];

  if (features.includes("types")) {
    files.push({
      fileName: "types.ts",
      contents: generateTypesFile(spec, operations),
    });
  }

  if (features.includes("zod")) {
    files.push({
      fileName: "zod.ts",
      contents: generateZodFile(spec),
    });
  }

  if (features.includes("tanstack-query")) {
    files.push({
      fileName: "tanstack-query.ts",
      contents: generateTanstackQueryFile(operations),
    });
  }

  files.push({
    fileName: "index.ts",
    contents: generateIndexFile(features),
  });

  return {
    engine,
    itemCount: operations.length,
    files,
  };
}

function buildRequestCollectionBundle(
  requests: RequestItem[],
  features: Feature[],
  engine: string,
): GeneratedBundle {
  const files: GeneratedBundle["files"] = [];

  if (features.includes("types")) {
    files.push({
      fileName: "types.ts",
      contents: generateRequestCollectionTypesFile(requests),
    });
  }

  if (features.includes("zod")) {
    files.push({
      fileName: "zod.ts",
      contents: generateRequestCollectionZodFile(requests),
    });
  }

  if (features.includes("tanstack-query")) {
    files.push({
      fileName: "tanstack-query.ts",
      contents: generateRequestCollectionTanstackFile(requests),
    });
  }

  files.push({
    fileName: "index.ts",
    contents: generateIndexFile(features),
  });

  return {
    engine,
    itemCount: requests.length,
    files,
  };
}

function buildGraphqlBundle(rawSchema: string, features: Feature[]): GeneratedBundle {
  const graphqlTypes = parseGraphqlObjectTypes(rawSchema);
  const graphqlOperations = parseGraphqlOperations(rawSchema, graphqlTypes);
  const files: GeneratedBundle["files"] = [];

  if (features.includes("types")) {
    files.push({
      fileName: "types.ts",
      contents: generateGraphqlTypesFile(graphqlTypes, graphqlOperations),
    });
  }

  if (features.includes("zod")) {
    files.push({
      fileName: "zod.ts",
      contents: generateGraphqlZodFile(graphqlTypes),
    });
  }

  if (features.includes("tanstack-query")) {
    files.push({
      fileName: "tanstack-query.ts",
      contents: generateGraphqlTanstackFile(graphqlOperations),
    });
  }

  files.push({
    fileName: "index.ts",
    contents: generateIndexFile(features),
  });

  return {
    engine: "builtin-graphql-adapter",
    itemCount: graphqlOperations.length,
    files,
  };
}

function buildAsyncApiBundle(spec: JsonObject, features: Feature[]): GeneratedBundle {
  const schemas = getAsyncApiSchemas(spec);
  const channels = asRecord(spec.channels);
  const files: GeneratedBundle["files"] = [];

  if (features.includes("types")) {
    files.push({
      fileName: "types.ts",
      contents: generateAsyncApiTypesFile(schemas, channels),
    });
  }

  if (features.includes("zod")) {
    files.push({
      fileName: "zod.ts",
      contents: generateAsyncApiZodFile(schemas),
    });
  }

  files.push({
    fileName: "asyncapi-client.ts",
    contents: generateAsyncApiClientFile(channels),
  });
  files.push({
    fileName: "index.ts",
    contents: generateAsyncApiIndexFile(features),
  });

  return {
    engine: "builtin-asyncapi-adapter",
    itemCount: Object.keys(channels).length,
    files,
  };
}

function convertSwaggerToOpenApi(swagger: JsonObject): JsonObject {
  const convertedPaths: JsonObject = {};

  for (const [pathTemplate, pathValue] of Object.entries(asRecord(swagger.paths))) {
    const pathItem = asRecord(pathValue);
    const convertedPathItem: JsonObject = {};

    for (const [key, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(key)) {
        convertedPathItem[key] = value;
        continue;
      }

      const operation = asRecord(value);
      const convertedOperation: JsonObject = {
        ...operation,
        responses: convertSwaggerResponses(asRecord(operation.responses)),
      };
      const bodyParameter = readSwaggerBodyParameter(operation);

      if (bodyParameter) {
        convertedOperation.requestBody = {
          required: bodyParameter.required,
          content: {
            "application/json": {
              schema: bodyParameter.schema,
            },
          },
        };
      }

      convertedPathItem[key] = convertedOperation;
    }

    convertedPaths[pathTemplate] = convertedPathItem;
  }

  return {
    openapi: "3.0.3",
    info: asRecord(swagger.info),
    paths: convertedPaths,
    components: {
      schemas: asRecord(swagger.definitions),
    },
  };
}

function convertSwaggerResponses(responses: JsonObject): JsonObject {
  const converted: JsonObject = {};

  for (const [statusCode, responseValue] of Object.entries(responses)) {
    const response = asRecord(responseValue);
    const schema = response.schema;

    converted[statusCode] = schema
      ? {
          ...response,
          content: {
            "application/json": {
              schema,
            },
          },
        }
      : response;
  }

  return converted;
}

function readSwaggerBodyParameter(
  operation: JsonObject,
): { required: boolean; schema: unknown } | null {
  const parameters = Array.isArray(operation.parameters)
    ? operation.parameters
    : [];
  const bodyParameter = parameters.map(asRecord).find((parameter) => {
    return parameter.in === "body" && parameter.schema !== undefined;
  });

  if (!bodyParameter) {
    return null;
  }

  return {
    required: bodyParameter.required === true,
    schema: bodyParameter.schema,
  };
}

function generateRequestCollectionTypesFile(requests: RequestItem[]): string {
  const lines = generatedHeader();

  lines.push(`export type ApiRequestParams = Record<string, string | number | boolean>;`);
  lines.push(`export type ApiRequestBody = unknown;`);
  lines.push(`export type ApiRequestResponse = unknown;`);
  lines.push("");

  for (const request of requests) {
    lines.push(`export type ${request.typePrefix}Params = ApiRequestParams;`);
    lines.push(`export type ${request.typePrefix}Body = ${request.bodyType ?? "ApiRequestBody"};`);
    lines.push(`export type ${request.typePrefix}Response = ApiRequestResponse;`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateRequestCollectionZodFile(requests: RequestItem[]): string {
  const lines = [
    ...generatedHeader(),
    `import { z } from "zod";`,
    "",
    `export const ApiRequestParamsSchema = z.record(z.union([z.string(), z.number(), z.boolean()]));`,
    `export const ApiRequestBodySchema = z.unknown();`,
    "",
  ];

  for (const request of requests) {
    lines.push(`export const ${request.typePrefix}ParamsSchema = ApiRequestParamsSchema;`);
    lines.push(`export const ${request.typePrefix}BodySchema = ApiRequestBodySchema;`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateRequestCollectionTanstackFile(requests: RequestItem[]): string {
  const imports = requests.flatMap((request) => [
    `${request.typePrefix}Params`,
    `${request.typePrefix}Body`,
    `${request.typePrefix}Response`,
  ]);
  const lines = [
    ...generatedHeader(),
    `import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";`,
    imports.length > 0 ? `import type { ${imports.join(", ")} } from "./types";` : "",
    "",
    `const API_BASE_URL = "";`,
    "",
    `function getRuntimeOrigin(): string {`,
    `  return typeof window === "undefined" ? "http://localhost" : window.location.origin;`,
    `}`,
    "",
    `function applyParams(url: string, params?: Record<string, unknown>): string {`,
    `  let nextUrl = url;`,
    `  for (const [key, value] of Object.entries(params ?? {})) {`,
    `    nextUrl = nextUrl.replace(new RegExp(\`{{?\\\\b\${key}\\\\b}}?\`, "g"), encodeURIComponent(String(value)));`,
    `  }`,
    `  return nextUrl;`,
    `}`,
    "",
    `async function requestJson<T>(url: string, init: RequestInit): Promise<T> {`,
    `  const response = await fetch(new URL(API_BASE_URL + url, getRuntimeOrigin()), init);`,
    `  if (!response.ok) {`,
    `    throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);`,
    `  }`,
    `  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);`,
    `}`,
    "",
  ].filter(Boolean);

  for (const request of requests) {
    const paramsArg = `params?: ${request.typePrefix}Params`;
    const bodyArg = `body?: ${request.typePrefix}Body`;
    const isQuery = request.method.toLowerCase() === "get";

    lines.push(
      `export async function ${request.functionName}(${paramsArg}, ${bodyArg}, init?: RequestInit): Promise<${request.typePrefix}Response> {`,
    );
    lines.push(`  const url = applyParams(${JSON.stringify(request.url)}, params);`);
    lines.push(`  return requestJson<${request.typePrefix}Response>(url, {`);
    lines.push(`    method: ${JSON.stringify(request.method.toUpperCase())},`);
    lines.push(`    ${isQuery ? "" : "body: body === undefined ? undefined : JSON.stringify(body),"}`);
    lines.push(`    headers: { "content-type": "application/json", ...init?.headers },`);
    lines.push(`    ...init,`);
    lines.push(`  });`);
    lines.push(`}`);
    lines.push("");

    if (isQuery) {
      lines.push(
        `export function use${request.typePrefix}Query(${paramsArg}, options?: Omit<UseQueryOptions<${request.typePrefix}Response, Error>, "queryKey" | "queryFn">) {`,
      );
      lines.push(`  return useQuery({`);
      lines.push(`    queryKey: [${JSON.stringify(request.name)}, params],`);
      lines.push(`    queryFn: () => ${request.functionName}(params),`);
      lines.push(`    ...options,`);
      lines.push(`  });`);
      lines.push(`}`);
    } else {
      lines.push(
        `export function use${request.typePrefix}Mutation(options?: UseMutationOptions<${request.typePrefix}Response, Error, { params?: ${request.typePrefix}Params; body?: ${request.typePrefix}Body }>) {`,
      );
      lines.push(`  return useMutation({`);
      lines.push(`    mutationFn: ({ params, body }) => ${request.functionName}(params, body),`);
      lines.push(`    ...options,`);
      lines.push(`  });`);
      lines.push(`}`);
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function collectPostmanRequests(collection: JsonObject): RequestItem[] {
  const requests: RequestItem[] = [];

  function walk(items: unknown[]): void {
    for (const itemValue of items) {
      const item = asRecord(itemValue);

      if (Array.isArray(item.item)) {
        walk(item.item);
        continue;
      }

      const request = asRecord(item.request);
      const method = readOptionalString(request.method) ?? "GET";
      const url = normalizePostmanUrl(request.url);
      const name = readOptionalString(item.name) ?? `${method} ${url}`;

      requests.push(makeRequestItem(name, method, url));
    }
  }

  walk(Array.isArray(collection.item) ? collection.item : []);
  return requests;
}

function normalizePostmanUrl(value: unknown): string {
  if (typeof value === "string") {
    return stripUrlOrigin(value);
  }

  const url = asRecord(value);
  const raw = readOptionalString(url.raw);

  if (raw) {
    return stripUrlOrigin(raw.replace(/^{{baseUrl}}/, ""));
  }

  if (Array.isArray(url.path)) {
    return `/${url.path.map(String).join("/")}`;
  }

  return "/";
}

function collectInsomniaRequests(exportFile: JsonObject): RequestItem[] {
  const resources = Array.isArray(exportFile.resources) ? exportFile.resources : [];

  return resources
    .map(asRecord)
    .filter((resource) => resource._type === "request")
    .map((resource) => {
      const method = readOptionalString(resource.method) ?? "GET";
      const url = stripUrlOrigin(readOptionalString(resource.url) ?? "/");
      const name = readOptionalString(resource.name) ?? `${method} ${url}`;
      return makeRequestItem(name, method, url);
    });
}

function collectHttpFileRequests(raw: string): RequestItem[] {
  return raw
    .split(/^###.*$/gm)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const requestLine = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/i.test(line));
      const [method = "GET", url = "/"] = requestLine?.split(/\s+/) ?? [];
      return makeRequestItem(`HttpRequest${index + 1}`, method, stripUrlOrigin(url));
    });
}

function makeRequestItem(name: string, method: string, url: string): RequestItem {
  const typePrefix = toTypeName(name);

  return {
    name,
    method: method.toUpperCase(),
    url: url.startsWith("/") ? url : `/${url}`,
    functionName: toCamelCase(name),
    typePrefix,
  };
}

function stripUrlOrigin(url: string): string {
  if (url.startsWith("{{")) {
    return url.replace(/^{{[^}]+}}/, "") || "/";
  }

  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

function getAsyncApiSchemas(spec: JsonObject): JsonObject {
  return asRecord(asRecord(spec.components).schemas);
}

function generateAsyncApiTypesFile(schemas: JsonObject, channels: JsonObject): string {
  const lines = generatedHeader();

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const safeName = toTypeName(schemaName);
    const schemaObject = asRecord(schema);
    const type = schemaToType(schemaObject);

    if (schemaObject.type === "object" && isRecord(schemaObject.properties)) {
      lines.push(`export interface ${safeName} ${type}`);
    } else {
      lines.push(`export type ${safeName} = ${type};`);
    }

    lines.push("");
  }

  lines.push(`export type AsyncApiChannel = ${jsonStringUnion(Object.keys(channels))};`);
  lines.push(
    `export type AsyncApiPublish = (channel: AsyncApiChannel, payload: unknown) => Promise<void> | void;`,
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateAsyncApiZodFile(schemas: JsonObject): string {
  const lines = [
    ...generatedHeader(),
    `import { z } from "zod";`,
    "",
  ];

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const safeName = toTypeName(schemaName);
    lines.push(`export const ${safeName}Schema = ${schemaToZod(asRecord(schema))};`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateAsyncApiClientFile(channels: JsonObject): string {
  const lines = [
    ...generatedHeader(),
    `import type { AsyncApiChannel, AsyncApiPublish } from "./types";`,
    "",
    `export function createAsyncApiClient(publish: AsyncApiPublish) {`,
    `  return {`,
    `    publish(channel: AsyncApiChannel, payload: unknown) {`,
    `      return publish(channel, payload);`,
    `    },`,
    `  };`,
    `}`,
    "",
  ];

  for (const channelName of Object.keys(channels)) {
    const functionName = `publish${toTypeName(channelName)}`;
    lines.push(
      `export function ${functionName}(publish: AsyncApiPublish, payload: unknown) {`,
    );
    lines.push(`  return publish(${JSON.stringify(channelName)} as AsyncApiChannel, payload);`);
    lines.push(`}`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateAsyncApiIndexFile(features: Feature[]): string {
  const lines = generateIndexFile(features).trimEnd().split("\n");
  lines.push(`export * from "./asyncapi-client";`);
  return `${lines.join("\n")}\n`;
}

function jsonStringUnion(values: string[]): string {
  if (values.length === 0) {
    return "string";
  }

  return values.map((value) => JSON.stringify(value)).join(" | ");
}

function parseGraphqlObjectTypes(rawSchema: string): Record<string, GraphqlObjectType> {
  const result: Record<string, GraphqlObjectType> = {};
  const typeRegex = /\b(type|input|interface)\s+([A-Za-z_][A-Za-z0-9_]*)[^{]*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

  while ((match = typeRegex.exec(rawSchema)) !== null) {
    const [, kind, typeName, body] = match;

    result[typeName] = {
      kind: kind as GraphqlObjectType["kind"],
      fields: parseGraphqlFieldLines(body).map((field) => ({
        name: field.name,
        rawType: field.rawType,
        type: graphqlTypeToTs(field.rawType),
        required: field.rawType.trim().endsWith("!"),
      })),
    };
  }

  return result;
}

function parseGraphqlOperations(
  rawSchema: string,
  graphqlTypes: Record<string, GraphqlObjectType>,
): GraphqlField[] {
  return [
    ...parseGraphqlOperationFields(rawSchema, graphqlTypes, "Query", "query"),
    ...parseGraphqlOperationFields(rawSchema, graphqlTypes, "Mutation", "mutation"),
  ];
}

function parseGraphqlOperationFields(
  rawSchema: string,
  graphqlTypes: Record<string, GraphqlObjectType>,
  typeName: string,
  operationType: GraphqlField["operationType"],
): GraphqlField[] {
  const match = new RegExp(`\\btype\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`, "m").exec(
    rawSchema,
  );

  if (!match) {
    return [];
  }

  return parseGraphqlFieldLines(match[1]).map((field) => ({
    name: field.name,
    operationType,
    args: field.args.map((arg) => ({
      name: arg.name,
      in: "query",
      required: arg.rawType.trim().endsWith("!"),
      type: graphqlTypeToTs(arg.rawType),
    })),
    responseType: graphqlTypeToTs(field.rawType),
    selection: graphqlSelectionFor(field.rawType, graphqlTypes),
  }));
}

function parseGraphqlFieldLines(body: string): Array<{
  name: string;
  args: Array<{ name: string; rawType: string }>;
  rawType: string;
}> {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]*)\))?\s*:\s*([^=]+)$/.exec(
        line.replace(/,$/, ""),
      );

      if (!match) {
        return null;
      }

      return {
        name: match[1],
        args: parseGraphqlArgs(match[2] ?? ""),
        rawType: match[3].trim(),
      };
    })
    .filter((field): field is {
      name: string;
      args: Array<{ name: string; rawType: string }>;
      rawType: string;
    } => field !== null);
}

function parseGraphqlArgs(rawArgs: string): Array<{ name: string; rawType: string }> {
  if (!rawArgs.trim()) {
    return [];
  }

  return rawArgs
    .split(",")
    .map((arg) => arg.trim())
    .map((arg) => /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/.exec(arg))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      name: match[1],
      rawType: match[2].trim(),
    }));
}

function graphqlTypeToTs(rawType: string): string {
  const type = rawType.trim().replace(/!$/, "");

  if (type.startsWith("[") && type.endsWith("]")) {
    return `${graphqlTypeToTs(type.slice(1, -1))}[]`;
  }

  switch (type) {
    case "ID":
    case "String":
      return "string";
    case "Int":
    case "Float":
      return "number";
    case "Boolean":
      return "boolean";
    default:
      return toTypeName(type);
  }
}

function graphqlTypeToZod(rawType: string): string {
  const required = rawType.trim().endsWith("!");
  const type = rawType.trim().replace(/!$/, "");
  let expression: string;

  if (type.startsWith("[") && type.endsWith("]")) {
    expression = `z.array(${graphqlTypeToZod(type.slice(1, -1))})`;
  } else if (type === "ID" || type === "String") {
    expression = "z.string()";
  } else if (type === "Int") {
    expression = "z.number().int()";
  } else if (type === "Float") {
    expression = "z.number()";
  } else if (type === "Boolean") {
    expression = "z.boolean()";
  } else {
    expression = "z.unknown()";
  }

  return required ? expression : `${expression}.optional()`;
}

function graphqlSelectionFor(
  rawType: string,
  graphqlTypes: Record<string, GraphqlObjectType>,
): string {
  const typeName = rawType.replace(/[![\]]/g, "").trim();
  const type = graphqlTypes[typeName];

  if (!type || type.fields.length === 0 || isGraphqlScalar(typeName)) {
    return "";
  }

  const scalarFields = type.fields
    .filter((field) => isGraphqlScalar(field.type))
    .map((field) => field.name);

  return scalarFields.length > 0 ? `{ ${scalarFields.join(" ")} }` : "{ __typename }";
}

function isGraphqlScalar(typeName: string): boolean {
  return ["string", "number", "boolean", "ID", "String", "Int", "Float", "Boolean"].includes(
    typeName,
  );
}

function generateGraphqlTypesFile(
  graphqlTypes: Record<string, GraphqlObjectType>,
  operations: GraphqlField[],
): string {
  const lines = generatedHeader();

  for (const [typeName, type] of Object.entries(graphqlTypes)) {
    if (typeName === "Query" || typeName === "Mutation" || typeName === "Subscription") {
      continue;
    }

    lines.push(`export interface ${toTypeName(typeName)} {`);
    for (const field of type.fields) {
      lines.push(`  ${JSON.stringify(field.name)}${field.required ? "" : "?"}: ${field.type};`);
    }
    lines.push(`}`);
    lines.push("");
  }

  for (const operation of operations) {
    const typePrefix = toTypeName(operation.name);
    lines.push(`export type ${typePrefix}Variables = ${parametersToType(operation.args)};`);
    lines.push(`export type ${typePrefix}Response = ${operation.responseType};`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateGraphqlZodFile(graphqlTypes: Record<string, GraphqlObjectType>): string {
  const lines = [
    ...generatedHeader(),
    `import { z } from "zod";`,
    "",
  ];

  for (const [typeName, type] of Object.entries(graphqlTypes)) {
    if (typeName === "Query" || typeName === "Mutation" || typeName === "Subscription") {
      continue;
    }

    lines.push(`export const ${toTypeName(typeName)}Schema = z.object({`);
    for (const field of type.fields) {
      lines.push(`  ${JSON.stringify(field.name)}: ${graphqlTypeToZod(field.rawType)},`);
    }
    lines.push(`}).passthrough();`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateGraphqlTanstackFile(operations: GraphqlField[]): string {
  const imports = operations.flatMap((operation) => [
    `${toTypeName(operation.name)}Variables`,
    `${toTypeName(operation.name)}Response`,
  ]);
  const lines = [
    ...generatedHeader(),
    `import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";`,
    imports.length > 0 ? `import type { ${imports.join(", ")} } from "./types";` : "",
    "",
    `const GRAPHQL_ENDPOINT = "/graphql";`,
    "",
    `async function fetchGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {`,
    `  const response = await fetch(GRAPHQL_ENDPOINT, {`,
    `    method: "POST",`,
    `    headers: { "content-type": "application/json" },`,
    `    body: JSON.stringify({ query, variables }),`,
    `  });`,
    `  if (!response.ok) {`,
    `    throw new Error(\`GraphQL request failed: \${response.status} \${response.statusText}\`);`,
    `  }`,
    `  const payload = (await response.json()) as { data?: Record<string, T>; errors?: unknown[] };`,
    `  if (payload.errors?.length) {`,
    `    throw new Error("GraphQL response contained errors.");`,
    `  }`,
    `  return Object.values(payload.data ?? {})[0] as T;`,
    `}`,
    "",
  ].filter(Boolean);

  for (const operation of operations) {
    const typePrefix = toTypeName(operation.name);
    const variablesType = `${typePrefix}Variables`;
    const responseType = `${typePrefix}Response`;
    const operationDocument = buildGraphqlOperationDocument(operation);

    lines.push(`export const ${operation.name}Document = ${JSON.stringify(operationDocument)};`);
    lines.push("");
    lines.push(
      `export function ${toCamelCase(operation.name)}(variables?: ${variablesType}): Promise<${responseType}> {`,
    );
    lines.push(`  return fetchGraphql<${responseType}>(${operation.name}Document, variables);`);
    lines.push(`}`);
    lines.push("");

    if (operation.operationType === "query") {
      lines.push(
        `export function use${typePrefix}Query(variables?: ${variablesType}, options?: Omit<UseQueryOptions<${responseType}, Error>, "queryKey" | "queryFn">) {`,
      );
      lines.push(`  return useQuery({`);
      lines.push(`    queryKey: [${JSON.stringify(operation.name)}, variables],`);
      lines.push(`    queryFn: () => ${toCamelCase(operation.name)}(variables),`);
      lines.push(`    ...options,`);
      lines.push(`  });`);
      lines.push(`}`);
    } else {
      lines.push(
        `export function use${typePrefix}Mutation(options?: UseMutationOptions<${responseType}, Error, ${variablesType} | undefined>) {`,
      );
      lines.push(`  return useMutation({`);
      lines.push(`    mutationFn: (variables) => ${toCamelCase(operation.name)}(variables),`);
      lines.push(`    ...options,`);
      lines.push(`  });`);
      lines.push(`}`);
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function buildGraphqlOperationDocument(operation: GraphqlField): string {
  const variables = operation.args
    .map((arg) => `$${arg.name}: ${tsTypeToGraphqlVariableType(arg.type, arg.required)}`)
    .join(", ");
  const args = operation.args.map((arg) => `${arg.name}: $${arg.name}`).join(", ");
  const variablePart = variables ? `(${variables})` : "";
  const argsPart = args ? `(${args})` : "";
  const selection = operation.selection ? ` ${operation.selection}` : "";

  return `${operation.operationType} ${operation.name}${variablePart} { ${operation.name}${argsPart}${selection} }`;
}

function tsTypeToGraphqlVariableType(type: string, required: boolean): string {
  const base = type.endsWith("[]")
    ? `[${tsTypeToGraphqlVariableType(type.slice(0, -2), false)}]`
    : type === "string"
      ? "String"
      : type === "number"
        ? "Float"
        : type === "boolean"
          ? "Boolean"
          : type;

  return required ? `${base}!` : base;
}

function parseSpecByExtension(specPath: string, raw: string): unknown {
  const extension = path.extname(specPath).toLowerCase();

  if (extension === ".json") {
    return JSON.parse(raw) as unknown;
  }

  if (extension === ".yaml" || extension === ".yml") {
    return parseYaml(raw) as unknown;
  }

  return raw;
}

function inferApiSourceFormat(
  specPath: string,
  raw: string,
  parsed: unknown,
): ApiSourceFormat {
  const extension = path.extname(specPath).toLowerCase();
  const lowerName = path.basename(specPath).toLowerCase();

  if (extension === ".graphql" || extension === ".gql") {
    return "graphql";
  }

  if (extension === ".http" || extension === ".rest") {
    return "http-file";
  }

  if (!isRecord(parsed)) {
    throw new Error(`Could not parse API source: ${specPath}`);
  }

  if (typeof parsed.openapi === "string") {
    return extension === ".json" ? "openapi-json" : "openapi-yaml";
  }

  if (typeof parsed.swagger === "string") {
    return extension === ".json" ? "swagger-json" : "swagger-yaml";
  }

  if (typeof parsed.asyncapi === "string") {
    return extension === ".json" ? "asyncapi-json" : "asyncapi-yaml";
  }

  const postmanInfo = asRecord(parsed.info);

  if (
    typeof postmanInfo.schema === "string" &&
    postmanInfo.schema.includes("schema.getpostman.com")
  ) {
    return "postman-collection";
  }

  if (
    (parsed._type === "export" && Array.isArray(parsed.resources)) ||
    lowerName.endsWith(".insomnia.json")
  ) {
    return "insomnia-export";
  }

  throw new Error(
    `Unsupported API source. The file may be valid, but no adapter recognized it: ${specPath}. First bytes: ${raw.slice(0, 80)}`,
  );
}

async function findCandidateSpecs(root: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(currentDir: string, depth: number): Promise<void> {
    if (depth > 5) {
      return;
    }

    let entries;

    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await walk(fullPath, depth + 1);
        }
        continue;
      }

      if (entry.isFile() && isCandidateSpecName(entry.name)) {
        found.push(fullPath);
      }
    }
  }

  await walk(root, 0);
  return found.sort();
}

async function diagnoseSpecFile(
  filePath: string,
  root: string,
): Promise<ApiSpecDetection | null> {
  const extension = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf8");
  const relativePath = toPosixPath(path.relative(root, filePath));

  if (extension === ".graphql" || extension === ".gql") {
    return {
      path: relativePath,
      absolutePath: filePath,
      format: "graphql",
      diagnosis: raw.includes("type Query")
        ? "GraphQL schema with Query type detected."
        : "GraphQL schema file detected.",
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code to create TypeScript, Zod, and GraphQL TanStack Query helpers.",
    };
  }

  if (extension === ".http" || extension === ".rest") {
    return {
      path: relativePath,
      absolutePath: filePath,
      format: "http-file",
      diagnosis: "HTTP request collection file detected.",
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code to create request clients and TanStack Query wrappers from HTTP examples.",
    };
  }

  const parsed =
    extension === ".json" ? (JSON.parse(raw) as unknown) : parseYaml(raw);

  if (!isRecord(parsed)) {
    return null;
  }

  if (typeof parsed.openapi === "string") {
    const info = asRecord(parsed.info);

    return {
      path: relativePath,
      absolutePath: filePath,
      format: extension === ".json" ? "openapi-json" : "openapi-yaml",
      diagnosis: `OpenAPI ${parsed.openapi} detected${
        typeof info.title === "string" ? `: ${info.title}` : ""
      }.`,
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code directly to create TypeScript, Zod, and TanStack Query files.",
    };
  }

  if (typeof parsed.swagger === "string") {
    const info = asRecord(parsed.info);

    return {
      path: relativePath,
      absolutePath: filePath,
      format: extension === ".json" ? "swagger-json" : "swagger-yaml",
      diagnosis: `Swagger/OpenAPI ${parsed.swagger} detected${
        typeof info.title === "string" ? `: ${info.title}` : ""
      }.`,
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code directly. The Swagger 2.0 adapter converts it internally.",
    };
  }

  if (typeof parsed.asyncapi === "string") {
    const info = asRecord(parsed.info);

    return {
      path: relativePath,
      absolutePath: filePath,
      format: extension === ".json" ? "asyncapi-json" : "asyncapi-yaml",
      diagnosis: `AsyncAPI ${parsed.asyncapi} detected${
        typeof info.title === "string" ? `: ${info.title}` : ""
      }.`,
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code to create message types, Zod schemas, and an AsyncAPI publish client.",
    };
  }

  const postmanInfo = asRecord(parsed.info);

  if (
    typeof postmanInfo.schema === "string" &&
    postmanInfo.schema.includes("schema.getpostman.com")
  ) {
    return {
      path: relativePath,
      absolutePath: filePath,
      format: "postman-collection",
      diagnosis: `Postman collection detected${
        typeof postmanInfo.name === "string" ? `: ${postmanInfo.name}` : ""
      }.`,
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code to create request clients and TanStack Query wrappers from collection items.",
    };
  }

  if (parsed._type === "export" && Array.isArray(parsed.resources)) {
    return {
      path: relativePath,
      absolutePath: filePath,
      format: "insomnia-export",
      diagnosis: "Insomnia export detected.",
      generationSupport: "supported",
      recommendedAction:
        "Use generate_code to create request clients and TanStack Query wrappers from exported requests.",
    };
  }

  return null;
}

async function loadSpec(specPath: string): Promise<unknown> {
  const raw = await fs.readFile(specPath, "utf8");
  const extension = path.extname(specPath).toLowerCase();

  if (extension === ".json") {
    return JSON.parse(raw) as unknown;
  }

  if (extension === ".yaml" || extension === ".yml") {
    return parseYaml(raw) as unknown;
  }

  throw new Error(`Unsupported spec extension: ${extension}`);
}

function collectOperations(spec: JsonObject): Operation[] {
  const pathsObject = asRecord(spec.paths);
  const operations: Operation[] = [];

  for (const [pathTemplate, pathValue] of Object.entries(pathsObject)) {
    const pathItem = asRecord(pathValue);
    const pathParameters = readParameters(pathItem.parameters);

    for (const [method, operationValue] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }

      const operationObject = asRecord(operationValue);
      const operationId =
        readOptionalString(operationObject.operationId) ??
        `${method}${pathTemplate
          .replace(/[{}]/g, "")
          .split("/")
          .filter(Boolean)
          .map(toPascalCase)
          .join("")}`;
      const functionName = toCamelCase(operationId);
      const typePrefix = toPascalCase(operationId);
      const operationParameters = [
        ...pathParameters,
        ...readParameters(operationObject.parameters),
      ];

      operations.push({
        method,
        pathTemplate,
        operationId,
        functionName,
        typePrefix,
        responseType: schemaToType(readResponseSchema(operationObject)),
        bodyType: readRequestBodyType(operationObject),
        parameters: operationParameters,
      });
    }
  }

  return operations;
}

function generateTypesFile(spec: JsonObject, operations: Operation[]): string {
  const schemas = getSchemas(spec);
  const lines = generatedHeader();

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const safeName = toTypeName(schemaName);
    const schemaObject = asRecord(schema);
    const type = schemaToType(schemaObject);

    if (schemaObject.type === "object" && isRecord(schemaObject.properties)) {
      lines.push(`export interface ${safeName} ${type}`);
    } else {
      lines.push(`export type ${safeName} = ${type};`);
    }

    lines.push("");
  }

  for (const operation of operations) {
    const paramsType = parametersToType(operation.parameters);

    lines.push(`export type ${operation.typePrefix}Params = ${paramsType};`);

    if (operation.bodyType) {
      lines.push(`export type ${operation.typePrefix}Body = ${operation.bodyType};`);
    }

    lines.push(
      `export type ${operation.typePrefix}Response = ${operation.responseType};`,
    );
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateZodFile(spec: JsonObject): string {
  const schemas = getSchemas(spec);
  const lines = [
    ...generatedHeader(),
    `import { z } from "zod";`,
    "",
  ];

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const safeName = toTypeName(schemaName);

    lines.push(
      `export const ${safeName}Schema = ${schemaToZod(asRecord(schema))};`,
    );
    lines.push(`export type ${safeName} = z.infer<typeof ${safeName}Schema>;`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateTanstackQueryFile(operations: Operation[]): string {
  const queryOperations = operations.filter((operation) => operation.method === "get");
  const typeImports = queryOperations.flatMap((operation) => [
    `${operation.typePrefix}Params`,
    `${operation.typePrefix}Response`,
  ]);
  const lines = [
    ...generatedHeader(),
    `import { useQuery, type UseQueryOptions } from "@tanstack/react-query";`,
  ];

  if (typeImports.length > 0) {
    lines.push(`import type { ${typeImports.join(", ")} } from "./types";`);
  }

  lines.push("");
  lines.push(`const API_BASE_URL = "";`);
  lines.push("");
  lines.push(`function getRuntimeOrigin(): string {`);
  lines.push(
    `  return typeof window === "undefined" ? "http://localhost" : window.location.origin;`,
  );
  lines.push(`}`);
  lines.push("");
  lines.push(
    `function buildPath(template: string, params?: Record<string, unknown>): string {`,
  );
  lines.push(
    `  return template.replace(/\\{([^}]+)\\}/g, (_, key: string) => encodeURIComponent(String(params?.[key] ?? "")));`,
  );
  lines.push(`}`);
  lines.push("");
  lines.push(
    `function appendQuery(url: URL, params: Record<string, unknown> | undefined, keys: string[]): void {`,
  );
  lines.push(`  if (!params) return;`);
  lines.push(`  for (const key of keys) {`);
  lines.push(`    const value = params[key];`);
  lines.push(`    if (value !== undefined && value !== null) {`);
  lines.push(`      url.searchParams.set(key, String(value));`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push("");
  lines.push(`async function readJson<T>(response: Response): Promise<T> {`);
  lines.push(`  if (!response.ok) {`);
  lines.push(
    `    throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);`,
  );
  lines.push(`  }`);
  lines.push(`  return response.json() as Promise<T>;`);
  lines.push(`}`);
  lines.push("");

  for (const operation of queryOperations) {
    const queryParams = operation.parameters
      .filter((parameter) => parameter.in === "query")
      .map((parameter) => parameter.name);
    const hasRequiredParams = operation.parameters.some(
      (parameter) => parameter.required,
    );
    const paramsArg = hasRequiredParams
      ? `params: ${operation.typePrefix}Params`
      : `params?: ${operation.typePrefix}Params`;

    lines.push(
      `export async function ${operation.functionName}(${paramsArg}, init?: RequestInit): Promise<${operation.typePrefix}Response> {`,
    );
    lines.push(
      `  const path = buildPath(${JSON.stringify(operation.pathTemplate)}, params);`,
    );
    lines.push(`  const url = new URL(API_BASE_URL + path, getRuntimeOrigin());`);
    lines.push(
      `  appendQuery(url, params, ${JSON.stringify(queryParams)});`,
    );
    lines.push(`  const response = await fetch(url, init);`);
    lines.push(`  return readJson<${operation.typePrefix}Response>(response);`);
    lines.push(`}`);
    lines.push("");
    lines.push(
      `export function use${operation.typePrefix}Query(${paramsArg}, options?: Omit<UseQueryOptions<${operation.typePrefix}Response, Error>, "queryKey" | "queryFn">) {`,
    );
    lines.push(`  return useQuery({`);
    lines.push(`    queryKey: [${JSON.stringify(operation.operationId)}, params],`);
    lines.push(
      `    queryFn: () => ${operation.functionName}(params as ${operation.typePrefix}Params),`,
    );
    lines.push(`    ...options,`);
    lines.push(`  });`);
    lines.push(`}`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generateIndexFile(features: Feature[]): string {
  const lines = generatedHeader();

  if (features.includes("types")) {
    lines.push(`export * from "./types";`);
  }

  if (features.includes("zod")) {
    lines.push(`export * from "./zod";`);
  }

  if (features.includes("tanstack-query")) {
    lines.push(`export * from "./tanstack-query";`);
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function generatedHeader(): string[] {
  return [
    "/* eslint-disable */",
    "// Generated by API Layer Codegen MCP. Do not edit manually.",
    "",
  ];
}

function getSchemas(spec: JsonObject): JsonObject {
  return asRecord(asRecord(spec.components).schemas);
}

function parametersToType(parameters: Parameter[]): string {
  if (parameters.length === 0) {
    return "Record<string, never>";
  }

  const lines = ["{"];

  for (const parameter of parameters) {
    lines.push(
      `  ${JSON.stringify(parameter.name)}${parameter.required ? "" : "?"}: ${parameter.type};`,
    );
  }

  lines.push("}");
  return lines.join("\n");
}

function schemaToType(schema: unknown): string {
  if (!isRecord(schema)) {
    return "unknown";
  }

  const ref = readOptionalString(schema.$ref);

  if (ref) {
    return toTypeName(ref.split("/").at(-1) ?? "Unknown");
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum
      .map((value) => JSON.stringify(value))
      .join(" | ");
  }

  if (Array.isArray(schema.oneOf)) {
    return schema.oneOf.map(schemaToType).join(" | ");
  }

  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.map(schemaToType).join(" | ");
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map(schemaToType).join(" & ");
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `${schemaToType(schema.items)}[]`;
    case "object": {
      const properties = asRecord(schema.properties);
      const required = new Set(
        Array.isArray(schema.required)
          ? schema.required.filter((value): value is string => typeof value === "string")
          : [],
      );

      if (Object.keys(properties).length === 0) {
        return "Record<string, unknown>";
      }

      const lines = ["{"];

      for (const [propertyName, propertySchema] of Object.entries(properties)) {
        lines.push(
          `  ${JSON.stringify(propertyName)}${required.has(propertyName) ? "" : "?"}: ${schemaToType(propertySchema)};`,
        );
      }

      lines.push("}");
      return lines.join("\n");
    }
    default:
      return "unknown";
  }
}

function schemaToZod(schema: unknown): string {
  if (!isRecord(schema)) {
    return "z.unknown()";
  }

  const ref = readOptionalString(schema.$ref);

  if (ref) {
    return `${toTypeName(ref.split("/").at(-1) ?? "Unknown")}Schema`;
  }

  if (Array.isArray(schema.enum)) {
    return `z.enum([${schema.enum
      .filter((value): value is string => typeof value === "string")
      .map((value) => JSON.stringify(value))
      .join(", ")}])`;
  }

  switch (schema.type) {
    case "string":
      return "z.string()";
    case "integer":
      return "z.number().int()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      return `z.array(${schemaToZod(schema.items)})`;
    case "object": {
      const properties = asRecord(schema.properties);
      const required = new Set(
        Array.isArray(schema.required)
          ? schema.required.filter((value): value is string => typeof value === "string")
          : [],
      );
      const entries = Object.entries(properties).map(([propertyName, propertySchema]) => {
        const zodExpression = schemaToZod(propertySchema);
        return `  ${JSON.stringify(propertyName)}: ${
          required.has(propertyName) ? zodExpression : `${zodExpression}.optional()`
        }`;
      });

      return `z.object({\n${entries.join(",\n")}\n}).passthrough()`;
    }
    default:
      return "z.unknown()";
  }
}

function readParameters(value: unknown): Parameter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((parameterValue): Parameter | null => {
      const parameter = asRecord(parameterValue);
      const name = readOptionalString(parameter.name);
      const location = readOptionalString(parameter.in);

      if (!name || !isParameterLocation(location)) {
        return null;
      }

      return {
        name,
        in: location,
        required: parameter.required === true || location === "path",
        type: schemaToType(asRecord(parameter.schema)),
      };
    })
    .filter((parameter): parameter is Parameter => parameter !== null);
}

function readResponseSchema(operation: JsonObject): unknown {
  const responses = asRecord(operation.responses);
  const statusCode =
    Object.keys(responses).find((key) => key.startsWith("2")) ??
    Object.keys(responses)[0];

  if (!statusCode) {
    return undefined;
  }

  return readJsonContentSchema(asRecord(responses[statusCode]));
}

function readRequestBodyType(operation: JsonObject): string | undefined {
  const requestBody = asRecord(operation.requestBody);
  const schema = readJsonContentSchema(requestBody);

  return schema ? schemaToType(schema) : undefined;
}

function readJsonContentSchema(container: JsonObject): unknown {
  const content = asRecord(container.content);
  const jsonContent = asRecord(
    content["application/json"] ?? Object.values(content).find(isRecord),
  );

  return jsonContent.schema;
}

async function writeGeneratedFile(
  outputDir: string,
  fileName: string,
  contents: string,
): Promise<string> {
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, contents, "utf8");
  return filePath;
}

function isCandidateSpecName(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();

  return (
    lowerName === "openapi.json" ||
    lowerName === "openapi.yaml" ||
    lowerName === "openapi.yml" ||
    lowerName === "swagger.json" ||
    lowerName === "swagger.yaml" ||
    lowerName === "swagger.yml" ||
    lowerName.endsWith(".openapi.json") ||
    lowerName.endsWith(".openapi.yaml") ||
    lowerName.endsWith(".openapi.yml") ||
    lowerName === "asyncapi.json" ||
    lowerName === "asyncapi.yaml" ||
    lowerName === "asyncapi.yml" ||
    lowerName.endsWith(".asyncapi.json") ||
    lowerName.endsWith(".asyncapi.yaml") ||
    lowerName.endsWith(".asyncapi.yml") ||
    lowerName.endsWith(".postman_collection.json") ||
    lowerName === "postman_collection.json" ||
    lowerName.endsWith(".insomnia.json") ||
    lowerName === "insomnia.json" ||
    lowerName === "schema.graphql" ||
    lowerName === "schema.gql" ||
    lowerName.endsWith(".graphql") ||
    lowerName.endsWith(".gql") ||
    lowerName.endsWith(".http") ||
    lowerName.endsWith(".rest")
  );
}

function readFeatures(value: unknown): Feature[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ["types"];
  }

  const features = value.filter((item): item is Feature =>
    item === "types" || item === "zod" || item === "tanstack-query",
  );

  if (features.length !== value.length) {
    throw new Error(
      'features must contain only "types", "zod", or "tanstack-query".',
    );
  }

  return Array.from(new Set(features));
}

function resolveFromCwd(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}

function toolResponse(payload: unknown): unknown {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function writeResult(id: JsonRpcId, result: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function writeError(
  id: JsonRpcId,
  code: number,
  message: string,
  error?: unknown,
): void {
  if (error) {
    process.stderr.write(
      `[mcp-api-layer-codegen] ${error instanceof Error ? error.stack : String(error)}\n`,
    );
  }

  process.stdout.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    })}\n`,
  );
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asRecord(value: unknown): JsonObject {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isParameterLocation(value: unknown): value is Parameter["in"] {
  return (
    value === "path" ||
    value === "query" ||
    value === "header" ||
    value === "cookie"
  );
}

function toTypeName(value: string): string {
  const name = toPascalCase(value);
  return /^\d/.test(name) ? `Schema${name}` : name;
}

function toPascalCase(value: string): string {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return "Generated";
  }

  return normalized
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join(path.posix.sep);
}
