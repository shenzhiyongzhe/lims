"use client";

import { useEffect, useState } from "react";

type Feedback = {
  id: number;
  title: string;
  content: string;
  type: "bug" | "suggestion";
  status: "open" | "fixed";
  reporter?: string | null;
  contact?: string | null;
  created_at: string;
  updated_at: string;
};

type Resp = {
  data: Feedback[];
  pagination: { page: number; pageSize: number; total: number };
};

export default function FeedbackPage() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"open" | "fixed" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "bug" as "bug" | "suggestion",
    reporter: "",
    contact: "",
  });

  const fetchData = async (p = page, ps = pageSize, st = status) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (st) query.set("status", st);
      query.set("page", String(p));
      query.set("pageSize", String(ps));
      const res = await fetch(`/feedback?${query.toString()}`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">问题与建议</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as any);
            }}
          >
            <option value="">全部</option>
            <option value="open">未修复</option>
            <option value="fixed">已修复</option>
          </select>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            提交反馈
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                ID
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                标题
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                类型
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                状态
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                提交人
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                联系方式
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                内容
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                操作
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
              rows.map((r) => (
                <tr key={r.id} className="border-t text-gray-700">
                  <td className="px-4 py-2">{r.id}</td>
                  <td className="px-4 py-2">{r.title}</td>
                  <td className="px-4 py-2">
                    {r.type === "bug" ? "缺陷" : "建议"}
                  </td>
                  <td className="px-4 py-2">
                    {r.status === "open" ? "未修复" : "已修复"}
                  </td>
                  <td className="px-4 py-2">{r.reporter || "-"}</td>
                  <td className="px-4 py-2">{r.contact || "-"}</td>
                  <td className="px-4 py-2 max-w-[360px] whitespace-pre-wrap">
                    {r.content}
                  </td>
                  <td className="px-4 py-2">
                    {r.status === "open" && (
                      <button
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={async () => {
                          try {
                            const res = await fetch("/feedback", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: r.id,
                                status: "fixed",
                              }),
                            });
                            const json = await res.json();
                            if (!res.ok)
                              throw new Error(json?.message || "操作失败");
                            fetchData(page, pageSize, status);
                          } catch (e: any) {
                            setError(e.message || "操作失败");
                          }
                        }}
                      >
                        标记已修复
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            第 {page}/{Math.max(1, Math.ceil(total / Math.max(1, pageSize)))} 页
            · 共 {total} 条
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
                fetchData(1, ps, status);
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
                page > 1 ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={page <= 1}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchData(p, pageSize, status);
              }}
            >
              上一页
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm ${
                page < Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
                  ? "hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              disabled={
                page >= Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
              }
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchData(p, pageSize, status);
              }}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-gray-800">提交问题/建议</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAdd(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">类型</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as any })
                  }
                >
                  <option value="bug">缺陷</option>
                  <option value="suggestion">建议</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">内容</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={6}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    提交人（可选）
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.reporter}
                    onChange={(e) =>
                      setForm({ ...form, reporter: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    联系方式（可选）
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.contact}
                    onChange={(e) =>
                      setForm({ ...form, contact: e.target.value })
                    }
                  />
                </div>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-3 py-2 text-sm border rounded"
                  onClick={() => setShowAdd(false)}
                >
                  取消
                </button>
                <button
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                  disabled={adding}
                  onClick={async () => {
                    setAdding(true);
                    setError("");
                    try {
                      const res = await fetch("/feedback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(form),
                      });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json?.message || "提交失败");
                      setShowAdd(false);
                      setForm({
                        title: "",
                        content: "",
                        type: "bug",
                        reporter: "",
                        contact: "",
                      });
                      fetchData(page, pageSize, status);
                    } catch (e: any) {
                      setError(e.message || "提交失败");
                    } finally {
                      setAdding(false);
                    }
                  }}
                >
                  {adding ? "提交中..." : "提交"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
