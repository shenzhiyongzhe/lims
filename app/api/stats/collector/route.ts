import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

type Row = { period: string; total: string | number | null };

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const qCollector = searchParams.get("collector")?.trim();

    // RBAC：负责人缺省统计自己；管理员可统计任意 collector（必填）
    let collector: string | null = null;
    if (auth.role === "负责人") {
      collector = auth.username;
    } else if (auth.role === "管理员") {
      if (!qCollector)
        return NextResponse.json(
          { message: "collector 必填" },
          { status: 400 }
        );
      collector = qCollector;
    } else {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 29);

    const startMonth = new Date(today);
    startMonth.setMonth(startMonth.getMonth() - 11);
    startMonth.setDate(1);
    const thisMonthStart = new Date(today);
    thisMonthStart.setDate(1);
    const nextMonthStart = new Date(
      thisMonthStart.getFullYear(),
      thisMonthStart.getMonth() + 1,
      1
    );

    const startYear = new Date(today);
    startYear.setMonth(0, 1);
    startYear.setFullYear(startYear.getFullYear() - 4);
    const thisYearStart = new Date(today.getFullYear(), 0, 1);

    // 基于 repayment_records 连接 loan_accounts(collector)
    // 日
    const daily = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE(r.paid_at) AS period, SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
        AND r.paid_at >= ${toISODate(startDay)}
        AND r.paid_at < ${toISODate(
          new Date(today.getTime() + 24 * 60 * 60 * 1000)
        )}
      GROUP BY DATE(r.paid_at)
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    // 月
    const monthly = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE_FORMAT(r.paid_at, '%Y-%m') AS period, SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
        AND r.paid_at >= ${toISODate(startMonth)}
        AND r.paid_at < ${toISODate(
          new Date(today.getFullYear(), today.getMonth() + 1, 1)
        )}
      GROUP BY DATE_FORMAT(r.paid_at, '%Y-%m')
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    // 年
    const yearly = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE_FORMAT(r.paid_at, '%Y') AS period, SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
        AND r.paid_at >= ${toISODate(startYear)}
        AND r.paid_at < ${toISODate(new Date(today.getFullYear() + 1, 0, 1))}
      GROUP BY DATE_FORMAT(r.paid_at, '%Y')
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    // 汇总：总收入、当月、当天
    const [totalAllRow] = await prisma.$queryRaw<Row[]>`
      SELECT SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
    `;
    const [monthTotalRow] = await prisma.$queryRaw<Row[]>`
      SELECT SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
        AND r.paid_at >= ${toISODate(thisMonthStart)}
        AND r.paid_at < ${toISODate(nextMonthStart)}
    `;
    const [todayTotalRow] = await prisma.$queryRaw<Row[]>`
      SELECT SUM(COALESCE(r.paid_amount, 0)) AS total
      FROM repayment_records r
      JOIN loan_accounts l ON l.id = r.loan_id
      WHERE l.collector = ${collector}
        AND DATE(r.paid_at) = ${toISODate(today)}
    `;

    // 手续费：以 loan_accounts.handling_fee 汇总
    const [feeTotalRow] = await prisma.$queryRaw<Row[]>`
      SELECT SUM(COALESCE(l.handling_fee, 0)) AS total
      FROM loan_accounts l
      WHERE l.collector = ${collector}
    `;

    return NextResponse.json({
      data: {
        daily,
        monthly,
        yearly,
        total_all: Number(totalAllRow?.total || 0),
        month_total: Number(monthTotalRow?.total || 0),
        today_total: Number(todayTotalRow?.total || 0),
        fee_total: Number(feeTotalRow?.total || 0),
      },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
