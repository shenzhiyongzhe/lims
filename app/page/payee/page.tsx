"use client";

import { useState, useEffect } from "react";
import OrderNotification from "@/app/_components/OrderNotification";
import { get, put } from "@/lib/http";
import { useWebSocket } from "@/app/_hooks/useWebSocket";

export default function PayeeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [wsDebugInfo, setWsDebugInfo] = useState<{
    connectionStatus: string;
    connectedAt: string;
    disconnectedAt: string;
    error: string;
    errorAt: string;
    messageCount: number;
    lastMessageTime: string;
    currentTime: string;
    isConnected: boolean;
    connectionError: string | null;
    lastMessage: any;
  }>({} as any);

  // 添加WebSocket连接用于调试
  const { isConnected, connectionError, lastMessage } = useWebSocket({
    connections: [
      {
        id: "payee-debug",
        type: "events" as const,
        url: "/events",
        queryParams: (() => {
          try {
            const adminData = localStorage.getItem("admin");
            if (adminData) {
              const admin = JSON.parse(adminData);
              if (admin.id) {
                console.log("🔍 收款人WebSocket连接参数:", {
                  type: "payee",
                  admin_id: admin.id.toString(),
                });
                return {
                  type: "payee",
                  admin_id: admin.id.toString(),
                } as Record<string, string>;
              }
            }
          } catch (error) {
            console.error("❌ 解析管理员数据失败:", error);
          }
          console.log("⚠️ 使用默认收款人连接参数");
          return { type: "payee" } as Record<string, string>;
        })(),
      },
    ],
    onOrderMessage: (message) => {
      console.log("📨 收款人页面收到WebSocket消息:", message);
      setWsDebugInfo((prev) => ({
        ...prev,
        lastMessage: message,
        messageCount: (prev.messageCount || 0) + 1,
        lastMessageTime: new Date().toLocaleString(),
      }));
    },
    onOpen: (type) => {
      console.log("✅ 收款人WebSocket连接成功:", type);
      setWsDebugInfo((prev) => ({
        ...prev,
        connectionStatus: "connected",
        connectedAt: new Date().toLocaleString(),
      }));
    },
    onClose: (type) => {
      console.log("❌ 收款人WebSocket连接断开:", type);
      setWsDebugInfo((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        disconnectedAt: new Date().toLocaleString(),
      }));
    },
    onError: (error: any, type) => {
      console.error("❌ 收款人WebSocket连接错误:", error, type);
      setWsDebugInfo((prev) => ({
        ...prev,
        connectionStatus: "error",
        error: error.message || "连接错误",
        errorAt: new Date().toLocaleString(),
      }));
    },
    autoConnect: true,
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🔍 获取订单列表...");
      const res = await get("/orders?today=true");
      console.log("📋 订单API响应:", res);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ 获取订单失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 获取管理员信息
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        console.log("👤 当前管理员信息:", admin);
        setCurrentAdmin(admin);

        // 检查管理员是否绑定收款人
        if (!admin.id) {
          console.error("❌ 管理员ID不存在");
        }
      } catch (error) {
        console.error("❌ 解析管理员数据失败:", error);
      }
    } else {
      console.error("❌ 未找到管理员数据");
    }

    fetchOrders();
  }, []);

  // 定期更新调试信息
  useEffect(() => {
    const interval = setInterval(() => {
      setWsDebugInfo((prev) => ({
        ...prev,
        currentTime: new Date().toLocaleString(),
        isConnected: isConnected["payee-debug"] || false,
        connectionError: connectionError["payee-debug"] || null,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, connectionError]);

  const handleOrderGrabbed = (orderId: string) => {
    console.log("🎯 订单被抢单:", orderId);
    // 抢单成功的本地处理（如需要可刷新）
    fetchOrders();
  };

  const handleComplete = async (id: string) => {
    try {
      console.log("✅ 完成订单:", id);
      const res = await put("/orders", {
        id,
        status: "completed",
      });
      if (res.code == 200) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "completed" } : o))
        );
        console.log("✅ 订单状态更新成功");
      }
    } catch (error) {
      console.error("❌ 完成订单失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">收款人订单管理</h1>
            <button
              onClick={fetchOrders}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "刷新中..." : "刷新"}
            </button>
          </div>

          {/* 添加WebSocket调试信息面板 */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              WebSocket连接调试信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-600">连接状态:</div>
                <div
                  className={`font-bold ${
                    wsDebugInfo.isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {wsDebugInfo.isConnected ? "✅ 已连接" : "❌ 未连接"}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">管理员ID:</div>
                <div className="font-mono">{currentAdmin?.id || "未获取"}</div>
              </div>
              <div>
                <div className="font-medium text-gray-600">连接时间:</div>
                <div className="font-mono text-xs">
                  {wsDebugInfo.connectedAt || "未连接"}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">消息数量:</div>
                <div className="font-mono">{wsDebugInfo.messageCount || 0}</div>
              </div>
              <div>
                <div className="font-medium text-gray-600">最后消息时间:</div>
                <div className="font-mono text-xs">
                  {wsDebugInfo.lastMessageTime || "无"}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">当前时间:</div>
                <div className="font-mono text-xs">
                  {wsDebugInfo.currentTime}
                </div>
              </div>
            </div>
            {wsDebugInfo.connectionError && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-800 text-xs">
                <div className="font-medium">连接错误:</div>
                <div className="font-mono">{wsDebugInfo.connectionError}</div>
              </div>
            )}
            {wsDebugInfo.lastMessage && (
              <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded text-blue-800 text-xs">
                <div className="font-medium">最后消息:</div>
                <pre className="font-mono text-xs overflow-auto max-h-32">
                  {JSON.stringify(wsDebugInfo.lastMessage, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                今日订单
              </h2>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无订单</div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">订单号</div>
                          <div className="font-mono text-gray-900">
                            {order.id}
                          </div>
                        </div>
                        <span
                          className={
                            "text-xs px-2 py-1 rounded " +
                            (order.status === "grabbed"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600")
                          }
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">客户：</span>
                          <span className="text-gray-900">
                            {order.customer?.username}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">金额：</span>
                          <span className="text-gray-900">{order.amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">方式：</span>
                          <span className="text-gray-900">
                            {order.payment_method}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">备注：</span>
                          <span className="text-gray-900">
                            {order.remark || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">创建时间：</span>
                          <span className="text-gray-900">
                            {new Date(order.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {order.status === "grabbed" && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleComplete(order.id)}
                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            完成
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                实时通知
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  当有新订单时，系统会自动在屏幕右上角显示通知弹窗
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 订单通知组件 */}
      <OrderNotification onOrderGrabbed={handleOrderGrabbed} />
    </div>
  );
}
