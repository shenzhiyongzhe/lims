"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { get } from "@/lib/http";

type UserInfo = {
  id: number;
  username: string;
  phone: string;
  address: string;
  lv: string;
  overtime: number;
  overdue_time: number;
  is_high_risk: boolean;
};

type LoanAccountInfo = {
  id: string;
  user_id: number;
  loan_amount: number;
  capital: number;
  interest: number;
  due_start_date: Date;
  due_end_date: Date;
  status: string;
  handling_fee: number;
  total_periods: number;
  repaid_periods: number;
  daily_repayment: number;
  risk_controller: string;
  collector: string;
  payee: string;
  lender: string;
  user?: UserInfo;
};

type RepaymentSchedule = {
  id: number;
  loan_id: string;
  period: number;
  due_start_date: string;
  due_end_date: string;
  due_amount: number;
  capital?: number;
  interest?: number;
  status: string;
  paid_amount?: number;
  paid_at?: string;
  loan_account?: LoanAccountInfo;
};

export default function RepaymentSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchSchedules = async () => {
    if (!status) {
      setError("缺少状态参数");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await get(
        `/repayment-schedules/today/status?status=${status}`
      );
      if (res.code !== 200) {
        throw new Error(res?.message || "加载数据失败");
      }
      setSchedules(res.data as RepaymentSchedule[]);
    } catch (e: any) {
      setError(e.message || "加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [status]);

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "待还款",
      active: "进行中",
      paid: "已还清",
      overtime: "超时",
      overdue: "逾期",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overtime: "bg-orange-100 text-orange-800",
      overdue: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">参数错误</h1>
            <p className="text-gray-600 mb-6">缺少必要的状态参数</p>
            <button
              onClick={() => router.push("/page/collector")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回统计页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                今日{getStatusText(status)}还款计划
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                共 {schedules.length} 笔记录
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              返回
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        )}

        {/* 数据列表 */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                今日没有{getStatusText(status)}的还款计划
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        期数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        应还金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        实还金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        截止日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        还款时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.loan_account?.user?.username ||
                              "未知用户"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.loan_account?.user?.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatAmount(schedule.due_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.paid_amount
                            ? formatAmount(schedule.paid_amount)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(schedule.due_end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              schedule.status
                            )}`}
                          >
                            {getStatusText(schedule.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {schedule.paid_at
                            ? formatDate(schedule.paid_at)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
