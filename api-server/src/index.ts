import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { summarizeCreditReport } from "./openai.js";

const app = new Hono();

app.post("/credit-report", async (c) => {
  const form = await c.req.json();
  const mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:3001/mcp";
  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl));
  const client = new Client({ name: "equifax-api", version: "1.0.0" });
  try {
    await client.connect(transport);

    // Get the credit report data
    const result = await client.callTool({ name: "get_credit_report", arguments: form });
    const text = (result.content as Array<{ type: string; text: string }>)
      .find((item) => item.type === "text")?.text ?? "";
    const reportSummary = JSON.parse(text) as Record<string, unknown>;

    // Get the system prompt from MCP server
    const promptResult = await client.getPrompt({ name: "credit_report_analyzer", arguments: {} });
    const systemPrompt = promptResult.messages?.find((msg) => msg.role === "user")?.content;
    const systemPromptText = typeof systemPrompt === "string"
      ? systemPrompt
      : systemPrompt?.type === "text"
        ? systemPrompt.text
        : "You are a senior loan underwriter. Summarize the credit report.";

    console.log("[API] Using system prompt from MCP server (length:", systemPromptText.length, "chars)");
    const summary = await summarizeCreditReport(reportSummary, systemPromptText);
    return c.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  } finally {
    await client.close();
  }
});

serve({ fetch: app.fetch, port: 3002 });
console.log("API server listening on http://localhost:3002");
