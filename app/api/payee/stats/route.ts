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
    const qPayeeId = searchParams.get("payee_id");

    // RBAC: 收款人仅统计自己；管理员可传 payee_id（必填）
    let payeeId: number | null = null;
    if (auth.role === "收款人") {
      const pid = req.cookies.get("payee_id")?.value;
      if (!pid)
        return NextResponse.json({ message: "缺少收款人ID" }, { status: 400 });
      payeeId = Number(pid);
    } else {
      if (!qPayeeId)
        return NextResponse.json({ message: "payee_id 必填" }, { status: 400 });
      payeeId = Number(qPayeeId);
    }

    // 时间范围：按天默认近 30 天；按月默认近 12 个月；按年默认近 5 年
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 29);

    const startMonth = new Date(today);
    startMonth.setMonth(startMonth.getMonth() - 11);
    startMonth.setDate(1);

    const startYear = new Date(today);
    startYear.setMonth(0, 1);
    startYear.setFullYear(startYear.getFullYear() - 4);

    // 日统计（近 30 天）
    const daily = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE(paid_at) AS period, SUM(COALESCE(paid_amount, 0)) AS total
      FROM repayment_records
      WHERE payee_id = ${payeeId}
        AND paid_at >= ${toISODate(startDay)}
        AND paid_at < ${toISODate(
          new Date(today.getTime() + 24 * 60 * 60 * 1000)
        )}
      GROUP BY DATE(paid_at)
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    // 月统计（近 12 个月）
    const monthly = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE_FORMAT(paid_at, '%Y-%m') AS period, SUM(COALESCE(paid_amount, 0)) AS total
      FROM repayment_records
      WHERE payee_id = ${payeeId}
        AND paid_at >= ${toISODate(startMonth)}
        AND paid_at < ${toISODate(
          new Date(today.getFullYear(), today.getMonth() + 1, 1)
        )}
      GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    // 年统计（近 5 年）
    const yearly = (
      await prisma.$queryRaw<Row[]>`
      SELECT DATE_FORMAT(paid_at, '%Y') AS period, SUM(COALESCE(paid_amount, 0)) AS total
      FROM repayment_records
      WHERE payee_id = ${payeeId}
        AND paid_at >= ${toISODate(startYear)}
        AND paid_at < ${toISODate(new Date(today.getFullYear() + 1, 0, 1))}
      GROUP BY DATE_FORMAT(paid_at, '%Y')
      ORDER BY period ASC
    `
    ).map((r) => ({ period: r.period, total: Number(r.total || 0) }));

    return NextResponse.json({ data: { daily, monthly, yearly } });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
