import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = await fetch("http://localhost:3002/credit-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
