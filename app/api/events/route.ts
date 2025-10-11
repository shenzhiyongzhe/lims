import { NextRequest } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

// 存储活跃的SSE连接
const sseConnections = new Map<string, ReadableStreamDefaultController>();
const payeeConnections = new Map<number, string>(); // payee_id -> connectionId
const customerConnections = new Map<number, string>(); // user_id -> connectionId

// 订单状态管理
const pendingOrders = new Map<string, any>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "customer" or "payee"
  const userId = searchParams.get("user_id");

  let payeeId: number | null = null;

  if (type === "payee") {
    try {
      // 根据admin.id查询payee
      const auth = requireAuth(req);
      const payee = await prisma.payee.findFirst({
        where: {
          admin_id: auth.id,
        },
      });

      if (!payee) {
        return new Response("收款人不存在", { status: 404 });
      }

      payeeId = payee.id;
    } catch (error) {
      console.error("Error getting payee:", error);
      return new Response("认证失败", { status: 401 });
    }
  }

  if (type === "customer" && !userId) {
    return new Response("Missing user_id", { status: 400 });
  }

  // 创建SSE流
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${type}_${Date.now()}_${Math.random()}`;

      // 存储连接
      sseConnections.set(connectionId, controller);

      if (type === "payee" && payeeId) {
        payeeConnections.set(payeeId, connectionId);
      } else if (type === "customer") {
        customerConnections.set(Number(userId), connectionId);
      }

      // 发送连接成功消息
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "connected",
          connectionId,
          data: { payeeId, userId },
        })}\n\n`
      );

      // 处理连接关闭
      req.signal.addEventListener("abort", () => {
        sseConnections.delete(connectionId);
        if (type === "payee" && payeeId) {
          payeeConnections.delete(payeeId);
        } else if (type === "customer") {
          customerConnections.delete(Number(userId));
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// 处理订单提交
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === "submit_order") {
      // 将订单添加到待处理列表
      pendingOrders.set(data.id, data);

      // 广播订单给收款人
      await broadcastOrder(data);

      // 持久化到数据库（幂等 upsert）
      const customerId = Number(data.customer_id);
      const loanId = Number(data.loan_id);
      const amount = data.amount as any; // Decimal: 传 string/number 均可
      const payment_periods = Number(data.payment_periods ?? 0);
      const payment_method = data.payment_method; // "wechat_pay" | "ali_pay"
      const remark = data.remark ?? null;
      const expiresAt = new Date(Date.now() + 180 * 1000); // 默认 60s 过期，可按需调整

      await prisma.order.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          share_id: data.share_id,
          customer_id: customerId,
          loan_id: loanId,
          amount,
          payment_periods,
          payment_method,
          remark,
          expires_at: expiresAt,
        },
        update: {
          share_id: data.share_id,
          customer_id: customerId,
          loan_id: loanId,
          amount,
          payment_periods,
          payment_method,
          remark,
          expires_at: expiresAt,
          status: "pending",
          payee_id: null,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "订单已提交，等待收款人抢单",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (type === "grab_order") {
      const { id } = data;
      // 从cookie获取payee_id
      const cookies = req.cookies;
      const payeeId = cookies.get("payee_id")?.value;

      if (!payeeId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "缺少收款人ID",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("grab_order request data:", { payeeId, id, data });
      const result = await handleGrabOrder(Number(payeeId), id);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "未知的请求类型",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Events API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "服务器错误",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 订单优先级算法
async function calculatePayeePriority(orderData: any) {
  const { customer, amount, payment_method } = orderData;

  // 获取所有收款人
  const payees = await prisma.payee.findMany({
    include: {
      qrcode: {
        where: {
          qrcode_type: payment_method,
          active: true,
        },
      },
    },
  });

  const payeePriorities = [];

  for (const payee of payees) {
    if (payee.qrcode.length === 0) continue;

    let priority = 0;
    let delay = 0;

    // 1. 检查历史记录优先级（立即通知）
    const historyCount = await prisma.repaymentRecord.count({
      where: {
        payee_id: payee.id,
        user_id: orderData.customer_id,
      },
    });

    if (historyCount > 0) {
      priority += 1000;
      delay = 0;
    }

    // 2. 检查地址匹配优先级（10秒延迟）
    if (customer.address === payee.address) {
      priority += 500;
      if (delay === 0) delay = 10000;
    }

    // 3. 检查当日额度
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAmount = await prisma.repaymentRecord.aggregate({
      where: {
        payee_id: payee.id,
        paid_at: {
          gte: today.toISOString(),
          lt: tomorrow.toISOString(),
        },
      },
      _sum: {
        paid_amount: true,
      },
    });

    const usedAmount = Number(todayAmount._sum.paid_amount || 0);
    const remainingAmount = payee.payment_limit - usedAmount;

    if (remainingAmount < Number(amount)) {
      continue;
    }

    // 4. 其他收款人（30秒延迟）
    if (delay === 0) delay = 30000;

    payeePriorities.push({
      payee,
      priority,
      delay,
      remainingAmount,
    });
  }

  return payeePriorities.sort((a, b) => b.priority - a.priority);
}

// 广播订单给收款人
async function broadcastOrder(orderData: any) {
  const priorities = await calculatePayeePriority(orderData);
  for (const { payee, delay } of priorities) {
    console.log("broadcastOrder payee:", JSON.stringify(payee));
    console.log("broadcastOrder delay:", delay);
    setTimeout(() => {
      const connectionId = payeeConnections.get(payee.id);
      if (connectionId) {
        const controller = sseConnections.get(connectionId);
        if (controller) {
          const message = {
            type: "new_order",
            data: {
              id: orderData.id,
              loan_id: orderData.loan_id,
              customer_id: orderData.customer_id,
              customer: orderData.customer,
              payment_periods: orderData.payment_periods,
              amount: orderData.amount,
              payment_method: orderData.payment_method,
              remark: orderData.remark,
              timestamp: new Date().toISOString(),
            },
          };
          controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        }
      }
    }, delay);
  }
}

// 处理抢单请求
async function handleGrabOrder(payeeId: number, id: string) {
  console.log("handleGrabOrder called with:", { payeeId, id });

  const order = pendingOrders.get(id);
  if (!order) {
    return { success: false, message: "订单不存在或已过期" };
  }

  // 检查额度
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAmount = await prisma.repaymentRecord.aggregate({
    where: {
      payee_id: payeeId,
      paid_at: {
        gte: today.toISOString(),
        lt: tomorrow.toISOString(),
      },
    },
    _sum: {
      paid_amount: true,
    },
  });

  const payee = await prisma.payee.findUnique({
    where: { id: payeeId },
  });

  if (!payee) {
    return { success: false, message: "收款人不存在" };
  }

  const usedAmount = Number(todayAmount._sum.paid_amount || 0);
  const remainingAmount = payee.payment_limit - usedAmount;

  if (remainingAmount < Number(order.amount)) {
    return { success: false, message: "当日额度不足" };
  }

  // 抢单成功，移除待处理订单
  pendingOrders.delete(id);

  // 同步数据库的订单状态（若不存在则创建一条 grabbed 的记录以保证幂等）
  try {
    const customerId = Number(order.customer_id);
    await prisma.order.upsert({
      where: { id: id },
      update: {
        share_id: order.share_id,
        payee_id: payeeId,
        status: "grabbed",
        updated_at: new Date(),
      },
      create: {
        id: id,
        share_id: order.share_id,
        customer_id: customerId,
        loan_id: Number(order.loan_id),
        amount: order.amount as any,
        payment_periods: Number(order.payment_periods ?? 0),
        payment_method: order.payment_method,
        remark: order.remark ?? null,
        status: "grabbed",
        payee_id: payeeId,
        expires_at: new Date(Date.now() + 60 * 1000),
      },
    });
  } catch (e) {
    console.error("order upsert on grab failed:", e);
  }

  // 通知客户抢单成功
  const connectionId = customerConnections.get(order.customer_id);
  if (connectionId) {
    const controller = sseConnections.get(connectionId);
    if (controller) {
      const message = {
        type: "order_grabbed",
        data: {
          id: id,
          share_id: order.share_id,
          payeeId,
          payeeName: payee.username,
        },
      };
      controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    }
  }

  return {
    success: true,
    message: "抢单成功",
    payeeId,
    payeeName: payee.username,
  };
}
