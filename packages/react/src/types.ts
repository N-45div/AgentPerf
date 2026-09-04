/**
 * Minimal typings for the WebMCP browser API.
 *
 * The standard exposes `document.modelContext` (Chrome 149+ origin trial;
 * `navigator.modelContext` was the pre-Chrome-150 spelling and is deprecated).
 * Browsers without the API can get it from a polyfill such as `@mcp-b/global`.
 * Only the surface this library uses is typed.
 */

export interface ToolTextContent {
  type: "text";
  text: string;
}

export type ToolContent = ToolTextContent;

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  /**
   * High-stakes, irreversible or real-world action. Chrome 154+ uses it to
   * tell an agent to confirm with the person before calling the tool.
   */
  consequentialHint?: boolean;
  idempotentHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface JsonSchemaObject {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: JsonSchemaObject;
  annotations?: ToolAnnotations;
  execute: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
}

export interface RegisterToolOptions {
  /** Aborting this signal unregisters the tool. */
  signal?: AbortSignal;
  /** Origins allowed to see this tool when the page is framed. */
  exposedTo?: string[];
}

export interface ModelContext {
  registerTool: (
    tool: ToolDefinition,
    options?: RegisterToolOptions
  ) => Promise<void> | void;
  getTools?: () => Promise<ToolDefinition[]>;
  addEventListener?: EventTarget["addEventListener"];
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

/** True when this browser can accept WebMCP tool registrations. */
export function webmcpSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.modelContext?.registerTool === "function"
  );
}

/** Canonical text result — identical shape across agents. */
export function textResult(text: string, isError = false): ToolResult {
  return isError
    ? { content: [{ type: "text", text }], isError: true }
    : { content: [{ type: "text", text }] };
}
