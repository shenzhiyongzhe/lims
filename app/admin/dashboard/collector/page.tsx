"use client";

import { useMemo, useState } from "react";
import { get, post } from "@/lib/http";
import Link from "next/link";

type TabType = "all" | "overdue" | "paid" | "overtime" | "record";

type Customer = {
  id: string;
  username: string;
  phone: string;
  address: string;
  lv: string;
  loanAccount: {
    id: string;
    total: number;
    startDate: string;
    endDate: string;

    installments: {
      period: number;
      amount: number;
      status: "已还" | "未还" | "逾期" | "未开始";
      repayStartTime: string; // HH:mm
      repayEndTime: string; // HH:mm
      repayTime?: string; // YYYY-MM-DD HH:mm
    }[];
  }[];
};

type Tab = {
  id: string;
  type: TabType;
  name: string;
  data: any[];
  loading: boolean;
};

const initialCustomers: Customer[] = [];
export default function FrontUsersPage() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "record-default",
      type: "record",
      name: "还款记录",
      data: [],
      loading: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("record-default");

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    address: "",
  });

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editScheduleForm, setEditScheduleForm] = useState({
    due_amount: 0,
    paid_amount: 0,
    due_end_date: "",
    status: "",
  });
  // 添加处理函数
  const handleEditSchedule = (record: any) => {
    setEditingSchedule(record);
    setEditScheduleForm({
      due_amount: record.due_amount,
      paid_amount: record.paid_amount,
      due_end_date: record.due_end_date,
      status: record.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    try {
      await post(
        `/api/collector/schedules/${editingSchedule.schedule_id}`,
        editScheduleForm
      );
      // 刷新数据
      const res = await get(
        `/api/collector/schedules?loan_id=${editingSchedule.loan_id}`
      );
      setSchedules(res.data || []);
      setEditingSchedule(null);
      alert("更新成功");
    } catch (error: any) {
      alert(error.message || "更新失败");
    }
  };

  const handleGenerateLink = async (record: any) => {
    // 生成分享链接
    const shareUrl = `${window.location.origin}/share/repayment/${record.schedule_id}`;
    try {
      // 复制到剪贴板
      await navigator.clipboard.writeText(shareUrl);
      alert("链接已复制到剪贴板");
    } catch (error) {
      // 降级方案
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("链接已复制到剪贴板");
    }
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  async function onConfirm() {
    if (!form.username || !form.phone || !form.password || !form.address)
      return;
    setSubmitting(true);
    try {
      await post("/api/user", form); // 按你的实际接口地址/入参调整
      setOpen(false);
      setForm({ username: "", phone: "", password: "", address: "" });
      // TODO: 刷新列表（如有数据源，可在此触发刷新）
    } catch (e: any) {
      alert(e?.message || "添加失败");
    } finally {
      setSubmitting(false);
    }
  }
  const createTab = async (type: TabType) => {
    const tabNames = {
      record: "记录",
      all: "所有",
      overtime: "风险",
      overdue: "逾期",
      paid: "结清",
    };

    // 检查是否已存在相同类型的标签页
    const existingTab = tabs.find((t) => t.type === type);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: `${type}-${Date.now()}`,
      type,
      name: tabNames[type],
      data: [],
      loading: true,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);

    // 模拟数据加载
    try {
      // 这里调用对应的API
      let result = [] as any;
      if (type == "all") {
        const res = await get(`/api/collector/customers`);
        result = res.data;
      } else if (type == "paid" || type == "overdue" || type == "overtime") {
        const res = await get(`/api/collector/customers?&status=${type}`);
        result = res.data;
      }
      setTabs((prev) =>
        prev.map((t) =>
          t.id === newTab.id ? { ...t, data: result, loading: false } : t
        )
      );
    } catch (error) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === newTab.id ? { ...t, data: [], loading: false } : t
        )
      );
    }
  };

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(
          newTabs.length > 0 ? newTabs[newTabs.length - 1].id : ""
        );
      }
      return newTabs;
    });
  };
  const filtered = useMemo(() => {
    if (!activeTab) return [];
    return activeTab.data;
  }, [activeTab]);

  async function openSchedulesByLoan(loan: any) {
    setScheduleOpen(true);
    setScheduleLoading(true);
    try {
      const res = await get(`/api/collector/schedules?loan_id=${loan.loan_id}`);
      setSchedules(res.data || []);
    } finally {
      setScheduleLoading(false);
    }
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">前台用户管理</h2>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => createTab("all")}
          className="px-3 py-4 bg-[#b2e1e6] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          所有客户
        </button>
        <button
          onClick={() => createTab("overdue")}
          className="px-3 py-4 bg-[#B6E5D8] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          逾期客户
        </button>
        <button
          onClick={() => createTab("paid")}
          className="px-3 py-4 bg-[#FBE5C8] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          结清客户
        </button>
        <button
          onClick={() => createTab("overtime")}
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          风险客户
        </button>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          添加用户
        </button>
        <Link
          href="/admin/dashboard/loan"
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          添加方案
        </Link>
      </div>
      {/* 标签页 */}
      {tabs.length > 0 && (
        <div className="bg-white rounded-lg ">
          <div className="flex ">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-2 border-x-red-300   cursor-pointer ${
                  activeTabId === tab.id
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="mr-2">{tab.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-2 text-gray-400  hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab && (
        <div className="bg-white border-gray-200 rounded-lg overflow-hidden">
          {activeTab.loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : (
            <>
              {/* 标签页信息卡片 */}
              <div className="p-4 bg-gray-50 border-b-cyan-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeTab.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>总计: {activeTab.data.length} 条</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeTab.type === "overdue"
                          ? "bg-red-100 text-red-800"
                          : activeTab.type === "paid"
                          ? "bg-green-100 text-green-800"
                          : activeTab.type === "overtime"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {activeTab.type === "overdue"
                        ? "逾期"
                        : activeTab.type === "paid"
                        ? "已结清"
                        : activeTab.type === "overtime"
                        ? "高风险"
                        : "全部"}
                    </span>
                  </div>
                </div>
              </div>
              {activeTab.type == "all" && (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        姓名
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        手机号
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        笔数
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user: any) => (
                      <tr
                        key={user.username + Date.now()}
                        className="border-t border-gray-200 text-gray-600"
                      >
                        <td className="px-4 py-2">{user.username}</td>
                        <td className="px-4 py-2">{user.phone}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {user.loanAccount?.length || 0} 笔
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => setActiveCustomer(user)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {["overdue", "overtime", "paid"].includes(activeTab.type) && (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        姓名
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        每期金额
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        期数
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">
                        截至时间
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 &&
                      filtered.map((record: any) => (
                        <tr
                          key={record.loan_id + record.schedule_id}
                          className="border-t border-gray-200 text-gray-600"
                        >
                          <td className="px-4 py-2">{record.loan.username}</td>
                          <td className="px-4 py-2">{record.due_amount}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              第 {record.period} 期
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {record.due_end_date}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeTab.type == "record" && (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        姓名
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        日期
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        金额
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 &&
                      filtered.map((record: any) => (
                        <tr
                          key={record.loan_id + record.schedule_id}
                          className="border-t border-gray-200 text-gray-600"
                        >
                          <td className="px-4 py-2">{record.loan.username}</td>
                          <td className="px-4 py-2">{record.due_amount}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              第 {record.period} 期
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {record.due_end_date}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}

      {activeCustomer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeCustomer.username} 的贷款详情
              </h3>
              <button
                onClick={() => setActiveCustomer(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">手机号：</span>
                {activeCustomer.phone}
              </div>
              <div>
                <span className="font-medium">地址：</span>
                {activeCustomer.address}
              </div>
              <div>
                <span className="font-medium">等级：</span>
                {activeCustomer.lv}
              </div>
              <div>
                <span className="font-medium">贷款笔数：</span>
                {activeCustomer.loanAccount?.length || 0}
              </div>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-center px-4 py-2 font-medium ">姓名</th>
                  <th className="text-center px-4 py-2 font-medium ">金额</th>
                  <th className="text-center px-4 py-2 font-medium">状态</th>
                  <th className="text-center px-4 py-2 font-medium">详情</th>
                </tr>
              </thead>
              <tbody>
                {activeCustomer.loanAccount.map((loan: any) => (
                  <tr
                    key={loan.loan_id}
                    className="border-t border-gray-200 text-center"
                  >
                    <td className="px-4 py-2 text-center">{loan.username}</td>
                    <td className="px-4 py-2 text-center">
                      {loan.loan_amount}
                    </td>
                    <td
                      className={` px-1 py-2 rounded-lg  text-xs ${
                        loan.status === "overdue"
                          ? " text-red-800"
                          : loan.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : loan.status === "pending"
                          ? " text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {loan.status}
                    </td>
                    <td className="px-4 py-2 text-blue-600">
                      <button
                        onClick={() => openSchedulesByLoan(loan)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        方案
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right">
              <button
                onClick={() => setActiveCustomer(null)}
                className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !submitting && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">新增用户</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">姓名</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  className="input-base"
                  placeholder="请输入姓名"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  手机号
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="input-base"
                  placeholder="请输入手机号"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  className="input-base"
                  placeholder="请输入初始密码"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">地址</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  className="input-base"
                  placeholder="请输入地址"
                  autoComplete="street-address"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={onConfirm}
                disabled={submitting}
              >
                {submitting ? "提交中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
      {scheduleOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">还款计划</h3>
              <button
                onClick={() => setScheduleOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            {scheduleLoading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : schedules.length === 0 ? (
              <p className="text-gray-600 text-sm">暂无还款计划</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-max text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">期数</th>
                      <th className="px-4 py-2 text-left">应还金额</th>
                      <th className="px-4 py-2 text-left">开始日期</th>
                      <th className="px-4 py-2 text-left">结束日期</th>
                      <th className="px-4 py-2 text-left">状态</th>
                      <th className="px-4 py-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s: any) => (
                      <tr key={s.schedule_id} className="border-t">
                        <td className="px-4 py-2">{s.period}</td>
                        <td className="px-4 py-2">{s.due_amount}</td>
                        <td className="px-4 py-2">
                          {String(s.due_start_date).slice(0, 10)}
                        </td>
                        <td className="px-4 py-2">
                          {String(s.due_end_date).slice(0, 10)}
                        </td>
                        <td className="px-4 py-2">{s.status}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditSchedule(s)}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleGenerateLink(s)}
                              className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
                            >
                              生成链接
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 编辑模态框 */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                编辑还款信息
              </h3>
              <button
                onClick={() => setEditingSchedule(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  应还金额
                </label>
                <input
                  type="number"
                  value={editScheduleForm.due_amount || ""}
                  onChange={(e) =>
                    setEditScheduleForm((prev) => ({
                      ...prev,
                      due_amount: Number(e.target.value) || 0,
                    }))
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  实还金额
                </label>
                <input
                  type="number"
                  value={editScheduleForm.paid_amount || ""}
                  onChange={(e) =>
                    setEditScheduleForm((prev) => ({
                      ...prev,
                      paid_amount: Number(e.target.value) || 0,
                    }))
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  截至日期
                </label>
                <input
                  type="date"
                  value={editScheduleForm.due_end_date}
                  onChange={(e) =>
                    setEditScheduleForm((prev) => ({
                      ...prev,
                      due_end_date: e.target.value,
                    }))
                  }
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">状态</label>
                <select
                  value={editScheduleForm.status}
                  onChange={(e) =>
                    setEditScheduleForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="input-base"
                >
                  <option value="pending">待还款</option>
                  <option value="paid">已还款</option>
                  <option value="overtime">超期</option>
                  <option value="overdue">逾期</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
