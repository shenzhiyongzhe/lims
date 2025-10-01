import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

// 逾期客户统计与列表（按 collector）
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const qCollector = searchParams.get("collector")?.trim();

    let collector: string | null = null;
    if (auth.role === "负责人") collector = auth.username;
    else if (auth.role === "管理员") {
      if (!qCollector)
        return NextResponse.json(
          { message: "collector 必填" },
          { status: 400 }
        );
      collector = qCollector;
    } else return NextResponse.json({ message: "无权限" }, { status: 403 });

    const today = new Date();
    today.setHours(14, 0, 0, 0); // 以每日 6 点为边界
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1, 14);
    const nextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1,
      14
    );
    const startYear = new Date(today.getFullYear(), 0, 1, 14);
    const nextYear = new Date(today.getFullYear() + 1, 0, 1, 14);

    const [rows, todayCount, monthCount, yearCount] = await Promise.all([
      prisma.overdueRecord.findMany({
        where: {
          collector: collector as string,
          overdue_date: { gte: today, lt: tomorrow },
        },
        orderBy: { overdue_date: "desc" },
        take: 200,
      }),
      prisma.overdueRecord.count({
        where: {
          collector: collector as string,
          overdue_date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.overdueRecord.count({
        where: {
          collector: collector as string,
          overdue_date: { gte: startMonth, lt: nextMonth },
        },
      }),
      prisma.overdueRecord.count({
        where: {
          collector: collector as string,
          overdue_date: { gte: startYear, lt: nextYear },
        },
      }),
    ]);

    // 取客户详情
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, phone: true, address: true },
    });

    return NextResponse.json({
      data: {
        list: users,
        today_overdue: todayCount,
        month_overdue: monthCount,
        year_overdue: yearCount,
      },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
