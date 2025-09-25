import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function GET(req: Request, { params }: Ctx) {
  const { token } = await params;

  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { share_id: token },
    });

    if (!shareLink) {
      return NextResponse.json({ message: "分享链接不存在" }, { status: 404 });
    }

    // 检查链接是否过期
    if (Date.now() > shareLink.expires_at.getTime()) {
      return NextResponse.json({ message: "分享链接已过期" }, { status: 410 });
    }
    const scheduleIds = JSON.parse(shareLink.schedule_ids);
    const summary = JSON.parse(shareLink.summary);

    // 查询还款计划详情
    const schedules = await prisma.repaymentSchedule.findMany({
      where: {
        id: {
          in: scheduleIds,
        },
      },
      include: {
        loan_account: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ period: "asc" }],
    });

    if (schedules.length === 0) {
      return NextResponse.json({ message: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({
      data: schedules,
      summary: summary,
      expires_at: shareLink.expires_at.toISOString(),
    });
  } catch (error: any) {
    console.error("获取分享数据失败:", error);
    return NextResponse.json({ message: "无效的分享链接" }, { status: 400 });
  }
}
