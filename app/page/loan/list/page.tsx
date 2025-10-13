"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { get } from "@/lib/http";
import { translateStatus } from "@/lib/constants";

type LoanAccount = {
  id: number;
  user_id: number;
  loan_amount: string;
  receiving_amount?: string | null;
  to_hand_ratio: number;
  capital: string | null;
  interest: string | null;
  due_start_date: string;
  due_end_date: string;
  status: "pending" | "active" | "paid" | "overtime" | "overdue";
  handling_fee: string;
  total_periods: number;
  repaid_periods: number;
  daily_repayment: string;
  risk_controller: string;
  collector: string;
  payee: string;
  lender: string;
  company_cost: number;
  created_at: string;
  created_by: number;
  updated_at: string | null;
  user: {
    id: number;
    username: string;
    phone: string;
    address: string;
    lv: string;
  };
};

type GroupedLoanData = {
  user: {
    id: number;
    username: string;
    password: string;
    phone: string;
    address: string;
    lv: string;
    overtime: number;
    overdue_time: number;
    is_high_risk: boolean;
    createdAt: string;
    updatedAt: string;
  };
  loanAccounts: LoanAccount[];
};

const STATUSES = ["pending", "active", "paid", "overtime", "overdue"] as const;

function InnerScheduleListPage() {
  const [rows, setRows] = useState<GroupedLoanData[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const search = useSearchParams();
  const urlStatus = (search.get("status") ||
    "pending") as LoanAccount["status"];
  const [status, setStatus] = useState<LoanAccount["status"]>(
    (STATUSES as readonly string[]).includes(urlStatus) ? urlStatus : "pending"
  );
  const fetchData = async (p = page, ps = pageSize, st = status) => {
    setLoading(true);
    setError("");
    try {
      const res = await get(`/loan-accounts/grouped-by-user`);
      if (res.code != 200) throw new Error(res?.message || "加载失败");
      setRows(Array.isArray(res.data) ? res.data : []);
      setPage(res.data.pagination?.page || p);
      setPageSize(res.data.pagination?.pageSize || ps);
      setTotal(res.data.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pageSize, status).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goPrev = () => {
    if (!canPrev) return;
    const p = page - 1;
    setPage(p);
    fetchData(p, pageSize, status);
  };
  const goNext = () => {
    if (!canNext) return;
    const p = page + 1;
    setPage(p);
    fetchData(p, pageSize, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">还款计划列表</h2>
        {/* <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            onChange={(e) => {
              const next = e.target.value as LoanAccount["status"];
              setPage(1);
              setStatus(next);
              router.replace(
                `/page/loan/status=${encodeURIComponent(
                  next
                )}&page=1&pageSize=${pageSize}`
              );
              fetchData(1, pageSize, next);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchData(1, pageSize, status)}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "刷新中..." : "刷新"}
          </button>
        </div> */}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-16">
                新/续
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-24">
                日期
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-32">
                客户
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-20">
                总金额
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-20">
                本金
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-20">
                利息
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                每期金额
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-16">
                期数
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                到手成数
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                手续费
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                实际成本
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                风控人
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                负责人
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">
                状态
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-600"
                  colSpan={13}
                >
                  加载中...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-600"
                  colSpan={13}
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((group) =>
                group.loanAccounts.map((loan, index) => (
                  <tr
                    key={`${group.user.id}-${loan.id}`}
                    className="border-t text-gray-700"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          index === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {index === 0 ? "新" : `续${index}`}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(loan.due_start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {group.user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {group.user.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      ¥{loan.loan_amount}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      ¥{loan.capital}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      ¥{loan.interest}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      ¥{loan.daily_repayment}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap  hover:bg-blue-50"
                      onClick={() =>
                        router.push(`/page/loan?loan_id=${loan.id}`)
                      }
                    >
                      <span className="text-green-500">
                        {loan.repaid_periods}&nbsp;
                      </span>
                      <span className="text-blue-500">
                        / {loan.total_periods}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {loan.to_hand_ratio}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      ¥{loan.handling_fee}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      ¥{loan.company_cost}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {loan.risk_controller}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {loan.collector}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          loan.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : loan.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : loan.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : loan.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {translateStatus(loan.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            第 {page}/{totalPages} 页 · 共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">每页</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                const ps = Number(e.target.value) || 20;
                setPageSize(ps);
                setPage(1);
                router.replace(
                  `/page/loan/list?status=${status}&page=${page}&pageSize=${pageSize}`
                );
                fetchData(page, pageSize, status);
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              className={`px-3 py-1 rounded border text-sm ${
                canPrev ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!canPrev}
              onClick={goPrev}
            >
              上一页
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm ${
                canNext ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!canNext}
              onClick={goNext}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleListPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-6 text-gray-600">加载中...</div>}
    >
      <InnerScheduleListPage />
    </Suspense>
  );
}
