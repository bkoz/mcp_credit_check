# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a three-tier MCP (Model Context Protocol) demo application that fetches Equifax credit reports and generates natural language summaries using GPT-4o via GitHub Models. The architecture demonstrates credential isolation and modular separation of concerns.

**Key architectural principle**: Each layer operates independently with strict credential boundaries. Equifax credentials never leave the MCP server; GitHub tokens stay in the API layer; the Next.js layer has no credentials.

## Architecture

```
Next.js (port 3000)        →  Presentation layer, thin HTTP proxy
    ↓
API Server (port 3002)     →  Business logic, MCP client, LLM summarization
    ↓
MCP Server (port 3001)     →  Data layer, Equifax credit report fetching
```

### Service Responsibilities

**Next.js (`src/` directory)**
- React UI that reads pre-populated consumer data from `consumer.json`
- API route at `/api/credit-report/route.ts` is a thin proxy with no business logic
- Forwards requests to API server and renders markdown responses via `react-markdown`

**API Server (`api-server/src/index.ts`)**
- Hono-based server that acts as MCP client
- Connects to MCP server via `StreamableHTTPClientTransport`
- Calls `get_credit_report` tool, parses JSON result, sends to GPT-4o for summarization
- All MCP client code and LLM interaction lives here

**MCP Server (`mcp-server/src/index.ts`)**
- FastMCP server exposing single tool: `get_credit_report`
- Handles OAuth with Equifax, fetches credit reports, extracts key fields
- Returns raw JSON data only (no LLM calls)
- Uses Zod for parameter validation

## Development Commands

### Starting the Application

**Recommended: Start all services together**
```bash
npm run dev:all
# or
./start-all.sh
```
This starts all three services and writes logs to `logs/` directory. Press Ctrl+C to stop all services.

**Manual start (separate terminals)**
```bash
# Terminal 1 — MCP server (port 3001)
cd mcp-server && npm run dev

# Terminal 2 — API server (port 3002)
cd api-server && npm run dev

# Terminal 3 — Next.js (port 3000)
npm run dev
```

### Building

```bash
# Build Next.js
npm run build

# Build API server
cd api-server && npm run build

# Build MCP server
cd mcp-server && npm run build
```

### Linting

```bash
npm run lint
```

### Testing

Standalone test script (no web UI):
```bash
cd testing
export EQUIFAX_CLIENT_ID=your_equifax_client_id_here
export EQUIFAX_CLIENT_SECRET=your_equifax_client_secret_here
export GITHUB_TOKEN=your_github_token_here
npx tsx api_call.ts
```

## Environment Variables

All services require environment variables for credentials:

| Variable | Location | Purpose |
|----------|----------|---------|
| `EQUIFAX_CLIENT_ID` | `mcp-server/.env` | Equifax OAuth client ID |
| `EQUIFAX_CLIENT_SECRET` | `mcp-server/.env` | Equifax OAuth client secret |
| `GITHUB_TOKEN` | `api-server/.env` | GitHub Models API access (GPT-4o) |

**Important**: Credentials are isolated per service. Never share credentials across service boundaries.

## Key Files

**Data Flow Entry Points**
- `src/app/api/credit-report/route.ts` — Next.js API route (thin proxy)
- `api-server/src/index.ts` — MCP client + LLM orchestration + prompt retrieval
- `api-server/src/openai.ts` — GPT-4o summarization logic
- `mcp-server/src/index.ts` — MCP server tool + prompt definitions
- `mcp-server/src/equifax.ts` — Equifax API integration (OAuth, credit report fetching)

**Configuration**
- `consumer.json` — Pre-populated consumer data for the form
- `start-all.sh` — Multi-service startup script with log management

## Code Patterns

### MCP Client Connection (API Server)
```typescript
const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3001/mcp"));
const client = new Client({ name: "equifax-api", version: "1.0.0" });
await client.connect(transport);
const result = await client.callTool({ name: "get_credit_report", arguments: form });
```

### MCP Server Tool Definition (MCP Server)
```typescript
server.addTool({
  name: "get_credit_report",
  description: "...",
  parameters: z.object({...}),  // Zod validation
  execute: async (params) => { return JSON.stringify(data); }
});
server.start({ transportType: "httpStream", httpStream: { port: 3001 } });
```

### MCP Server Prompt Definition (MCP Server)
The MCP server exposes a prompt that defines the LLM's system instructions:
```typescript
server.addPrompt({
  name: "credit_report_analyzer",
  description: "System prompt for analyzing credit reports",
  load: async () => {
    return {
      messages: [
        {
          role: "user",
          content: { type: "text", text: "System prompt text here..." }
        }
      ]
    };
  }
});
```

### Retrieving and Using MCP Prompts (API Server)
The API server retrieves the prompt from the MCP server and uses it for LLM calls:
```typescript
const promptResult = await client.getPrompt({ name: "credit_report_analyzer", arguments: {} });
const systemPrompt = promptResult.messages?.find((msg) => msg.role === "user")?.content;
const systemPromptText = typeof systemPrompt === "string"
  ? systemPrompt
  : systemPrompt?.type === "text"
    ? systemPrompt.text
    : "fallback prompt";
```

### Validation
- All MCP tool parameters are validated with Zod schemas
- API boundaries use JSON parsing with error handling
- Consumer form data structure is defined in `consumer.json`

## Service Dependencies

**Startup Order**: MCP Server (3001) → API Server (3002) → Next.js (3000)

The `start-all.sh` script handles this with 2-second delays between services.

**HTTP Transport**: 
- MCP uses `StreamableHTTPClientTransport` over HTTP (not stdio)
- Endpoint: `http://localhost:3001/mcp`

## Common Development Tasks

**Modifying the LLM System Prompt**
Edit the prompt definition in `mcp-server/src/index.ts` in the `addPrompt()` call. The prompt is centralized in the MCP server and retrieved by the API server at runtime.

**Modifying the LLM Summary Logic**
Edit `api-server/src/openai.ts` — this is where the GPT-4o response handling lives. The system prompt is now retrieved from the MCP server.

**Changing Equifax Data Extraction**
Edit `mcp-server/src/equifax.ts` in the `extractReportSummary` function.

**Updating Consumer Form Fields**
- Modify the Zod schema in `mcp-server/src/index.ts` 
- Update form component in `src/components/CreditReportForm.tsx`
- Update `consumer.json` with new test data

**Viewing Logs**
All services log to `logs/` directory:
- `logs/mcp-server.log`
- `logs/api-server.log`
- `logs/nextjs.log`

## TypeScript Configuration

All three projects use TypeScript with ES modules (`"type": "module"` in package.json):
- Development: `tsx watch src/index.ts`
- Build: `tsc`
- All projects use Node 20+ type definitions

## Dependencies

**MCP-specific packages**:
- `@modelcontextprotocol/sdk` — MCP client (API server)
- `fastmcp` — MCP server framework (MCP server)

**LLM Integration**:
- `openai` package (used for GitHub Models API, not OpenAI directly)

**Web Framework**:
- Next.js 16.x with React 19.x
- Hono (API server)
- Tailwind CSS for styling
