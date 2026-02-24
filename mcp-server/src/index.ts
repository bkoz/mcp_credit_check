import "dotenv/config";
import { FastMCP } from "fastmcp";
import { z } from "zod";
import {
  getEquifaxToken,
  buildConsumerPayload,
  fetchCreditReport,
  extractReportSummary,
} from "./equifax.js";

const server = new FastMCP({ name: "Equifax Credit Report", version: "1.0.0" });

server.addTool({
  name: "get_credit_report",
  description:
    "Fetch an Equifax sandbox credit report for a consumer and return the extracted summary as JSON",
  parameters: z.object({
    firstName: z.string(),
    lastName: z.string(),
    ssn: z.string(),
    houseNumber: z.string(),
    streetName: z.string(),
    streetType: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  execute: async (params) => {
    console.log(`[tool] get_credit_report called with:`, JSON.stringify(params, null, 2));
    const token = await getEquifaxToken();
    const payload = buildConsumerPayload(params);
    const report = await fetchCreditReport(token, payload);
    const summary = extractReportSummary(report);
    return JSON.stringify(summary);
  },
});

server.start({ transportType: "httpStream", httpStream: { port: 3001 } });
console.log("MCP server listening on http://localhost:3001/mcp");
