import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import {
  formatDateForAPI,
  getCurrentBeijingDateObject,
  toBeijingDateTime,
} from "@/lib/tool";
import { buildLoanWhere } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const collector = searchParams.get("collector")?.trim() || "";

    const baseWhere = collector ? { collector } : {};
    const where = buildLoanWhere(authUser, baseWhere);

    const users = await prisma.loanAccount.findMany({
      where,
      orderBy: { id: "desc" },
    });

    return NextResponse.json({
      data: users,
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      due_start_date,
      total_periods,
      collector,
      payee,
      daily_repayment,
      capital,
      interest,
    } = body || {};

    if (!due_start_date || !total_periods || !collector || !payee) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }
    const authUser = requireAuth(req);
    body.created_by = authUser.id;

    const startDate = new Date(body.due_start_date);
    const endDate = new Date(body.due_end_date);
    startDate.setHours(14, 0, 0, 0);
    endDate.setHours(14, 0, 0, 0);
    body.due_start_date = startDate;
    body.due_end_date = endDate;
    // 使用事务：创建贷款记录并批量创建还款计划
    const loan = await prisma.$transaction(async (tx) => {
      const created = await tx.loanAccount.create({
        data: { ...body, created_at: getCurrentBeijingDateObject() },
      });

      const periods = Number(total_periods) || 0;
      const perAmount = daily_repayment ?? created.daily_repayment ?? 0;

      const rows = Array.from({ length: periods }).map((_, idx) => {
        const d = new Date(created.due_start_date);
        d.setDate(d.getDate() + idx);
        d.setHours(14, 0, 0, 0);
        const end = new Date(d);
        end.setDate(end.getDate() + 1);
        end.setHours(14, 0, 0, 0);
        return {
          loan_id: created.id,
          period: idx + 1,
          due_start_date: d,
          due_end_date: end,
          due_amount: perAmount,
          capital: capital ?? null,
          interest: interest ?? null,
        } as const;
      });

      if (rows.length > 0) {
        await tx.repaymentSchedule.createMany({ data: rows });
      }

      return created;
    });
    console.log(`loan: ${JSON.stringify(loan)}`);
    return NextResponse.json(
      {
        message: "创建成功",
        data: {
          ...loan,
          due_start_date: formatDateForAPI(loan.due_start_date),
          due_end_date: formatDateForAPI(loan.due_end_date),
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.log(e);
    if (e.code === "P2002") {
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
