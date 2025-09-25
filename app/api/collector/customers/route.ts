export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/prisma/prisma";
import { VALID_STATUSES } from "@/lib/constants";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    // 验证用户认证
    const authUser = requireAuth(req);
    const collector = authUser.username;
    const raw = searchParams.get("status");
    const status =
      raw && VALID_STATUSES.includes(raw as any) ? (raw as any) : undefined;

    if (!status) {
      // 先查 LoanAccount 数据
      const loanAccounts = await prisma.loanAccount.findMany({
        where: { collector },
        orderBy: { id: "desc" },
      });
      // 获取所有唯一的 username
      const usernames = [...new Set(loanAccounts.map((loan) => loan.user_id))];
      // 根据 username 查询 User 数据
      const users = await prisma.user.findMany({
        where: {
          id: { in: usernames },
        },
        select: {
          id: true,
          username: true,
          phone: true,
          address: true,
          lv: true,
        },
      });
      // 按用户分组，构建嵌套结构
      const result = users.map((user) => {
        const userLoans = loanAccounts.filter(
          (loan) => loan.user_id === user.id
        );
        return {
          id: user.id,
          username: user.username,
          phone: user.phone,
          address: user.address,
          lv: user.lv,
          loanAccount: userLoans,
        };
      });

      return NextResponse.json({
        data: result,
      });
    } else if (["overtime", "overdue", "paid"].includes(status)) {
      const loanAccounts = await prisma.loanAccount.findMany({
        where: { collector },
        orderBy: { id: "desc" },
      });

      const loan_ids = loanAccounts.map((la) => la.id);
      const rows = await prisma.repaymentSchedule.findMany({
        where: { loan_id: { in: loan_ids }, status },
        orderBy: [{ period: "asc" }],
        select: {
          id: true,
          loan_id: true,
          period: true,
          due_start_date: true,
          due_end_date: true,
          due_amount: true,
          capital: true,
          interest: true,
          status: true,
          paid_amount: true,
          paid_at: true,
          loan_account: { select: { user_id: true } },
        },
      });
      return NextResponse.json({
        data: rows,
      });
    } else {
      return NextResponse.json(
        {
          data: [],
        },
        { status: 403 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
