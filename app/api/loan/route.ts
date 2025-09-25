import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { formatDateForAPI, getCurrentBeijingDateObject } from "@/lib/tool";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collector = searchParams.get("collector")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    const where = collector
      ? {
          // 若仅支持精确匹配可用 equals: phone
          collector: { contains: collector }, // 模糊查询，可能走不到索引
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.loanAccount.count({ where }),
      prisma.loanAccount.findMany({
        where,
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

    const startDateStr = body.due_start_date;
    const startDate = new Date(startDateStr + "T06:00:00+08:00");
    const endDate = new Date(startDateStr + "T06:00:00+08:00");
    endDate.setDate(endDate.getDate() + total_periods);
    body.due_start_date = startDate;
    body.due_end_date = endDate;
    console.log(`startDate: ${startDate}, endDate: ${endDate}`);
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
        d.setHours(6, 0, 0, 0);
        const end = new Date(d);
        end.setDate(end.getDate() + 1);
        end.setHours(6, 0, 0, 0);
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
