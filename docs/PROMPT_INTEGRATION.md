# MCP Prompt Integration

## Overview

The MCP Credit Report Demo now uses MCP prompts to centralize the LLM system instructions in the MCP server. This demonstrates how prompts can be shared across MCP clients and modified without changing client code.

## Architecture

**Before**: System prompt was hardcoded in `api-server/src/openai.ts`

**After**: 
1. System prompt is defined in the MCP server (`mcp-server/src/index.ts`)
2. API server retrieves the prompt via `client.getPrompt()`
3. Retrieved prompt is used for GPT-4o summarization

## Benefits

1. **Centralized prompt management** — Modify the prompt once in the MCP server
2. **Reusability** — Any MCP client can use the same prompt
3. **Separation of concerns** — Data layer (MCP server) owns both data schema and analysis instructions
4. **Version control** — Prompt changes are tracked with the MCP server code

## Implementation Details

### MCP Server (mcp-server/src/index.ts)

Added a prompt definition using `server.addPrompt()`:

```typescript
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
            text: "You are a senior loan underwriter with 15+ years of experience..."
          }
        }
      ]
    };
  }
});
```

### API Server (api-server/src/index.ts)

Retrieves the prompt before calling the LLM:

```typescript
// Get the system prompt from MCP server
const promptResult = await client.getPrompt({ 
  name: "credit_report_analyzer", 
  arguments: {} 
});

const systemPrompt = promptResult.messages?.find((msg) => msg.role === "user")?.content;
const systemPromptText = typeof systemPrompt === "string"
  ? systemPrompt
  : systemPrompt?.type === "text"
    ? systemPrompt.text
    : "You are a senior loan underwriter. Summarize the credit report.";

const summary = await summarizeCreditReport(reportSummary, systemPromptText);
```

### OpenAI Integration (api-server/src/openai.ts)

Updated to accept the system prompt as a parameter:

```typescript
export async function summarizeCreditReport(
  summary: Record<string, unknown>,
  systemPrompt: string
): Promise<string> {
  // ... OpenAI client setup ...
  
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(summary) }
    ]
  });
  
  return completion.choices[0].message.content ?? "(no response)";
}
```

## Prompt Content

The prompt instructs the LLM to act as a senior loan underwriter and includes guidance on:

1. Providing executive summaries of creditworthiness
2. Highlighting credit scores with context (Excellent: 800+, Very Good: 740-799, etc.)
3. Analyzing payment history and account standing
4. Identifying red flags (collections, charge-offs, bankruptcies)
5. Assessing credit utilization and available credit
6. Evaluating credit mix and history length
7. Providing actionable lending insights

The tone is professional, objective, and data-driven using plain English.

## Testing

Run the test script to verify the integration:

```bash
./test_prompt_integration.sh
```

This will:
1. Send a test request to the API server
2. The API server will retrieve the prompt from the MCP server
3. View logs to confirm prompt retrieval: `tail -f logs/api-server.log`

Look for the log message: `[API] Using system prompt from MCP server (length: XXX chars)`

## Modifying the Prompt

To change the system prompt:

1. Edit `mcp-server/src/index.ts`
2. Modify the `text` field in the prompt's `load` function
3. Restart the MCP server (or wait for tsx watch to reload)
4. No changes needed in the API server — it will automatically use the updated prompt

## Future Enhancements

Potential improvements to the prompt system:

1. **Parameterized prompts** — Use the `arguments` field to customize prompts per request
2. **Multiple prompt variants** — Different prompts for different lending scenarios
3. **Prompt versioning** — Track prompt changes and allow clients to specify versions
4. **A/B testing** — Serve different prompts to compare LLM performance
