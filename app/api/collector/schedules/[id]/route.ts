import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import crypto from "crypto";

type Ctx = {
  params: Promise<{ schedule_id: string }>;
};

export async function GET(req: Request, { params }: Ctx) {
  const { schedule_id: scheduleId } = await params; // 添加 await
  const schedule_id = Number(scheduleId);

  if (!Number.isInteger(schedule_id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { id: schedule_id },
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

export async function POST(req: Request, { params }: Ctx) {
  const { schedule_id: scheduleId } = await params; // 添加 await
  const schedule_id = Number(scheduleId);

  if (!Number.isInteger(schedule_id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const body = await req.json();
    const { due_amount, due_end_date, status } = body;

    const updated = await prisma.repaymentSchedule.update({
      where: { id: schedule_id },
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

// 新增PUT方法来生成分享链接
export async function PUT(req: Request, { params }: Ctx) {
  const { schedule_id: scheduleId } = await params;
  const schedule_id = Number(scheduleId);

  if (!Number.isInteger(schedule_id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    // 获取还款计划数据
    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { id: schedule_id },
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

    // 生成分享token (包含schedule_id和过期时间)
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3小时后过期
    const tokenData = {
      id: schedule_id,
      expires_at: expiresAt.getTime(),
    };

    // 使用简单的编码方式（实际项目中建议使用JWT）
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");

    // 生成分享链接
    const shareUrl = `/customer/shared/${token}`;

    return NextResponse.json({
      message: "分享链接生成成功",
      data: {
        shareUrl,
        expiresAt,
        token,
      },
    });
  } catch (error: any) {
    console.error("生成分享链接失败:", error);
    return NextResponse.json({ message: "生成分享链接失败" }, { status: 500 });
  }
}
