"use client";

import { useState, useEffect } from "react";
import { useWebSocket, WebSocketMessage } from "@/app/_hooks/useWebSocket";
import { post } from "@/lib/http";

interface OrderData {
  id: string;
  customer_id: number;
  customer: {
    username: string;
    phone: string;
    address: string;
  };
  amount: number;
  payment_method: string;
  remark?: string;
  timestamp: string;
}

interface OrderNotificationProps {
  onOrderGrabbed: (orderId: string) => void;
}

export default function OrderNotification({
  onOrderGrabbed,
}: OrderNotificationProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabResult, setGrabResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
    try {
      const admin = localStorage.getItem("admin");
      if (admin) {
        const parsedAdmin = JSON.parse(admin);
        console.log("👤 OrderNotification - 管理员信息:", parsedAdmin);
        setAdminData(parsedAdmin);
      } else {
        console.warn("⚠️ OrderNotification - 未找到管理员数据");
      }
    } catch (error) {
      console.error("❌ OrderNotification - 解析管理员数据失败:", error);
    }
  }, []);

  // WebSocket连接 - 只有在客户端且有管理员数据时才连接
  const { isConnected, connectionError } = useWebSocket({
    connections:
      isClient && adminData?.id
        ? [
            {
              id: "payee-orders",
              type: "events" as const,
              url: "/events",
              queryParams: {
                type: "payee",
                admin_id: adminData.id.toString(),
              },
            },
          ]
        : [],
    onOrderMessage: (message) => {
      console.log("📨 OrderNotification - 收到WebSocket消息:", message);
      if (message.type === "new_order") {
        setCurrentOrder(message.data);
        setGrabResult(null);
        console.log("📋 新订单通知:", message.data);
      } else if (message.type === "connected") {
        console.log("✅ OrderNotification - WebSocket连接成功:", message.data);
      }
    },
    autoConnect: true,
  });

  const handleGrabOrder = async () => {
    if (!currentOrder || !adminData?.id) {
      setGrabResult({ success: false, message: "缺少必要信息" });
      return;
    }

    setIsGrabbing(true);
    console.log("🎯 开始抢单:", currentOrder.id, "管理员ID:", adminData.id);

    try {
      // 使用POST请求抢单（与后端WebSocket网关配合使用）
      const result = await post("/events", {
        type: "grab_order",
        data: {
          id: currentOrder.id,
          admin_id: adminData.id,
        },
      });

      console.log("📊 抢单结果:", result);
      setGrabResult(result.data);

      if (result.code == 200) {
        setCurrentOrder(null);
        onOrderGrabbed(result.data.id);
      }
    } catch (error) {
      console.error("❌ 抢单失败:", error);
      setGrabResult({ success: false, message: "抢单失败" });
    } finally {
      setIsGrabbing(false);
    }
  };

  const handleClose = () => {
    setCurrentOrder(null);
    setGrabResult(null);
  };

  // 如果不在客户端或没有管理员数据，不显示组件
  if (!isClient || !adminData?.id) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <h3 className="text-sm font-semibold text-yellow-800">
              {!isClient ? "加载中..." : "等待管理员登录..."}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (!currentOrder) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <h3 className="text-lg font-semibold text-gray-800">新订单通知</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">客户:</span>
            <span className="font-medium">
              {currentOrder.customer.username}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">电话:</span>
            <span className="font-medium">{currentOrder.customer.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">地址:</span>
            <span className="font-medium text-sm">
              {currentOrder.customer.address}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">金额:</span>
            <span className="font-bold text-lg text-blue-600">
              ¥{Number(currentOrder.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">支付方式:</span>
            <span className="font-medium">
              {currentOrder.payment_method === "wechat_pay"
                ? "微信支付"
                : "支付宝"}
            </span>
          </div>
          {currentOrder.remark && (
            <div className="flex justify-between">
              <span className="text-gray-600">备注:</span>
              <span className="font-medium text-sm">{currentOrder.remark}</span>
            </div>
          )}
        </div>

        {grabResult && (
          <div
            className={`p-3 rounded-md mb-3 ${
              grabResult.success
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {grabResult.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleGrabOrder}
            disabled={isGrabbing}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGrabbing ? "抢单中..." : "确定抢单"}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            忽略
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          连接状态: {isConnected ? "已连接" : "连接中..."}
          {Object.values(connectionError).some((error) => error) && (
            <div className="text-red-500 text-xs mt-1">
              {Object.values(connectionError).filter((error) => error)[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
