"use client";

import { get, post } from "@/lib/http";
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
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "",
    phone: "",
    address: "",
    lv: "青铜用户",
  });
  const [adding, setAdding] = useState(false);

  const fetchData = async (p = page, ps = pageSize) => {
    setLoading(true);
    setError("");
    try {
      const res = await get(`/users?page=${p}&pageSize=${ps}`);
      if (res.code != 200) throw new Error(res?.message || "加载失败");
      setRows(Array.isArray(res.data.data) ? res.data.data : []);
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

  const addNew = async () => {
    setAdding(true);
    setError("");
    try {
      const res = await post("/users", addForm);
      if (res.code != 200) throw new Error(res.message || "添加失败");
      setShowAdd(false);
      setAddForm({
        username: "",
        phone: "",
        address: "",
        lv: "青铜用户",
      });
      alert(res.message);
      fetchData(1, pageSize);
    } catch (e: any) {
      setError(e.message || "添加失败");
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            客户列表
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            管理系统客户信息与风险标记
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            共 {total} 条 · 第 {page}/{totalPages} 页
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
          >
            添加客户
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 ring-1 ring-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-700 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50">
          <span className="font-medium text-gray-800">客户信息</span>
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
          <tbody className="">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-t">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <td key={idx} className="px-4 py-3">
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={8}>
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((u, idx) => (
                <tr
                  key={u.id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition-colors border-t text-gray-700`}
                >
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.phone}</td>
                  <td className="px-4 py-2">{u.address}</td>
                  <td className="px-4 py-2">{u.lv}</td>
                  <td className="px-4 py-2 text-center">
                    {u.is_high_risk ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                        高风险
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
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
        <div className="px-4 py-3 border-t flex items-center justify-between bg-white">
          <div className="text-sm text-gray-600">
            第 {page}/{totalPages} 页 · 共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 shadow-sm ${
                canPrev ? "" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!canPrev}
              onClick={goPrev}
            >
              上一页
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 shadow-sm ${
                canNext ? "" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!canNext}
              onClick={goNext}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-[90%] max-w-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="font-semibold text-gray-800">添加客户</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAdd(false)}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">姓名</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入姓名"
                  value={addForm.username}
                  onChange={(e) =>
                    setAddForm({ ...addForm, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">电话</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入11位手机号"
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">地址</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入地址"
                  value={addForm.address}
                  onChange={(e) =>
                    setAddForm({ ...addForm, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">等级</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={addForm.lv}
                  onChange={(e) =>
                    setAddForm({ ...addForm, lv: e.target.value })
                  }
                >
                  {[
                    "青铜用户",
                    "白银用户",
                    "黄金用户",
                    "铂金用户",
                    "钻石用户",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-3 py-2 text-sm border rounded bg-white hover:bg-gray-50"
                  onClick={() => setShowAdd(false)}
                >
                  取消
                </button>
                <button
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  disabled={adding}
                  onClick={addNew}
                >
                  {adding ? "创建中..." : "确定创建"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
