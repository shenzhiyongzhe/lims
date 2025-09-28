// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
      | "pending"
      | "grabbed"
      | "completed"
      | "expired"
      | "cancelled"
      | null;
    const today = (searchParams.get("today") ?? "true") === "true";

    const where: any = {};
    if (status) where.status = status;

    if (today) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.created_at = { gte: start, lt: end };
    }

    // 角色范围：管理员看全部；收款人仅看自己的订单
    if (auth.role === "收款人") {
      const payeeIdCookie = req.cookies.get("payee_id")?.value;
      if (!payeeIdCookie) {
        return NextResponse.json({ message: "缺少收款人ID" }, { status: 400 });
      }
      where.payee_id = Number(payeeIdCookie);
    }

    const rows = await prisma.order.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "管理员") {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    const body = await req.json();
    const {
      id, // 可选；不传则用默认 cuid
      customer_id: customer_id,
      loan_id,
      amount,
      payment_periods,
      payment_method, // "wechat_pay" | "ali_pay"
      remark,
      payee_id, // 可选
      expires_at, // 可选
    } = body || {};

    if (
      !customer_id ||
      !loan_id ||
      !amount ||
      !payment_periods ||
      !payment_method
    ) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const created = await prisma.order.create({
      data: {
        ...(id ? { id: id } : {}),
        customer_id: Number(customer_id),
        loan_id: Number(loan_id),
        amount: amount as any,
        payment_periods: Number(payment_periods),
        payment_method,
        remark: remark ?? null,
        ...(payee_id ? { payee_id: Number(payee_id) } : {}),
        expires_at: expires_at
          ? new Date(expires_at)
          : new Date(Date.now() + 60 * 1000),
      } as any,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      return NextResponse.json({ message: "订单不存在" }, { status: 404 });
    }

    // 权限校验：管理员任意；收款人只能改自己订单
    if (auth.role === "收款人") {
      const payeeIdCookie = req.cookies.get("payee_id")?.value;
      if (!payeeIdCookie || Number(payeeIdCookie) !== order.payee_id) {
        return NextResponse.json({ message: "无权限" }, { status: 403 });
      }
    }

    // 若设置为 completed，则：更新订单状态 + 创建 RepaymentRecord + 批量标记 RepaymentSchedule 为 paid
    if (status === "completed") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id },
          data: { status: "completed", updated_at: new Date() },
        });

        if (!updated.payee_id) {
          throw new Error("订单未关联收款人");
        }

        const paidAt = new Date();
        const paidAtStr = paidAt.toISOString();

        // 1) 记一条回款记录（注意：RepaymentRecord没有 order_id 字段）
        await tx.repaymentRecord.create({
          data: {
            loan_id: updated.loan_id,
            user_id: updated.customer_id,
            paid_amount: updated.amount as any,
            paid_at: paidAtStr,
            payment_method: updated.payment_method,
            payee_id: updated.payee_id,
            remark: updated.remark ?? null,
          } as any,
        });

        // 2) 读取 ShareLink（使用同一事务客户端）
        const shareLink = await tx.shareLink.findUnique({
          where: { share_id: updated.share_id },
          select: { schedule_ids: true },
        });

        if (shareLink?.schedule_ids) {
          const ids = JSON.parse(shareLink.schedule_ids as any) as number[];
          if (Array.isArray(ids) && ids.length) {
            const schedules = await tx.repaymentSchedule.findMany({
              where: {
                id: { in: ids },
                status: { in: ["pending", "active", "overdue", "overtime"] },
              },
              orderBy: { period: "asc" },
            });

            const portion =
              schedules.length > 0
                ? Number(
                    (Number(updated.amount as any) / schedules.length).toFixed(
                      2
                    )
                  )
                : 0;

            // 3) 批量更新，等待所有更新完成
            await Promise.all(
              schedules.map((s) =>
                tx.repaymentSchedule.update({
                  where: { id: s.id },
                  data: {
                    status: "paid",
                    paid_amount: (portion ||
                      Number(updated.amount as any)) as any,
                    paid_at: paidAtStr,
                  },
                })
              )
            );
          }
        }

        return updated;
      });

      return NextResponse.json({ data: result });
    }

    // 其他状态：仅修改状态
    const simpleUpdated = await prisma.order.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });

    return NextResponse.json({ data: simpleUpdated });
  } catch (e: any) {
    console.log(`e:${e.message},stack:${e.stack}`);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
