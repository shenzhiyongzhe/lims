export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";

function generateShortId(): string {
  return crypto.randomBytes(4).toString("hex"); // 8位十六进制字符串
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const loanId = Number(searchParams.get("loan_id") || 0);

  if (!loanId)
    return NextResponse.json({ message: "缺少 loan_id" }, { status: 400 });

  const rows = await prisma.repaymentSchedule.findMany({
    where: { loan_id: loanId },
    orderBy: [{ period: "asc" }],
    select: {
      schedule_id: true,
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
    },
  });

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authUser = requireAuth(req);
    // 检查是否有ids参数（批量查询）
    if (body.ids && Array.isArray(body.ids)) {
      const ids = body.ids;

      if (ids.length === 0) {
        return NextResponse.json(
          { message: "ids数组不能为空" },
          { status: 400 }
        );
      }
      console.log(ids);
      // 查询所有指定的还款计划
      const schedules = await prisma.repaymentSchedule.findMany({
        where: {
          schedule_id: {
            in: ids,
          },
          status: { in: ["pending", "active", "overtime", "overdue"] },
        },
        orderBy: [{ period: "asc" }],
        select: {
          schedule_id: true,
          loan_id: true,
          period: true,
          due_amount: true,
          capital: true,
          interest: true,
          due_end_date: true,
          status: true,
        },
      });

      if (schedules.length === 0) {
        return NextResponse.json(
          { message: "未找到指定的还款计划" },
          { status: 404 }
        );
      }
      const loan_account = await prisma.loanAccount.findUnique({
        where: { loan_id: schedules[0].loan_id },
        include: {
          user: true,
        },
      });
      if (!loan_account) {
        return NextResponse.json(
          { message: "未找到指定的还款计划" },
          { status: 404 }
        );
      }

      // 计算总计
      const today = new Date();
      today.setHours(6, 0, 0, 0); // 设置为今天的开始时间

      let totalDueAmount = 0;
      let totalCapital = 0;
      let totalInterest = 0;

      schedules.forEach((schedule) => {
        const dueEndDate = new Date(schedule.due_end_date);
        dueEndDate.setHours(6, 0, 0, 0); // 设置为截止日期的开始时间

        // 累加due_amount和capital
        totalDueAmount += parseFloat(schedule.due_amount.toString());
        totalCapital += parseFloat((schedule.capital || 0).toString());

        // 如果截止日期在今天之后，则不计算interest
        if (schedule.due_end_date <= today) {
          totalInterest += parseFloat((schedule.interest || 0).toString());
        }
      });

      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3小时后过期
      const shareId = generateShortId();
      const payee = await prisma.payee.findFirst({
        where: {
          username: loan_account.payee,
        },
      });
      if (!payee) {
        return NextResponse.json(
          { message: "未找到指定的收款人" },
          { status: 404 }
        );
      }
      // 准备存储的数据
      const summary = {
        user: loan_account.user,
        loan_id: loan_account.loan_id,
        total_periods: loan_account.total_periods,
        repaid_periods: loan_account.repaid_periods,
        total_due_amount: totalDueAmount.toFixed(2),
        total_capital: totalCapital.toFixed(2),
        total_interest: totalInterest.toFixed(2),
        payable_amount: (totalCapital + totalInterest).toFixed(2),
        count: schedules.length,
        today: today.toISOString().split("T")[0],
        due_end_date: schedules[0].due_end_date,
        payee: payee.username,
        payee_id: payee.payee_id,
      };

      // 存储到数据库
      await prisma.shareLink.create({
        data: {
          share_id: shareId,
          schedule_ids: JSON.stringify(ids),
          summary: JSON.stringify(summary),
          expires_at: expiresAt,
          created_by: authUser.id,
        },
      });

      // 生成分享链接
      const shareUrl = `${BASE_URL}/customer/shared/${shareId}`;

      return NextResponse.json({
        data: {
          shareUrl,
          expiresAt,
          shareId,
        },
      });
    }
  } catch (error: any) {
    console.error("API错误:", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
