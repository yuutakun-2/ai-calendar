import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { geminiModel, SYSTEM_PROMPT } from "@/lib/gemini";
import { AIMessageSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = AIMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { message, gatheredFields } = parsed.data;

    // Build context from already gathered fields
    const fieldContext =
      gatheredFields && Object.keys(gatheredFields).length > 0
        ? `\nAlready gathered fields: ${JSON.stringify(gatheredFields)}`
        : "";

    const prompt = `${SYSTEM_PROMPT}${fieldContext}\n\nUser message: ${message}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if Gemini wraps response
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "AI returned an unexpected response. Please try again.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("[AI_ROUTE]", error);
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
