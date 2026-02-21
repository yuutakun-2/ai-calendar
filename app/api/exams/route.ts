import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ExamSchema } from "@/lib/schemas";

// GET /api/exams – list all exams for authenticated user
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exams = await prisma.exam.findMany({
    where: { userId: payload.userId },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ exams });
}

// POST /api/exams – create a new exam
export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = ExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      code,
      subject,
      examType,
      category,
      semester,
      date,
      startTime,
      endTime,
    } = parsed.data;

    const exam = await prisma.exam.create({
      data: {
        code,
        subject,
        examType,
        category,
        semester,
        date: new Date(date),
        startTime,
        endTime,
        userId: payload.userId,
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_EXAM]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
