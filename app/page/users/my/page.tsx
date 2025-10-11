"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type User = {
  id: number;
  username: string;
  phone: string;
  address: string;
  lv: string;
};

type RepaymentSchedule = {
  id: number;
  period: number;
  due_start_date: string;
  due_end_date: string;
  due_amount: string;
  capital: string;
  interest: string;
  status: string;
  paid_amount?: string;
  paid_at?: string;
};

type LoanAccount = {
  id: number;
  loan_amount: string;
  status: string;
  collector: string;
  payee: string;
  lender: string;
  repaymentSchedules: RepaymentSchedule[];
  repaid_periods: number;
  total_periods: number;
};

type UserWithLoans = {
  user: User;
  loanAccount: LoanAccount[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export default function MyCustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<UserWithLoans[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    fetch("/customers/my")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setPagination(res.pagination || { page: 1, pageSize: 20, total: 0 });
      });
  }, []);

  const getStatusBadgeClass = (status: string) => {
    const base =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset";
    switch (status) {
      case "paid":
        return `${base} bg-green-50 text-green-700 ring-green-600/20`;
      case "active":
        return `${base} bg-blue-50 text-blue-700 ring-blue-600/20`;
      case "pending":
        return `${base} bg-amber-50 text-amber-700 ring-amber-600/20`;
      case "overtime":
        return `${base} bg-orange-50 text-orange-700 ring-orange-600/20`;
      case "overdue":
        return `${base} bg-rose-50 text-rose-700 ring-rose-600/20`;
      default:
        return `${base} bg-gray-100 text-gray-700 ring-gray-400/30`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">贷款账户列表</h2>
          <p className="mt-1 text-sm text-gray-500">
            按用户分组展示每位客户的贷款账户与还款计划
          </p>
        </div>
        <div className="text-sm text-gray-600">
          共{" "}
          <span className="font-semibold text-gray-900">
            {pagination.total}
          </span>{" "}
          个用户，当前第 {pagination.page} 页
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          暂无数据
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((userWithLoans) => (
            <div
              key={userWithLoans.user.id}
              className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden"
            >
              {/* 用户信息 */}
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  客户信息
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">姓名</span>
                    <span className="font-medium text-gray-900">
                      {userWithLoans.user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">手机号</span>
                    <span className="font-medium text-gray-900">
                      {userWithLoans.user.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">地址</span>
                    <span className="font-medium text-gray-900">
                      {userWithLoans.user.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">等级</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
                      {userWithLoans.user.lv}
                    </span>
                  </div>
                </div>
              </div>

              {/* 贷款账户列表 */}
              <div className="p-6 space-y-4">
                <div className="text-sm text-gray-600">
                  贷款账户（{userWithLoans.loanAccount.length} 个）
                </div>

                {userWithLoans.loanAccount.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    暂无贷款账户
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userWithLoans.loanAccount.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-2">
                            <span
                              className="text-blue-400"
                              onClick={() =>
                                router.push(`/page/loan/${account.id}`)
                              }
                            >
                              <span className="text-gray-500">贷款ID：</span>
                              <span className="font-medium text-gray-900">
                                {account.id}
                              </span>
                            </span>
                            <span>
                              <span className="text-gray-500">贷款金额：</span>
                              <span className="font-semibold tabular-nums">
                                {account.loan_amount}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-gray-500">状态：</span>
                              <span
                                className={getStatusBadgeClass(account.status)}
                              >
                                {account.status}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-gray-500">期数：</span>
                              {account.repaid_periods}/{account.total_periods}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-gray-200">
                              <span className="text-gray-500">负责人</span>
                              <span className="font-medium text-gray-900">
                                {account.collector}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-gray-200">
                              <span className="text-gray-500">收款人</span>
                              <span className="font-medium text-gray-900">
                                {account.payee}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-gray-200">
                              <span className="text-gray-500">打款人</span>
                              <span className="font-medium text-gray-900">
                                {account.lender}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* 还款计划 */}
                        {account.repaymentSchedules.length > 0 ? (
                          <div className="bg-white">
                            <div className="px-4 pt-2 text-sm text-gray-600">
                              还款计划
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full table-auto text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium">
                                      期数
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      应还金额
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      本金
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      利息
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      状态
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      已还金额
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                      还款时间
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {account.repaymentSchedules.map(
                                    (schedule, idx) => (
                                      <tr
                                        key={schedule.id}
                                        className={
                                          idx % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                        }
                                      >
                                        <td className="px-4 py-2">
                                          {schedule.period}
                                        </td>
                                        <td className="px-4 py-2 tabular-nums">
                                          {schedule.due_amount}
                                        </td>
                                        <td className="px-4 py-2 tabular-nums">
                                          {schedule.capital}
                                        </td>
                                        <td className="px-4 py-2 tabular-nums">
                                          {schedule.interest}
                                        </td>
                                        <td className="px-4 py-2">
                                          <span
                                            className={getStatusBadgeClass(
                                              schedule.status
                                            )}
                                          >
                                            {schedule.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 tabular-nums">
                                          {schedule.paid_amount || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {schedule.paid_at
                                            ? new Date(
                                                schedule.paid_at
                                              ).toLocaleString("zh-CN")
                                            : "-"}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white px-4 py-6 text-center text-sm text-gray-500">
                            暂无还款计划
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
