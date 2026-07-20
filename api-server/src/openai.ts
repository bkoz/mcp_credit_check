import OpenAI from "openai";

export async function summarizeCreditReport(
  summary: Record<string, unknown>,
  systemPrompt: string
): Promise<string> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }

  const client = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: githubToken,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(summary),
      },
    ],
  });

  return completion.choices[0].message.content ?? "(no response)";
}
