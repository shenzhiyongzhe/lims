"use client";

import { post, get, put } from "@/lib/http";
import { useEffect, useMemo, useState } from "react";

type Role = "管理员" | "财务员" | "风控人" | "负责人" | "收款人" | "打款人";

type AdminUser = {
  id: number;
  username: string;
  password: string;
  phone: string;
  role: Role;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminUser>({
    id: 0,
    username: "",
    password: "",
    phone: "",
    role: "风控人",
  });

  const roles: Role[] = useMemo(
    () => ["管理员", "财务员", "风控人", "负责人", "收款人", "打款人"],
    []
  );

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm(user);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ id: 0, username: "", password: "", phone: "", role: "风控人" });
  };

  const saveEdit = async () => {
    try {
      await put("/admins", form);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? { ...form, id: u.id } : u))
      );
      cancelEdit();
    } catch (error) {
      alert(error);
    }
  };

  const remove = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addNew = async () => {
    if (!form.username || !form.password) return;
    try {
      const filteredForm = {
        username: form.username,
        password: form.password,
        phone: form.phone,
        role: form.role,
      };
      const res = await post("/admins", filteredForm);
      await getAllAdminUsers();
      cancelEdit();
      alert(res.message);
    } catch (error) {
      alert(error);
    }
  };
  const getAllAdminUsers = async () => {
    try {
      const res = await get("/admins");
      if (res && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error("Unexpected response format:", res);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    getAllAdminUsers();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">后台用户管理</h2>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="用户名"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="密码"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="手机号"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as Role }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {editingId ? (
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={addNew}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm"
            >
              新增
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  用户名
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  密码
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  手机号
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  角色
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id + u.username}
                  className="border-t border-gray-200 text-gray-600"
                >
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.password}</td>
                  <td className="px-4 py-2">{u.phone}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => remove(u.id)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
