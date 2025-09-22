export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 20))
  );
  const skip = (page - 1) * pageSize;

  const collector = (
    searchParams.get("collector") ||
    req.headers.get("x-collector") ||
    ""
  ).trim();
  if (!collector)
    return NextResponse.json({ message: "缺少 collector" }, { status: 400 });

  // 先查到符合条件的贷款，再映射到用户并去重
  const loans = await prisma.loanAccount.findMany({
    where: { collector, status: "paid" },
    select: { user_id: true, username: true },
    distinct: ["user_id"],
    orderBy: { user_id: "desc" },
    skip,
    take: pageSize,
  });

  // 统计总去重数
  const total = await prisma.loanAccount
    .groupBy({
      by: ["user_id"],
      where: { collector, status: "paid" },
      _count: { _all: true },
    })
    .then((g) => g.length);

  return NextResponse.json({
    data: loans,
    pagination: { page, pageSize, total },
  });
}
