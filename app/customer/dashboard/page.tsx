"use client";

import { useState } from "react";

type Installment = {
  period: number;
  amount: number;
  status: "已还" | "未还" | "逾期" | "未开始";
  repayStartTime: string;
  repayEndTime: string;
  repayTime?: string;
};

type LoanPlan = {
  id: string;
  total: number;
  startDate: string;
  endDate: string;
  installments: Installment[];
};

const mockLoanPlan: LoanPlan = {
  id: "LP001",
  total: 50000,
  startDate: "2024-07-01",
  endDate: "2025-06-30",
  installments: [
    {
      period: 1,
      amount: 5000,
      status: "已还",
      repayStartTime: "2024-07-15 00:00",
      repayEndTime: "2024-07-15 23:59",
      repayTime: "2024-07-15 10:23",
    },
    {
      period: 2,
      amount: 5000,
      status: "已还",
      repayStartTime: "2024-08-15 00:00",
      repayEndTime: "2024-08-15 23:59",
      repayTime: "2024-08-15 11:05",
    },
    {
      period: 3,
      amount: 5000,
      status: "未还",
      repayStartTime: "2024-09-15 00:00",
      repayEndTime: "2024-09-15 23:59",
    },
    {
      period: 4,
      amount: 5000,
      status: "未还",
      repayStartTime: "2024-10-15 00:00",
      repayEndTime: "2024-10-15 23:59",
    },
    {
      period: 5,
      amount: 5000,
      status: "未开始",
      repayStartTime: "2024-11-15 00:00",
      repayEndTime: "2024-11-15 23:59",
    },
  ],
};

export default function UserDashboard() {
  const [loanPlan] = useState<LoanPlan>(mockLoanPlan);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentInstallment, setCurrentInstallment] =
    useState<Installment | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paidCount = loanPlan.installments.filter(
    (i) => i.status === "已还"
  ).length;
  const totalCount = loanPlan.installments.length;
  const remainingCount = totalCount - paidCount;

  const handleRepay = (installment: Installment) => {
    setCurrentInstallment(installment);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // 这里可以调用API更新还款状态
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentSuccess(false);
      // 刷新页面或更新状态
      window.location.reload();
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已还":
        return "text-green-600 bg-green-50";
      case "逾期":
        return "text-red-600 bg-red-50";
      case "未还":
        return "text-orange-600 bg-orange-50";
      case "未开始":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">我的贷款方案</h1>

        {/* 方案概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">方案ID</div>
            <div className="text-lg font-semibold text-blue-900">
              {loanPlan.id}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">总金额</div>
            <div className="text-lg font-semibold text-green-900">
              ￥{loanPlan.total.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">已还期数</div>
            <div className="text-lg font-semibold text-purple-900">
              {paidCount}/{totalCount}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">剩余期数</div>
            <div className="text-lg font-semibold text-orange-900">
              {remainingCount}
            </div>
          </div>
        </div>

        {/* 分期详情 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">分期详情</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
              <div>期数</div>
              <div>金额</div>
              <div>状态</div>
              <div>还款时间</div>
              <div>操作</div>
            </div>
            {loanPlan.installments.map((installment) => (
              <div
                key={installment.period}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 py-3 border-t border-gray-200 text-gray-600"
              >
                <div className="font-medium">第 {installment.period} 期</div>
                <div className="font-medium">
                  ￥{installment.amount.toLocaleString()}
                </div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      installment.status
                    )}`}
                  >
                    {installment.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {installment.repayStartTime.split(" ")[0]} -{" "}
                  {installment.repayEndTime.split(" ")[0]}
                </div>
                <div>
                  {installment.status === "未还" && (
                    <button
                      onClick={() => handleRepay(installment)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      立即还款
                    </button>
                  )}
                  {installment.status === "已还" && (
                    <span className="text-sm text-green-600">
                      {installment.repayTime?.split(" ")[1] || "已完成"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 付款弹窗 */}
      {showPaymentModal && currentInstallment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            {!paymentSuccess ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    扫码付款
                  </h3>
                  <p className="text-gray-600">
                    请使用微信扫描下方二维码完成付款
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-8 mb-4">
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <div className="text-sm text-gray-500">付款二维码</div>
                        <div className="text-xs text-gray-400 mt-1">
                          金额：￥{currentInstallment.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    第 {currentInstallment.period} 期还款
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePaymentSuccess}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    模拟付款成功
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  还款成功！
                </h3>
                <p className="text-gray-600 mb-4">
                  第 {currentInstallment.period} 期还款已完成
                </p>
                <div className="text-sm text-gray-500">页面将自动刷新...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
