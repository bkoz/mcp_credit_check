import OpenAI from "openai";

export async function summarizeCreditReport(
  summary: Record<string, unknown>
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
        content:
          "You are a financial analyst. Summarize the following credit report in plain English, highlighting key details such as credit score, account standing, payment history, and any alerts or flags.",
      },
      {
        role: "user",
        content: JSON.stringify(summary),
      },
    ],
  });

  return completion.choices[0].message.content ?? "(no response)";
}
