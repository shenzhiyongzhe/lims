export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const loanId = Number(searchParams.get("loan_id") || 0);

  if (!loanId)
    return NextResponse.json({ message: "缺少 loan_id" }, { status: 400 });

  const rows = await prisma.repaymentSchedule.findMany({
    where: { loan_id: loanId },
    orderBy: [{ period: "asc" }],
    select: {
      id: true,
      loan_id: true,
      period: true,
      due_start_date: true,
      due_end_date: true,
      due_amount: true,
      capital: true,
      interest: true,
      status: true,
      paid_amount: true,
      paid_at: true,
    },
  });

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  try {
    const { schedule_id, due_amount, due_end_date, status } = await req.json();

    const schedule = await prisma.repaymentSchedule.update({
      where: { id: schedule_id },
      data: { due_amount, due_end_date, status },
    });

    return NextResponse.json({ data: schedule });
  } catch (error) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
