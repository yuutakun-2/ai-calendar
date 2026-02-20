import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// PATCH /api/exams/[id]/complete – toggle exam completion
export async function PATCH(
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

  const updated = await prisma.exam.update({
    where: { id },
    data: { completed: !exam.completed },
  });

  return NextResponse.json({ exam: updated });
}
