import type { ModelContext, RegisterToolOptions, ToolDefinition } from "../src/types";

/** In-memory document.modelContext that honors AbortSignal unregistration. */
export function installFakeModelContext() {
  const tools = new Map<string, ToolDefinition>();
  const modelContext: ModelContext = {
    registerTool: (tool: ToolDefinition, options?: RegisterToolOptions) => {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => {
        tools.delete(tool.name);
      });
    }
  };
  document.modelContext = modelContext;
  return {
    tools,
    call: async (name: string, args: Record<string, unknown> = {}) => {
      const tool = tools.get(name);
      if (!tool) throw new Error(`tool not registered: ${name}`);
      return tool.execute(args);
    },
    uninstall: () => {
      delete document.modelContext;
    }
  };
}
