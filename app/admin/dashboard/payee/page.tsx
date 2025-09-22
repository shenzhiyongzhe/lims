"use client";

import { get, post } from "@/lib/http";
import { useEffect, useMemo, useState } from "react";

type QRCODETYPE = "wechat_pay" | "ali_pay";
type AdminUser = {
  payee_id: string;
  username: string;
  phone: string;
  qrcode_type: QRCODETYPE;
  qrcode_url: string;
};

const initialUsers: AdminUser[] = [];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminUser>({
    payee_id: "",
    username: "",
    phone: "",
    qrcode_type: "wechat_pay",
    qrcode_url: "",
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!form.username || !form.phone) {
      alert("请先填写用户名和手机号");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("username", form.username);
      formData.append("phone", form.phone);
      formData.append("qrcode_type", form.qrcode_type);

      const res = await fetch("/api/payee/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, qrcode_url: result.url }));
        alert("上传成功");
      } else {
        alert(result.message || "上传失败");
      }
    } catch (error) {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.payee_id);
    setForm(user);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      payee_id: "",
      username: "",
      phone: "",
      qrcode_type: "wechat_pay",
      qrcode_url: "",
    });
  };

  const saveEdit = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.payee_id === editingId ? { ...form, payee_id: u.payee_id } : u
      )
    );
    cancelEdit();
  };

  const remove = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.payee_id !== id));
  };

  const addNew = async () => {
    if (!form.username || !form.phone) {
      alert("请填写用户名和手机号");
      return;
    }

    setSubmitting(true);
    try {
      const res = await post("/api/payee", {
        username: form.username,
        phone: form.phone,
        qrcode_type: form.qrcode_type,
        qrcode_url: form.qrcode_url,
      });

      setUsers((prev) => [{ ...form, id: res.data.payee_id }, ...prev]);
      cancelEdit();
      alert("添加成功");
    } catch (error: any) {
      alert(error?.message || "添加失败");
    } finally {
      setSubmitting(false);
    }
  };
  const fetchPayeeUsers = async () => {
    try {
      const res = await get("/api/payee");
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchPayeeUsers();
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
            placeholder="手机号"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.qrcode_type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                qrcode_type: e.target.value as QRCODETYPE,
              }))
            }
            required
            className="input-base"
          >
            <option value=""></option>
            <option value="wechat_pay">微信支付</option>
            <option value="ali_pay">支付宝支付</option>
          </select>
          {/* 文件上传区域 */}
          <div className="flex flex-col">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading || !form.username || !form.phone}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploading && (
              <p className="text-xs text-blue-600 mt-1">上传中...</p>
            )}
            {form.qrcode_url && (
              <p className="text-xs text-green-600 mt-1">已上传二维码</p>
            )}
          </div>
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
              disabled={submitting}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              {submitting ? "添加中..." : "新增"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                用户名
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                密码
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                收款二维码
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.payee_id}
                className="border-t border-gray-200 text-gray-600"
              >
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.phone}</td>
                <td className="px-4 py-2">
                  {u.qrcode_url ? (
                    <img
                      src={u.qrcode_url}
                      alt="二维码"
                      className="w-16 h-16 object-cover border rounded"
                    />
                  ) : (
                    <span className="text-gray-400">未上传</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => remove(u.payee_id)}
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
  );
}
