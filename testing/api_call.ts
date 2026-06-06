import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";

//
// Step 1: Obtain an OAuth token
//
const USERNAME = process.env.EQUIFAX_USERNAME;
const PASSWORD = process.env.EQUIFAX_PASSWORD;
const TOKEN_URL = "https://api.sandbox.equifax.com/v2/oauth/token";

//
// Step 2: Using the token, obtain a credit report
//
const CREDIT_URL =
  "https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report";

async function main() {
  // Step 1: Obtain OAuth token
  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    console.error("Failed to obtain access token:");
    console.error(JSON.stringify(tokenData, null, 2));
    process.exit(1);
  }

  console.log("Token obtained successfully.");

  // Step 2: Fetch credit report
  const consumer = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "consumer.json"), "utf-8")
  );

  const reportResponse = await fetch(CREDIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(consumer),
  });

  const report = await reportResponse.json();

  // Step 3: Summarize the credit report using a GitHub Models LLM
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("GITHUB_TOKEN environment variable is not set.");
    process.exit(1);
  }

  const client = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: githubToken,
  });

  const creditReport =
    report?.consumers?.equifaxUSConsumerCreditReport?.[0] ?? {};

  const summary = {
    subjectName: creditReport.subjectName,
    birthDate: creditReport.birthDate,
    hitCode: creditReport.hitCode,
    fileSinceDate: creditReport.fileSinceDate,
    lastActivityDate: creditReport.lastActivityDate,
    fraudSocialNumAlertCode: creditReport.fraudSocialNumAlertCode,
    fraudVictimIndicator: creditReport.fraudVictimIndicator,
    models: creditReport.models,
    trades: (creditReport.trades ?? []).map((t: Record<string, unknown>) => ({
      accountDesignator: t.accountDesignator,
      creditorName: t.creditorName,
      accountNumber: t.accountNumber,
      dateOpened: t.dateOpened,
      dateClosed: t.dateClosed,
      dateLastPayment: t.dateLastPayment,
      highCredit: t.highCredit,
      balance: t.balance,
      pastDue: t.pastDue,
      paymentHistory: t.paymentHistory,
      delinquencies30Days: t.delinquencies30Days,
      delinquencies60Days: t.delinquencies60Days,
      delinquencies90to180Days: t.delinquencies90to180Days,
    })),
    inquiries: creditReport.inquiries,
    publicRecords: creditReport.publicRecords,
    collections: creditReport.collections,
  };

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

  console.log("\n--- Credit Report Summary ---\n");
  console.log(completion.choices[0].message.content);
}

main();
