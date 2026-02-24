# MCP Credit Report Demo

## Overview

The MCP Credit Report Demo achitecture consists of a three-tier separation: a Next.js UI (port 3000) 
for presentation, a Hono API Server (port 3002) for orchestration and GPT-4o summarization based on an 
MCP client, and a FastMCP Server (port 3001) for Equifax credit report data with
OAuth handling, where each layer operates independently with strict credential isolation and Zod validation 
at system boundaries to enable secure, scalable component replacement.

It features a three-process TypeScript application that fetches a consumer credit report from the Equifax sandbox API and summarises it with GPT-4o. The full architecture is documented in [`docs/architecture.pdf`](./docs/architecture.pdf).

---

## Architecture

The system is split across three independent processes:

```
Browser → Next.js :3000 → API Server :3002 → MCP Server :3001 → Equifax sandbox
                                            → GitHub Models (GPT-4o)
```

| Process | Port | Role |
|---------|------|------|
| **Next.js** | 3000 | React UI + thin HTTP proxy |
| **API Server** (Hono) | 3002 | MCP client + LLM summarisation |
| **MCP Server** (FastMCP) | 3001 | Equifax data fetching only |

### Next.js — Presentation layer
- Serves the React UI — a pre-populated consumer form read from `consumer.json`
- `CreditReportForm.tsx` handles form state and submits to `/api/credit-report`
- `SummaryDisplay.tsx` renders the LLM's markdown response as styled HTML via `react-markdown`
- The API route (`POST /api/credit-report`) is a **thin proxy** — it forwards the request to the API server and returns the response with no business logic

### API Server — Business logic layer
- Built with **Hono** on Node.js
- `POST /credit-report` connects to the MCP server via `StreamableHTTPClientTransport`, calls the `get_credit_report` tool, parses the JSON result, then calls GPT-4o to produce a plain-English summary
- All MCP client code and LLM interaction lives here

### MCP Server — Data layer
- Built with **FastMCP** using the Streamable HTTP transport (`/mcp` on port 3001)
- Exposes one tool: `get_credit_report` — validates consumer fields with Zod, fetches an OAuth token from Equifax, posts the OneView credit request, extracts key fields, and returns raw JSON
- No LLM calls — purely a data-fetching layer

---

## Request Flow

1. User submits the form in the browser
2. Browser POSTs `ConsumerFormData` to Next.js `/api/credit-report`
3. Next.js proxies the request to the API server (`POST :3002/credit-report`)
4. API server connects to the MCP server and calls `get_credit_report`
5. MCP server obtains an Equifax OAuth token and fetches the credit report
6. MCP server extracts a summary object and returns it as JSON
7. API server sends the summary to GPT-4o (via GitHub Models) for summarisation
8. API server returns `{ summary }` up the chain
9. Browser renders the markdown summary as formatted HTML

---

---
### Prerequisites

1. Linux or MacOS
2. Nodejs
3. Equifax developer sandbox credentials
4. A GitHub account with LLM access 

## Running the App

Three terminals are required:

```bash
# Terminal 1 — MCP server (port 3001)
cd mcp-server && npm run dev

# Terminal 2 — API server (port 3002)
cd api-server && npm run dev

# Terminal 3 — Next.js (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), review the pre-populated consumer data, and click **Get Credit Report**.

---

## Environment Variables

| Variable | File | Used by |
|----------|------|---------|
| `EQUIFAX_USERNAME` | `.env.local`, `mcp-server/.env` | MCP Server — Equifax OAuth |
| `EQUIFAX_PASSWORD` | `.env.local`, `mcp-server/.env` | MCP Server — Equifax OAuth |
| `GITHUB_TOKEN` | `api-server/.env` | API Server — GitHub Models (GPT-4o) |

---

## Key Dependencies

| Package | Process | Purpose |
|---------|---------|---------|
| `next`, `react`, `react-dom` | Next.js | React framework |
| `react-markdown` | Next.js | Render LLM markdown as HTML |
| `tailwindcss` | Next.js | Utility-first CSS |
| `hono`, `@hono/node-server` | API Server | HTTP framework |
| `@modelcontextprotocol/sdk` | API Server | MCP client transport |
| `openai` | API Server | GPT-4o via GitHub Models |
| `fastmcp` | MCP Server | MCP server framework |
| `zod` | MCP Server | Tool parameter validation |
| `dotenv` | API + MCP Server | Environment variable loading |
