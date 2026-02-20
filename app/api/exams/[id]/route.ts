import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ExamSchema } from "@/lib/schemas";

// PUT /api/exams/[id] – update exam
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = verifyToken(req);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam || exam.userId !== payload.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = ExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { code, subject, examType, category, date, startTime, endTime } =
      parsed.data;

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        code,
        subject,
        examType,
        category,
        date: new Date(date),
        startTime,
        endTime,
      },
    });

    return NextResponse.json({ exam: updated });
  } catch (error) {
    console.error("[UPDATE_EXAM]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/exams/[id] – delete exam
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = verifyToken(req);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam || exam.userId !== payload.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
