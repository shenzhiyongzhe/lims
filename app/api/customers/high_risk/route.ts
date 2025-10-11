import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

// 高风险用户查询
// GET /users/high_risk?collector=张三&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const qCollector = searchParams.get("collector")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    // 负责人默认只能看自己；管理员可通过 collector 查询任意负责人名下
    let collector: string | undefined = undefined;
    if (auth.role === "负责人") {
      collector = auth.username;
    } else if (auth.role === "管理员") {
      collector = qCollector || undefined;
    } else {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const where: any = { is_high_risk: true };
    if (collector) {
      where.loanAccounts = { some: { collector } };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          phone: true,
          address: true,
          overtime: true,
          overdue_time: true,
          is_high_risk: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: { page, pageSize, total },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
