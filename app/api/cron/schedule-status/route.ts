import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

// 每天 06:00 批量更新 RepaymentSchedule 的状态：
// - 截止日期距今天(以06:00为界) < 1 天 => overtime
// - 截止日期距今天 >= 1 天 => overdue
export async function POST(req: NextRequest) {
  try {
    // 支持密钥绕过登录
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

    // 以每日 06:00 作为边界
    const now = new Date();
    const today6 = new Date(now);
    today6.setHours(14, 0, 0, 0);
    const yesterday6 = new Date(today6.getTime() - 24 * 60 * 60 * 1000);

    console.log(
      `today6: ${JSON.stringify(today6)}, yesterday6: ${JSON.stringify(
        yesterday6
      )}`
    );
    // 先将超过一天的设置为 overdue（包含原本为 overtime 的也可升级）
    const overdueResult = await prisma.repaymentSchedule.updateMany({
      where: {
        status: { in: ["pending", "active", "overtime"] as any },
        due_end_date: { lte: yesterday6 },
      } as any,
      data: { status: "overdue" as any },
    });

    // 将小于 1 天（昨天06:00 <= due_end_date < 今天06:00）的设置为 overtime
    const overtimeResult = await prisma.repaymentSchedule.updateMany({
      where: {
        status: { in: ["pending", "active"] as any },
        due_end_date: { gt: yesterday6, lte: today6 },
      } as any,
      data: { status: "overtime" as any },
    });

    // 统计每个用户的超时/逾期总数，并写回用户表
    type AggRow = {
      user_id: number;
      overtime_cnt: bigint | number | null;
      overdue_cnt: bigint | number | null;
    };
    const agg: AggRow[] = await prisma.$queryRaw<any>`
      SELECT la.user_id AS user_id,
             SUM(CASE WHEN rs.status = 'overtime' THEN 1 ELSE 0 END) AS overtime_cnt,
             SUM(CASE WHEN rs.status = 'overdue'  THEN 1 ELSE 0 END) AS overdue_cnt
      FROM repayment_schedules rs
      JOIN loan_accounts la ON la.id = rs.loan_id
      GROUP BY la.user_id
    `;

    await prisma.$transaction(async (tx) => {
      for (const r of agg) {
        const overtimeCnt = Number(r.overtime_cnt || 0);
        const overdueCnt = Number(r.overdue_cnt || 0);
        const shouldFlagRisk = overdueCnt >= 3 || overtimeCnt >= 10;
        await tx.user.update({
          where: { id: r.user_id },
          data: {
            overtime: overtimeCnt,
            overdue_time: overdueCnt,
            ...(shouldFlagRisk ? { is_high_risk: true } : {}),
          } as any,
        });
      }
    });

    return NextResponse.json({
      data: {
        set_overdue: overdueResult.count,
        set_overtime: overtimeResult.count,
        users_updated: agg.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
