import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { geminiModel, SYSTEM_PROMPT } from "@/lib/gemini";
import { AIMessageSchema } from "@/lib/schemas";

// Lightweight heuristic: reject clearly non-exam prompts before hitting the AI
const EXAM_KEYWORDS = [
  "exam",
  "test",
  "midterm",
  "mid term",
  "endterm",
  "end term",
  "lab",
  "quiz",
  "subject",
  "semester",
  "schedule",
  "timetable",
  "date",
  "time",
  "add",
  "create",
  "update",
  "edit",
  "delete",
  "remove",
  "mark",
  "complete",
  "backlog",
  "regular",
  "course",
  "class",
  "paper",
  "assessment",
  "ca ",
  "code",
  "morning",
  "afternoon",
  "evening",
];

function looksExamRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return EXAM_KEYWORDS.some((kw) => lower.includes(kw));
}

const VALID_STATUSES = ["off_topic", "incomplete", "complete"];
const VALID_EXAM_TYPES = ["Mid Term", "End Term", "CA", "Lab", "Other"];
const VALID_CATEGORIES = ["Regular", "Backlog"];

function validateAIResponse(
  json: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!json.status || !VALID_STATUSES.includes(json.status as string)) {
    return null;
  }

  if (json.status === "off_topic") {
    return {
      status: "off_topic",
      message:
        (json.message as string) ||
        "I can only help you manage your exam schedule. Please describe an exam you'd like to add or manage.",
    };
  }

  if (json.status === "incomplete") {
    return {
      status: "incomplete",
      missing: Array.isArray(json.missing) ? json.missing : [],
      gathered:
        json.gathered && typeof json.gathered === "object" ? json.gathered : {},
      message:
        (json.message as string) ||
        "I need a few more details to add your exam.",
    };
  }

  if (json.status === "complete") {
    const data = json.data as Record<string, unknown> | undefined;
    if (!data) return null;

    // Validate all required fields exist
    const required = [
      "code",
      "subject",
      "examType",
      "category",
      "semester",
      "date",
      "startTime",
      "endTime",
    ];
    for (const field of required) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        return null;
      }
    }

    // Validate examType
    if (!VALID_EXAM_TYPES.includes(data.examType as string)) return null;

    // Validate category
    if (!VALID_CATEGORIES.includes(data.category as string)) return null;

    // Validate semester is a positive integer
    const semester = Number(data.semester);
    if (!Number.isInteger(semester) || semester < 1) return null;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date as string)) return null;

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(data.startTime as string)) return null;
    if (!/^\d{2}:\d{2}$/.test(data.endTime as string)) return null;

    return {
      status: "complete",
      data: {
        code: data.code,
        subject: data.subject,
        examType: data.examType,
        category: data.category,
        semester: semester,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    };
  }

  return null;
}

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

    // Server-side heuristic check: if message is clearly not exam-related
    // AND there are no gathered fields (i.e. not in the middle of a conversation)
    if (
      !looksExamRelated(message) &&
      (!gatheredFields || Object.keys(gatheredFields).length === 0)
    ) {
      return NextResponse.json({
        status: "off_topic",
        message:
          "I can only help you manage your exam schedule. Please describe an exam you'd like to add or manage.",
      });
    }

    // Build context from already gathered fields
    const fieldContext =
      gatheredFields && Object.keys(gatheredFields).length > 0
        ? `\nAlready gathered fields: ${JSON.stringify(gatheredFields)}`
        : "";

    const prompt = `${SYSTEM_PROMPT}${fieldContext}\n\nUser message: ${message}`;

    // Retry logic for transient Gemini API errors (503 high demand)
    let text = "";
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await geminiModel.generateContent(prompt);
        text = result.response.text().trim();
        lastError = null;
        break;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("503") ||
          msg.includes("overloaded") ||
          msg.includes("high demand")
        ) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    if (lastError) {
      console.error("[AI_ROUTE] Gemini API failed after retries:", lastError);
      return NextResponse.json({
        status: "error",
        message:
          "AI service is temporarily busy. Please try again in a moment.",
      });
    }

    // Strip markdown code blocks if Gemini wraps response
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(cleaned);
    } catch {
      console.error("[AI_ROUTE] Failed to parse AI response:", text);
      return NextResponse.json({
        status: "error",
        message:
          "AI returned an unexpected response. Please try rephrasing your message.",
      });
    }

    // Validate the AI response structure
    const validated = validateAIResponse(json);
    if (!validated) {
      console.error("[AI_ROUTE] AI response failed validation:", json);
      return NextResponse.json({
        status: "error",
        message: "AI returned an invalid response format. Please try again.",
      });
    }

    return NextResponse.json(validated);
  } catch (error) {
    console.error("[AI_ROUTE]", error);
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
