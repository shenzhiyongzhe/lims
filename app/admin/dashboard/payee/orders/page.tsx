"use client";

import { useState, useEffect } from "react";
import OrderNotification from "@/app/_components/OrderNotification";

export default function PayeeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?today=true", { method: "GET" });
      const json = await res.json();
      setOrders(Array.isArray(json?.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderGrabbed = (orderId: string) => {
    // 抢单成功的本地处理（如需要可刷新）
    fetchOrders();
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      const json = await res.json();
      if (json.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "completed" } : o))
        );
      }
    } catch {}
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
