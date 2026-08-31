/**
 * Injected before any page script runs. Implements enough of the WebMCP
 * standard (`document.modelContext.registerTool`) that the harness can act
 * as the agent host in stock Chromium — no browser flag, no origin trial.
 * Registered tools are captured and called through `window.__agentperf`.
 */
export const HOST_SHIM = `
(() => {
  const tools = new Map();
  const api = {
    listTools: () =>
      Array.from(tools.values()).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema || { type: "object", properties: {} },
        annotations: t.annotations || {}
      })),
    call: async (name, args) => {
      const tool = tools.get(name);
      if (!tool) {
        return {
          content: [{ type: "text", text: "No tool named \\"" + name + "\\" is registered on this page." }],
          isError: true
        };
      }
      const result = await tool.execute(args || {});
      if (typeof result === "string") return { content: [{ type: "text", text: result }] };
      return result;
    }
  };
  Object.defineProperty(window, "__agentperf", { value: api });

  const modelContext = {
    registerTool: (tool, options) => {
      tools.set(tool.name, tool);
      if (options && options.signal) {
        options.signal.addEventListener("abort", () => { tools.delete(tool.name); });
      }
    },
    getTools: async () => api.listTools()
  };
  Object.defineProperty(document, "modelContext", { value: modelContext, configurable: true });
  Object.defineProperty(navigator, "modelContext", { value: modelContext, configurable: true });
})();
`;
