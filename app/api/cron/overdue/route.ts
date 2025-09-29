import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

// 每天 06:00 运行：扫描当前逾期的 RepaymentSchedule，写入 overdue_records（按 schedule_id 唯一去重）
export async function POST(req: NextRequest) {
  try {
    // 支持使用密钥绕过登录（用于计划任务）
    const url = new URL(req.url);
    const headerKey = req.headers.get("x-cron-key");
    const queryKey = url.searchParams.get("key");
    const secret = process.env.CRON_SECRET;

    if (!(secret && (headerKey === secret || queryKey === secret))) {
      const auth = requireAuth(req);
      if (auth.role !== "管理员") {
        return NextResponse.json({ message: "无权限" }, { status: 403 });
      }
    }

    // 以每日 06:00 作为记录日期边界
    const now = new Date();
    const overdueDate = new Date(now);
    overdueDate.setHours(14, 0, 0, 0);

    // 查找逾期的还款计划
    const schedules = await prisma.repaymentSchedule.findMany({
      where: { status: { in: ["overdue", "overtime"] as any } },
      select: {
        id: true,
        loan_id: true,
        loan_account: { select: { user_id: true, collector: true } },
      },
      orderBy: { id: "asc" },
    });

    if (schedules.length === 0) {
      return NextResponse.json({
        message: "无逾期记录",
        data: { inserted: 0 },
      });
    }

    const rows = schedules.map((s) => ({
      schedule_id: s.id,
      loan_id: s.loan_id,
      user_id: s.loan_account.user_id,
      collector: s.loan_account.collector,
      overdue_date: overdueDate,
    }));

    const result = await prisma.overdueRecord.createMany({
      data: rows,
      skipDuplicates: true, // 依赖 schedule_id 唯一约束
    });

    return NextResponse.json({
      message: "OK",
      data: { inserted: result.count },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
