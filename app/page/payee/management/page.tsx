"use client";

import { get, post } from "@/lib/http";
import { useEffect, useMemo, useState } from "react";
import SearchableSelect, {
  SelectOption,
} from "@/app/_components/SearchableSelect";
import { useSearchableSelect } from "@/app/_hooks/useSearchableSelect";

type AdminUser = {
  id: number;
  admin_id: number;
  username: string;
  address: string;
  payment_limit: number;
  qrcode_number: number;
};

const initialUsers: AdminUser[] = [];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);

  const [payeeLoading, setPayeeLoading] = useState(false);
  const [payeeOptions, setPayeeOptions] = useState<SelectOption[]>([]);
  const payeeSelect = useSearchableSelect();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminUser>({
    id: 0,
    admin_id: 0,
    username: "",
    address: "",
    payment_limit: 0,
    qrcode_number: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm(user);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      id: 0,
      admin_id: 0,
      username: "",
      address: "",
      payment_limit: 0,
      qrcode_number: 0,
    });
  };

  const saveEdit = () => {
    setUsers((prev) =>
      prev.map((u) => (u.id === editingId ? { ...form, id: u.id } : u))
    );
    cancelEdit();
  };

  const remove = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addNew = async () => {
    setSubmitting(true);
    try {
      const res = await post("/api/payee/management", {
        admin_id: form.admin_id,
        username: form.username,
        address: form.address,
        payment_limit: form.payment_limit,
        qrcode_number: form.qrcode_number,
      });

      setUsers((prev) => [{ ...form, id: res.data.id as number }, ...prev]);
      cancelEdit();
      alert("添加成功");
    } catch (error: any) {
      alert(error?.message || "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayeeSelect = (user: SelectOption) => {
    const selectedUser = payeeSelect.handleSelect(user);
    setForm((prev) => ({
      ...prev,
      admin_id: selectedUser.id as number,
      username: selectedUser.username || "",
    }));
  };
  const fetchPayeeOptions = async () => {
    const res = await get("/api/admin?role=收款人");
    setPayeeOptions(res.data);
  };
  const fetchPayeeUsers = async () => {
    setPayeeLoading(true);
    try {
      if (payeeOptions.length) return;
      const res = await get("/api/payee/management");
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setPayeeLoading(false);
    }
  };

  useEffect(() => {
    fetchPayeeUsers();
    fetchPayeeOptions();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">后台用户管理</h2>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchableSelect
            label="收款人"
            value={payeeSelect.selectedValue}
            placeholder="请选择收款人"
            options={payeeOptions}
            loading={payeeLoading}
            query={payeeSelect.query}
            onQueryChange={payeeSelect.handleQueryChange}
            onSelect={handlePayeeSelect}
            onToggle={payeeSelect.handleToggle}
            onClose={payeeSelect.handleClose}
            isOpen={payeeSelect.isOpen}
          />
          <input
            placeholder="地址"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="收款限额"
            value={form.payment_limit || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                payment_limit: Number(e.target.value) || 0,
              }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="收款码数量"
            value={form.qrcode_number || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                qrcode_number: Number(e.target.value) || 0,
              }))
            }
            className="text-gray-600 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

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
                地址
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                收款限额
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                收款码数量
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-200 text-gray-600">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.address}</td>
                <td className="px-4 py-2">{u.payment_limit}</td>
                <td className="px-4 py-2">{u.qrcode_number}</td>
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
  );
}
