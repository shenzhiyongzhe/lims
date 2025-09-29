export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { roleZhToEn } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 20))
  );
  const skip = (page - 1) * pageSize;

  const auth = requireAuth(req);

  if (!auth) return NextResponse.json({ message: "未登录" }, { status: 403 });

  // 先查到符合条件的贷款，再映射到用户并去重
  const loans = await prisma.loanAccount.findMany({
    where: { [roleZhToEn(auth.role)]: auth.username },
    select: {
      user_id: true,
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
          address: true,
          lv: true,
          is_high_risk: true,
          overtime: true,
          overdue_time: true,
        },
      },
    },
    distinct: ["user_id"],
    orderBy: { user_id: "desc" },
    skip,
    take: pageSize,
  });

  // 统计总去重数
  const total = await prisma.loanAccount
    .groupBy({
      by: ["user_id"],
      where: { [roleZhToEn(auth.role)]: auth.username },
      _count: { _all: true },
    })
    .then((g) => g.length);

  return NextResponse.json({
    data: loans.map((loan) => ({
      id: loan.user_id,
      username: loan.user.username,
      phone: loan.user.phone,
      address: loan.user.address,
      lv: loan.user.lv,
      is_high_risk: loan.user.is_high_risk,
      overtime: loan.user.overtime,
      overdue_time: loan.user.overdue_time,
    })),
    pagination: { page, pageSize, total },
  });
}
