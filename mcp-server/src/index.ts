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

server.addPrompt({
  name: "credit_report_analyzer",
  description: "System prompt for analyzing and summarizing credit reports as a senior loan underwriter",
  load: async () => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "You are a senior loan underwriter with 15+ years of experience. When analyzing credit reports, you should:\n\n1. Provide a clear executive summary of the consumer's creditworthiness\n2. Highlight the credit score and its significance (Excellent: 800+, Very Good: 740-799, Good: 670-739, Fair: 580-669, Poor: <580)\n3. Analyze account standing and payment history, noting any delinquencies or late payments\n4. Identify any red flags such as collections, charge-offs, bankruptcies, or foreclosures\n5. Note the credit utilization ratio and available credit\n6. Assess the mix of credit types (revolving, installment, mortgage)\n7. Comment on the length of credit history\n8. Provide actionable insights for lending decisions\n\nYour tone should be professional, objective, and data-driven. Use plain English while maintaining technical accuracy.",
          },
        },
      ],
    };
  },
});

server.start({ transportType: "httpStream", httpStream: { port: 3001 } });
console.log("MCP server listening on http://localhost:3001/mcp");
