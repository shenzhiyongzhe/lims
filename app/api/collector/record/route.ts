export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const loan_id = Number(searchParams.get("loan_id") || 0);
  console.log("loan_id:" + loan_id + " " + typeof loan_id);
  if (!loan_id)
    return NextResponse.json({ message: "缺少 loan_id" }, { status: 400 });

  const where = {
    loan_id: loan_id as any,
  };

  const [total, rows] = await Promise.all([
    prisma.repaymentSchedule.count({ where }),
    prisma.repaymentSchedule.findMany({
      where,
      orderBy: [{ loan_id: "desc" }, { period: "asc" }],

      select: {
        schedule_id: true,
        loan_id: true,
        period: true,
        due_start_date: true,
        due_end_date: true,
        due_amount: true,
        status: true,
        loan_account: { select: { username: true, collector: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: rows,
  });
}
