import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";
import { prisma } from "@/prisma/prisma";

// WebSocket连接管理
const connections = new Map<string, any>();
const payeeConnections = new Map<number, any>(); // payee_id -> connection

// 订单状态管理
const pendingOrders = new Map<string, any>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "customer" or "payee"
  // 从cookie获取ID（优先级更高）
  const cookies = req.cookies;
  const payeeId = cookies.get("payee_id")?.value;
  const cookieUserId = cookies.get("user_id")?.value;
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }
  console.log(
    `type: ${type} payeeId: ${payeeId} cookieUserId: ${cookieUserId}`
  );
  if (type === "payee" && !payeeId) {
    return new Response("Missing payee_id", { status: 400 });
  }
  // 验证参数
  if (type === "customer" && !cookieUserId) {
    return new Response("Missing user_id", { status: 400 });
  }
  // 这里需要处理WebSocket升级
  // 由于Next.js的限制，我们需要使用不同的方法
  return new Response("WebSocket endpoint", { status: 200 });
}

// 订单优先级算法
async function calculatePayeePriority(orderData: any) {
  const { user_id, amount, payment_method } = orderData;

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

  // 获取客户信息
  const customer = await prisma.user.findUnique({
    where: { id: user_id },
  });

  if (!customer) return [];

  const payeePriorities = [];

  for (const payee of payees) {
    if (payee.qrcode.length === 0) continue; // 没有对应支付方式的二维码

    let priority = 0;
    let delay = 0;

    // 1. 检查历史记录优先级（20秒延迟）
    const historyCount = await prisma.repaymentRecord.count({
      where: {
        payee_id: payee.id,
        user_id: user_id,
      },
    });

    if (historyCount > 0) {
      priority += 1000; // 高优先级
      delay = 0; // 立即通知
    }

    // 2. 检查地址匹配优先级（10秒延迟）
    if (customer.address === payee.address) {
      priority += 500; // 中等优先级
      if (delay === 0) delay = 10000; // 10秒延迟
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
      continue; // 额度不足，跳过
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

  // 按优先级排序
  return payeePriorities.sort((a, b) => b.priority - a.priority);
}

// 广播订单给收款人
async function broadcastOrder(orderData: any) {
  const priorities = await calculatePayeePriority(orderData);

  for (const { payee, delay } of priorities) {
    setTimeout(() => {
      const connection = payeeConnections.get(payee.id);
      if (connection && connection.readyState === 1) {
        connection.send(
          JSON.stringify({
            type: "new_order",
            data: {
              orderId: orderData.orderId,
              customer: orderData.customer,
              amount: orderData.amount,
              payment_method: orderData.payment_method,
              remark: orderData.remark,
              timestamp: new Date().toISOString(),
            },
          })
        );
      }
    }, delay);
  }
}

// 处理抢单请求
async function handleGrabOrder(payeeId: number, orderId: string) {
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
  const customerConnection = connections.get(order.customerId);
  if (customerConnection && customerConnection.readyState === 1) {
    customerConnection.send(
      JSON.stringify({
        type: "order_grabbed",
        data: {
          orderId,
          payeeId,
          payeeName: payee.username,
        },
      })
    );
  }

  return {
    success: true,
    message: "抢单成功",
    payeeId,
    payeeName: payee.username,
  };
}

export { broadcastOrder, handleGrabOrder };
