"use client";

import { del, get, post, put } from "@/lib/http";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  username: string;
  password: string;
  phone: string;
  address: string;
  lv: string;
  is_high_risk: boolean;
  overtime: number;
  overdue_time: number;
  createdAt: string;
  updatedAt: string;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    username: "",
    password: "123456",
    phone: "",
    address: "",
    lv: "青铜用户",
    overtime: 0,
    overdue_time: 0,
    is_high_risk: false,
  });
  const [adding, setAdding] = useState(false);

  // 删除确认弹窗状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<Customer | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // 用户贷款详情状态
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userLoans, setUserLoans] = useState<{ [userId: number]: any[] }>({});
  const [loadingLoans, setLoadingLoans] = useState<{
    [userId: number]: boolean;
  }>({});

  const router = useRouter();
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

  const fetchUserLoans = async (userId: number) => {
    // 如果已经展开，则收起
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    // 如果已经有数据，直接展开
    if (userLoans[userId]) {
      setExpandedUser(userId);
      return;
    }

    // 加载数据
    setLoadingLoans((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await get(`/loan-accounts/user/${userId}`);
      if (res.code !== 200) throw new Error(res?.message || "加载失败");

      setUserLoans((prev) => ({ ...prev, [userId]: res.data || [] }));
      setExpandedUser(userId);
    } catch (e: any) {
      setError(e.message || "加载贷款信息失败");
    } finally {
      setLoadingLoans((prev) => ({ ...prev, [userId]: false }));
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
  const resetForm = () => {
    setAddForm({
      username: "",
      password: "123456",
      phone: "",
      address: "",
      lv: "青铜用户",
      overtime: 0,
      overdue_time: 0,
      is_high_risk: false,
    });
    setEditingId(null);
  };
  const addNew = async () => {
    setAdding(true);
    setError("");
    try {
      let res;
      if (editingId) {
        // 编辑模式
        res = await put(`/users/${editingId}`, addForm);
        if (res.code != 200) throw new Error(res.message || "更新失败");
        alert("更新成功");
      } else {
        // 创建模式
        res = await post("/users", addForm);
        if (res.code != 200) throw new Error(res.message || "添加失败");
        alert("创建成功");
      }
      setShowAdd(false);
      resetForm();
      setEditingId(null);
      fetchData(1, pageSize);
    } catch (e: any) {
      setError(e.message || (editingId ? "更新失败" : "添加失败"));
    } finally {
      setAdding(false);
    }
  };
  const showDeleteConfirmDialog = (user: Customer) => {
    setDeletingUser(user);
    setDeletingId(user.id);
    setAdminPassword("");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId || !adminPassword.trim()) {
      setError("请输入管理员密码");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const res = await del(`/users/${deletingId}`, {
        params: { admin_password: adminPassword },
      });
      if (res.code != 200) throw new Error(res?.message || "删除失败");
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setDeletingUser(null);
      setAdminPassword("");
      alert("删除成功");
      fetchData(1, pageSize);
    } catch (e: any) {
      setError(e.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
    setDeletingUser(null);
    setAdminPassword("");
    setError("");
  };
  const startEdit = (user: Customer) => {
    const { id, updatedAt, createdAt, ...rest } = user;
    setAddForm(rest);
    setEditingId(id);
    setShowAdd(true);
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

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-x-auto">
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
        <table className="min-w-full text-sm ">
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
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                详情
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                编辑
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                删除
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
                <React.Fragment key={u.id}>
                  <tr
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
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => fetchUserLoans(u.id)}
                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 rounded px-2 py-1"
                        disabled={loadingLoans[u.id]}
                      >
                        {loadingLoans[u.id] ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>详情</span>
                            <span
                              className={`transform transition-transform ${
                                expandedUser === u.id ? "rotate-180" : ""
                              }`}
                            >
                              ▼
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => startEdit(u)}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        编辑
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => showDeleteConfirmDialog(u)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </td>
                  </tr>

                  {/* 展开的贷款信息行 */}
                  {expandedUser === u.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={11} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">
                              贷款信息
                            </h4>
                            <span className="text-sm text-gray-500">
                              共 {userLoans[u.id]?.length || 0} 笔贷款
                            </span>
                          </div>

                          {userLoans[u.id] && userLoans[u.id].length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      贷款ID
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">
                                      贷款金额
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">
                                      本金
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">
                                      利息
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      期数
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      已还期数
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      状态
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      开始日期
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      结束日期
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                                      操作
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userLoans[u.id].map((loan: any) => (
                                    <tr
                                      key={loan.id}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="px-3 py-2">{loan.id}</td>
                                      <td className="px-3 py-2 text-right">
                                        ¥{loan.loan_amount}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        ¥{loan.capital}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        ¥{loan.interest}
                                      </td>
                                      <td className="px-3 py-2">
                                        {loan.total_periods}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="text-green-600">
                                          {loan.repaid_periods}
                                        </span>
                                        <span className="text-gray-400">
                                          {" "}
                                          / {loan.total_periods}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2">
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
                                          {loan.status === "pending"
                                            ? "待放款"
                                            : loan.status === "active"
                                            ? "进行中"
                                            : loan.status === "paid"
                                            ? "已还清"
                                            : loan.status === "overdue"
                                            ? "逾期"
                                            : loan.status}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2">
                                        {new Date(
                                          loan.due_start_date
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-3 py-2">
                                        {new Date(
                                          loan.due_end_date
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-3 py-2">
                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/page/loan?loan_id=${loan.id}`
                                            )
                                          }
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          查看详情
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-4">
                              该用户暂无贷款记录
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
              <div className="font-semibold text-gray-800">
                {editingId ? "编辑客户" : "添加客户"}
              </div>
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
                <label className="block text-sm text-gray-600 mb-1">密码</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入密码"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, password: e.target.value })
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
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  高风险
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入高风险"
                  value={addForm.is_high_risk ? "是" : "否"}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      is_high_risk: e.target.value === "是",
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">超时</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入超时"
                  value={addForm.overtime}
                  onChange={(e) =>
                    setAddForm({ ...addForm, overtime: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">逾期</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入逾期"
                  value={addForm.overdue_time}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      overdue_time: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  高风险
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入高风险"
                  value={addForm.is_high_risk ? "是" : "否"}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      is_high_risk: e.target.value === "是",
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">逾期</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="请输入逾期"
                  value={addForm.overdue_time}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      overdue_time: Number(e.target.value),
                    })
                  }
                />
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
                  {adding
                    ? editingId
                      ? "更新中..."
                      : "创建中..."
                    : editingId
                    ? "更新"
                    : "创建"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-[90%] max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="font-semibold text-gray-800">确认删除</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={cancelDelete}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600">
                您确定要删除用户{" "}
                <span className="font-semibold text-gray-900">
                  {deletingUser?.username}
                </span>{" "}
                吗？
              </div>
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                ⚠️ 此操作不可撤销，删除后将无法恢复用户数据。
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请输入管理员密码以确认删除
                </label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="请输入管理员密码"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      confirmDelete();
                    }
                  }}
                />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-3 py-2 text-sm border rounded bg-white hover:bg-gray-50"
                  onClick={cancelDelete}
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded shadow-sm hover:bg-red-700 disabled:opacity-50"
                  disabled={deleting || !adminPassword.trim()}
                  onClick={confirmDelete}
                >
                  {deleting ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
