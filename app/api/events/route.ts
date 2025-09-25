import { NextRequest } from "next/server";
import { prisma } from "@/prisma/prisma";

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
  // 从cookie获取ID
  const cookies = req.cookies;
  const payeeId = cookies.get("payee_id")?.value;

  if (type === "payee" && !payeeId) {
    return new Response("Missing payee_id", { status: 400 });
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

      if (type === "payee") {
        payeeConnections.set(Number(payeeId), connectionId);
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
        if (type === "payee") {
          payeeConnections.delete(Number(payeeId));
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
      pendingOrders.set(data.orderId, data);

      // 广播订单给收款人
      await broadcastOrder(data);

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
      const { orderId } = data;
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

      console.log("grab_order request data:", { payeeId, orderId, data });
      const result = await handleGrabOrder(Number(payeeId), orderId);

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
        user_id: orderData.customerId,
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
          gte: today.toISOString().slice(0, 19),
          lt: tomorrow.toISOString().slice(0, 19),
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
    setTimeout(() => {
      const connectionId = payeeConnections.get(payee.id);
      if (connectionId) {
        const controller = sseConnections.get(connectionId);
        if (controller) {
          const message = {
            type: "new_order",
            data: {
              orderId: orderData.orderId,
              customer: orderData.customer,
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
async function handleGrabOrder(payeeId: number, orderId: string) {
  console.log("handleGrabOrder called with:", { payeeId, orderId });

  const order = pendingOrders.get(orderId);
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
        gte: today.toISOString().slice(0, 19),
        lt: tomorrow.toISOString().slice(0, 19),
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
  pendingOrders.delete(orderId);

  // 通知客户抢单成功
  const connectionId = customerConnections.get(order.customerId);
  if (connectionId) {
    const controller = sseConnections.get(connectionId);
    if (controller) {
      const message = {
        type: "order_grabbed",
        data: {
          orderId,
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
