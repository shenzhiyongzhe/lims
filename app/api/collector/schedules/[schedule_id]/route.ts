import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

type Ctx = {
  params: Promise<{ schedule_id: string }>;
};

export async function POST(req: Request, { params }: Ctx) {
  const { schedule_id: scheduleId } = await params; // 添加 await
  const schedule_id = Number(scheduleId);

  if (!Number.isInteger(schedule_id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const body = await req.json();
    const { due_amount, due_end_date, status } = body;

    const updated = await prisma.repaymentSchedule.update({
      where: { schedule_id },
      data: {
        ...(due_amount && { due_amount }),
        ...(due_end_date && { due_end_date: new Date(due_end_date) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      message: "更新成功",
      data: updated,
    });
  } catch (error: any) {
    console.error("更新还款计划失败:", error);
    return NextResponse.json({ message: "更新失败" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: Ctx) {
  const { schedule_id: scheduleId } = await params; // 添加 await
  const schedule_id = Number(scheduleId);

  if (!Number.isInteger(schedule_id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { schedule_id },
      include: {
        loan_account: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ message: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: schedule });
  } catch (error: any) {
    console.error("获取还款计划失败:", error);
    return NextResponse.json({ message: "获取失败" }, { status: 500 });
  }
}
