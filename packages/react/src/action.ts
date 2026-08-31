/**
 * Schema-gated actions. Every call is validated before your handler runs;
 * invalid input gets a structured refusal naming each violated field, so an
 * agent can fix its call instead of corrupting your state. The gate is
 * deterministic — the same input always gets the same verdict.
 */
import { useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { BoundaryContext } from "./boundary";
import {
  textResult,
  webmcpSupported,
  type JsonSchemaObject,
  type ToolResult
} from "./types";

export interface AgentActionConfig<Schema extends z.ZodType = z.ZodType> {
  /** What this action does, written for the agent deciding whether to call it. */
  description: string;
  /** Input contract. Omit for zero-argument actions. */
  input?: Schema;
  /** True when the action changes nothing — lets agents call it freely. */
  readOnly?: boolean;
  /** True when the action destroys something a person would miss. */
  destructive?: boolean;
  /**
   * Reserved: price per call (e.g. "$0.001"). Inert in v1 — declared here so
   * adding x402 settlement later is not a breaking change.
   */
  price?: string;
  /** Runs only after input passes the schema gate. */
  execute: (input: z.infer<Schema>) => Promise<unknown> | unknown;
}

export interface AgentActionStatus {
  /** Whether this browser accepts WebMCP registrations. */
  supported: boolean;
  /** The name the tool was published under (boundary prefixes applied). */
  name: string;
}

function formatRefusal(toolName: string, error: z.ZodError): ToolResult {
  const violations = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "input";
    return `- ${path}: ${issue.message}`;
  });
  return textResult(
    `REFUSED: invalid input for "${toolName}".\n` +
      `Violations (${violations.length}):\n${violations.join("\n")}\n\n` +
      `Fix the specific violations above and call the tool again. ` +
      `Validation is deterministic — the same input always gets the same verdict.`,
    true
  );
}

function toInputSchema(schema: z.ZodType | undefined): JsonSchemaObject {
  if (!schema) return { type: "object", properties: {}, additionalProperties: false };
  const { $schema: _discard, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest as JsonSchemaObject;
}

/**
 * Publish an action as a WebMCP tool for the lifetime of the component.
 * Inside an `<AgentBoundary name="cart">`, `name` becomes `cart_name`.
 * The handler and description are read at call time through a ref, so
 * re-renders never re-register the tool.
 */
export function useAgentAction<Schema extends z.ZodType>(
  name: string,
  config: AgentActionConfig<Schema>
): AgentActionStatus {
  const scope = useContext(BoundaryContext);
  const fullName = scope ? `${scope.replace(/\./g, "_")}_${name}` : name;

  const configRef = useRef(config);
  configRef.current = config;

  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!webmcpSupported()) return;
    const controller = new AbortController();
    const registeredWith = configRef.current;

    Promise.resolve(
      document.modelContext!.registerTool(
        {
          name: fullName,
          description: registeredWith.description,
          inputSchema: toInputSchema(registeredWith.input),
          annotations: {
            readOnlyHint: registeredWith.readOnly === true,
            ...(registeredWith.destructive !== undefined && {
              destructiveHint: registeredWith.destructive
            })
          },
          execute: async (args) => {
            const current = configRef.current;
            let input: unknown = args;
            if (current.input) {
              const parsed = current.input.safeParse(args);
              if (!parsed.success) return formatRefusal(fullName, parsed.error);
              input = parsed.data;
            }
            try {
              const out = await current.execute(input as z.infer<Schema>);
              if (out === undefined) return textResult("Done.");
              return textResult(typeof out === "string" ? out : JSON.stringify(out));
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              return textResult(`Error in "${fullName}": ${message}`, true);
            }
          }
        },
        { signal: controller.signal }
      )
    )
      .then(() => {
        if (!controller.signal.aborted) setSupported(true);
      })
      .catch(() => {
        /* registration failed — tool stays unpublished; page works for humans */
      });

    return () => controller.abort();
  }, [fullName]);

  return { supported, name: fullName };
}
