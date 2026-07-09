#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { parse as parseYaml } from "yaml";

type JsonObject = Record<string, unknown>;
type JsonRpcId = string | number | null;
type Feature = "types" | "zod" | "tanstack-query";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: JsonObject;
};

type ApiSpecDetection = {
  path: string;
  absolutePath: string;
  format: "openapi-json" | "openapi-yaml" | "graphql";
  diagnosis: string;
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

const MCP_TOOLS = [
  {
    name: "detect_api_spec",
    description:
      "현재 프로젝트 디렉토리에서 OpenAPI(swagger.json/yaml) 또는 GraphQL Schema 파일을 탐색하고 형식을 진단합니다.",
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
      "OpenAPI/GraphQL 스펙 파일을 읽어 TypeScript 타입, Zod 스키마, TanStack Query 훅을 자동 생성합니다.",
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
          name: "mcp-codegen-agent",
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

  return {
    projectRoot,
    found: detected,
    primarySpec: detected[0]?.path ?? null,
    message:
      detected.length > 0
        ? `${detected.length} API spec file(s) detected.`
        : "No OpenAPI or GraphQL schema file was detected.",
  };
}

async function generateCode(args: JsonObject): Promise<unknown> {
  const specPath = readString(args.specPath, "specPath");
  const outputDir = readString(args.outputDir, "outputDir");
  const features = readFeatures(args.features);
  const absoluteSpecPath = resolveFromCwd(specPath);
  const absoluteOutputDir = resolveFromCwd(outputDir);
  const spec = await loadSpec(absoluteSpecPath);

  if (!isRecord(spec) || typeof spec.openapi !== "string") {
    throw new Error(
      "generate_code currently supports OpenAPI 3.x YAML/JSON specs. GraphQL detection is available, but GraphQL codegen is not implemented yet.",
    );
  }

  await fs.mkdir(absoluteOutputDir, { recursive: true });

  const generatedFiles: string[] = [];
  const operations = collectOperations(spec);

  if (features.includes("types")) {
    generatedFiles.push(
      await writeGeneratedFile(
        absoluteOutputDir,
        "types.ts",
        generateTypesFile(spec, operations),
      ),
    );
  }

  if (features.includes("zod")) {
    generatedFiles.push(
      await writeGeneratedFile(
        absoluteOutputDir,
        "zod.ts",
        generateZodFile(spec),
      ),
    );
  }

  if (features.includes("tanstack-query")) {
    generatedFiles.push(
      await writeGeneratedFile(
        absoluteOutputDir,
        "tanstack-query.ts",
        generateTanstackQueryFile(operations),
      ),
    );
  }

  generatedFiles.push(
    await writeGeneratedFile(
      absoluteOutputDir,
      "index.ts",
      generateIndexFile(features),
    ),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    engine: "builtin-openapi",
    specPath: absoluteSpecPath,
    outputDir: absoluteOutputDir,
    features,
    operationCount: operations.length,
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
    };
  }

  if (typeof parsed.swagger === "string") {
    const info = asRecord(parsed.info);

    return {
      path: relativePath,
      absolutePath: filePath,
      format: extension === ".json" ? "openapi-json" : "openapi-yaml",
      diagnosis: `Swagger/OpenAPI ${parsed.swagger} detected${
        typeof info.title === "string" ? `: ${info.title}` : ""
      }.`,
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
    "// Generated by mcp-codegen-agent. Do not edit manually.",
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
    lowerName === "schema.graphql" ||
    lowerName === "schema.gql" ||
    lowerName.endsWith(".graphql") ||
    lowerName.endsWith(".gql")
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
      `[mcp-codegen-agent] ${error instanceof Error ? error.stack : String(error)}\n`,
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
