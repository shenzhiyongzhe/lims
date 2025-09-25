"use client";

import { useState, useEffect } from "react";
import OrderNotification from "@/app/_components/OrderNotification";

export default function PayeeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  const handleOrderGrabbed = (orderId: string) => {
    // 处理抢单成功的逻辑
    console.log(`Order ${orderId} grabbed successfully`);
    // 可以在这里添加订单到列表等操作
  };

  // if (!payeeId) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">加载中...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            收款人订单管理
          </h1>

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
                      {/* 订单内容 */}
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
