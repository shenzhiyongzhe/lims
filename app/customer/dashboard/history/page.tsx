"use client";

import { useState } from "react";

type RepaymentRecord = {
  id: string;
  period: number;
  amount: number;
  repayTime: string;
  status: "成功" | "失败" | "处理中";
  method: "微信支付" | "支付宝" | "银行卡";
  transactionId: string;
};

const mockRecords: RepaymentRecord[] = [
  {
    id: "R001",
    period: 1,
    amount: 5000,
    repayTime: "2024-07-15 10:23:15",
    status: "成功",
    method: "微信支付",
    transactionId: "WX20240715102315001",
  },
  {
    id: "R002",
    period: 2,
    amount: 5000,
    repayTime: "2024-08-15 11:05:32",
    status: "成功",
    method: "微信支付",
    transactionId: "WX20240815110532002",
  },
  {
    id: "R003",
    period: 3,
    amount: 5000,
    repayTime: "2024-09-15 14:30:18",
    status: "处理中",
    method: "支付宝",
    transactionId: "ALI20240915143018003",
  },
];

export default function RepaymentHistory() {
  const [records] = useState<RepaymentRecord[]>(mockRecords);
  const [filterStatus, setFilterStatus] = useState<string>("全部");

  const filteredRecords = records.filter(
    (record) => filterStatus === "全部" || record.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "成功":
        return "text-green-600 bg-green-50";
      case "失败":
        return "text-red-600 bg-red-50";
      case "处理中":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "微信支付":
        return "💚";
      case "支付宝":
        return "🔵";
      case "银行卡":
        return "💳";
      default:
        return "💰";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">还款记录</h1>

        {/* 筛选器 */}
        <div className="mb-6">
          <div className="flex gap-2">
            {["全部", "成功", "失败", "处理中"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* 记录列表 */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无还款记录</div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getMethodIcon(record.method)}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        第 {record.period} 期还款
                      </div>
                      <div className="text-sm text-gray-500">
                        交易ID: {record.transactionId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      ￥{record.amount.toLocaleString()}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span className="font-medium">还款时间:</span>{" "}
                    {record.repayTime}
                  </div>
                  <div>
                    <span className="font-medium">支付方式:</span>{" "}
                    {record.method}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">成功还款</div>
            <div className="text-2xl font-bold text-green-900">
              {records.filter((r) => r.status === "成功").length} 笔
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">总还款金额</div>
            <div className="text-2xl font-bold text-blue-900">
              ￥
              {records
                .filter((r) => r.status === "成功")
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600 mb-1">处理中</div>
            <div className="text-2xl font-bold text-yellow-900">
              {records.filter((r) => r.status === "处理中").length} 笔
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
