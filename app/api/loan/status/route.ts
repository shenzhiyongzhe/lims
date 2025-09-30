import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { VALID_STATUSES } from "@/lib/constants";
import { buildLoanWhere } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    if (!status || !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: "无效的 status" }, { status: 400 });
    }

    const loanWhere = buildLoanWhere(auth, {} as any);
    const where: any = {
      status: status as any,
      loan_account:
        loanWhere && Object.keys(loanWhere).length ? loanWhere : undefined,
    };

    const [total, rows] = await Promise.all([
      prisma.repaymentSchedule.count({ where }),
      prisma.repaymentSchedule.findMany({
        where,
        orderBy: [{ loan_id: "desc" }, { period: "asc" }],
        skip,
        take: pageSize,
        include: {
          loan_account: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  phone: true,
                  address: true,
                  lv: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, pageSize, total },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
