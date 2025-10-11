"use client";

import { useState, useEffect } from "react";
import { useSSE } from "@/app/_hooks/useSSE";
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
    message: string;
  } | null>(null);

  // SSE连接 - 自动连接，因为收款人需要实时接收订单
  const { isConnected } = useSSE({
    url: `/events?type=payee`,
    autoConnect: true, // 收款人需要自动连接
    onMessage: (message) => {
      if (message.type === "new_order") {
        setCurrentOrder(message.data);
        setGrabResult(null);
        console.log("new_order", message.data);
      } else if (message.type === "connected") {
        console.log("SSE connected:", message.data);
      }
    },
  });

  const handleGrabOrder = async () => {
    if (!currentOrder) return;

    setIsGrabbing(true);

    try {
      // 从localStorage获取admin信息
      const adminData = localStorage.getItem("admin");
      if (!adminData) {
        setGrabResult({ success: false, message: "未找到管理员信息" });
        return;
      }

      const admin = JSON.parse(adminData);
      if (!admin.id) {
        setGrabResult({ success: false, message: "管理员信息无效" });
        return;
      }

      const result = await post("/events", {
        type: "grab_order",
        data: {
          id: currentOrder.id,
          admin_id: admin.id,
        },
      });

      setGrabResult(result.data);

      if (result.success) {
        setCurrentOrder(null);
        onOrderGrabbed(result.id);
      }
    } catch (error) {
      setGrabResult({ success: false, message: "抢单失败" });
    } finally {
      setIsGrabbing(false);
    }
  };

  const handleClose = () => {
    setCurrentOrder(null);
    setGrabResult(null);
  };

  if (!currentOrder) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
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
        </div>
      </div>
    </div>
  );
}
