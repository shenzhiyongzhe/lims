"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ScheduleRow = {
  id: number;
  loan_id: number;
  period: number;
  due_start_date: string;
  due_end_date: string;
  due_amount: string | number;
  capital?: string | number | null;
  interest?: string | number | null;
  status: "pending" | "active" | "paid" | "overtime" | "overdue";
  paid_amount?: string | number | null;
  paid_at?: string | null;
  loan_account: {
    user: {
      id: number;
      username: string;
      phone: string;
      address: string;
      lv: string;
    };
  };
};

type Resp = {
  data: ScheduleRow[];
  pagination: { page: number; pageSize: number; total: number };
};

const STATUSES = ["pending", "active", "paid", "overtime", "overdue"] as const;

function InnerScheduleListPage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const search = useSearchParams();
  const urlStatus = (search.get("status") ||
    "pending") as ScheduleRow["status"];
  const [status, setStatus] = useState<ScheduleRow["status"]>(
    (STATUSES as readonly string[]).includes(urlStatus) ? urlStatus : "pending"
  );
  const fetchData = async (p = page, ps = pageSize, st = status) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/loan/status?status=${encodeURIComponent(
          st
        )}&page=${p}&pageSize=${ps}`
      );
      const json: Resp = await res.json();
      if (!res.ok) throw new Error((json as any)?.message || "加载失败");
      setRows(Array.isArray(json.data) ? json.data : []);
      setPage(json.pagination?.page || p);
      setPageSize(json.pagination?.pageSize || ps);
      setTotal(json.pagination?.total || 0);
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            onChange={(e) => {
              const next = e.target.value as ScheduleRow["status"];
              setPage(1);
              setStatus(next);
              router.replace(
                `/admin/dashboard/loan/list?status=${encodeURIComponent(
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                计划ID
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                贷款ID
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                详情
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                期数
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                客户
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                电话
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                地址
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                应还
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                已还
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                状态
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                开始
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                结束
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                支付时间
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-600"
                  colSpan={12}
                >
                  加载中...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-600"
                  colSpan={12}
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t text-gray-700">
                  <td className="px-4 py-2">{r.id}</td>
                  <td className="px-4 py-2">{r.loan_id}</td>
                  <td
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    onClick={() =>
                      router.push(`/admin/dashboard/loan/${r.loan_id}`)
                    }
                  >
                    方案
                  </td>
                  <td className="px-4 py-2 text-right">{r.period}</td>
                  <td className="px-4 py-2">{r.loan_account.user.username}</td>
                  <td className="px-4 py-2">{r.loan_account.user.phone}</td>
                  <td className="px-4 py-2">{r.loan_account.user.address}</td>
                  <td className="px-4 py-2 text-right">{r.due_amount}</td>
                  <td className="px-4 py-2 text-right">
                    {r.paid_amount ?? "-"}
                  </td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">
                    {new Date(r.due_start_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(r.due_end_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {r.paid_at ? new Date(r.paid_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
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
                  `/admin/dashboard/loan/list?status=${status}&page=${page}&pageSize=${pageSize}`
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
