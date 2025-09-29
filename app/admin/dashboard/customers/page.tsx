"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  username: string;
  phone: string;
  address: string;
  lv: string;
  is_high_risk: boolean;
  overtime: number;
  overdue_time: number;
};

type Resp = {
  data: Customer[];
  pagination: { page: number; pageSize: number; total: number };
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (p = page, ps = pageSize) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/customers?page=${p}&pageSize=${ps}`);
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
    fetchData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goPrev = () => {
    if (!canPrev) return;
    const p = page - 1;
    setPage(p);
    fetchData(p, pageSize);
  };
  const goNext = () => {
    if (!canNext) return;
    const p = page + 1;
    setPage(p);
    fetchData(p, pageSize);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">客户列表</h2>
        <div className="text-sm text-gray-600">
          共 {total} 条 · 第 {page}/{totalPages} 页
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-700 flex items-center justify-between">
          <span>客户信息</span>
          <div className="flex items-center gap-2">
            <label className="text-gray-600 text-sm">每页</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                const ps = Number(e.target.value) || 20;
                setPageSize(ps);
                setPage(1);
                fetchData(1, ps);
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                ID
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                姓名
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                电话
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                地址
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                等级
              </th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">
                高风险
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                超时
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                逾期
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={8}>
                  加载中...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={8}>
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t text-gray-700">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.phone}</td>
                  <td className="px-4 py-2">{u.address}</td>
                  <td className="px-4 py-2">{u.lv}</td>
                  <td className="px-4 py-2 text-center">
                    {u.is_high_risk ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                        高风险
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{u.overtime}</td>
                  <td className="px-4 py-2 text-right">{u.overdue_time}</td>
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
