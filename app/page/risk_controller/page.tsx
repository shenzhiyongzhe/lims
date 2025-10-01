"use client";

import { useMemo, useState } from "react";
import { get, post } from "@/lib/http";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabType = "all" | "overdue" | "paid" | "overtime" | "record";

type Customer = {
  id: number;
  username: string;
  phone: string;
  address: string;
  lv: string;
  loanAccount: {
    id: number;
    user_id: number;
    loan_amount: string;
    receiving_amount: string | null;
    capital: string;
    interest: string;
    due_start_date: string;
    due_end_date: string;
    status: string;
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
  }[];
};

type Tab = {
  id: string;
  type: TabType;
  name: string;
  data: any[];
  loading: boolean;
};

export default function FrontUsersPage() {
  const router = useRouter();
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  async function onConfirm() {
    if (!form.username || !form.phone || !form.password || !form.address)
      return;
    setSubmitting(true);
    try {
      await post("/api/user", form);
      setOpen(false);
      setForm({ username: "", phone: "", password: "", address: "" });
    } catch (e: any) {
      alert(e?.message || "添加失败");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!activeTab) return [];
    return activeTab.data;
  }, [activeTab]);

  // 处理跳转到贷款方案详情页面
  const handleViewLoanDetails = (loanId: number) => {
    router.push(`/admin/dashboard/loan/${loanId}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">前台用户管理</h2>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/page/customers/my"
          className="px-3 py-4 bg-[#b2e1e6] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          所有客户
        </Link>
        <Link
          href="/page/customers/my?status=overdue"
          className="px-3 py-4 bg-[#B6E5D8] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          逾期客户
        </Link>
        <Link
          href="/page/customers/my?status=paid"
          className="px-3 py-4 bg-[#FBE5C8] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          结清客户
        </Link>
        <Link
          href="/page/customers/my?status=overtime"
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          风险客户
        </Link>
        <Link
          href="/page/customers/management"
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          添加用户
        </Link>
        <Link
          href="/page/loan/add"
          className="px-3 py-4 bg-[#FFC2C7] text-gray-700 rounded-md text-sm flex justify-center items-center cursor-pointer"
        >
          添加方案
        </Link>
      </div>

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

              {/* 所有客户表格 - 显示贷款方案 */}
              {activeTab.type == "all" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          客户信息
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          贷款方案
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          状态
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((customer: Customer) => (
                        <tr
                          key={customer.id}
                          className="border-t border-gray-200 text-gray-600"
                        >
                          <td className="px-4 py-2">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {customer.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {customer.phone}
                              </div>
                              <div className="text-xs text-gray-500">
                                {customer.address}
                              </div>
                              <div className="text-xs">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  {customer.lv}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-2">
                              {customer.loanAccount?.map((loan) => (
                                <div
                                  key={loan.id}
                                  className="border border-gray-200 rounded p-2 bg-gray-50"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium">
                                        ¥{loan.loan_amount}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {loan.total_periods}期 | 已还
                                        {loan.repaid_periods}期
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">
                                        {new Date(
                                          loan.due_start_date
                                        ).toLocaleDateString()}{" "}
                                        -
                                        {new Date(
                                          loan.due_end_date
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!customer.loanAccount ||
                                customer.loanAccount.length === 0) && (
                                <div className="text-gray-400 text-sm">
                                  暂无贷款方案
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-1">
                              {customer.loanAccount?.map((loan) => (
                                <div key={loan.id}>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      loan.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : loan.status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : loan.status === "overdue"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {loan.status === "pending"
                                      ? "待还款"
                                      : loan.status === "paid"
                                      ? "已结清"
                                      : loan.status === "overdue"
                                      ? "逾期"
                                      : loan.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="space-y-1">
                              <button
                                onClick={() => setActiveCustomer(customer)}
                                className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                              >
                                详情
                              </button>
                              {customer.loanAccount?.map((loan) => (
                                <div key={loan.id}>
                                  <button
                                    onClick={() =>
                                      handleViewLoanDetails(loan.id)
                                    }
                                    className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
                                  >
                                    方案{loan.id}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 其他类型的表格保持不变 */}
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

      {/* 客户详情模态框 */}
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
                  <th className="text-center px-4 py-2 font-medium">方案ID</th>
                  <th className="text-center px-4 py-2 font-medium">
                    贷款金额
                  </th>
                  <th className="text-center px-4 py-2 font-medium">期数</th>
                  <th className="text-center px-4 py-2 font-medium">状态</th>
                  <th className="text-center px-4 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {activeCustomer.loanAccount?.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-t border-gray-200 text-center"
                  >
                    <td className="px-4 py-2">{loan.id}</td>
                    <td className="px-4 py-2">¥{loan.loan_amount}</td>
                    <td className="px-4 py-2">
                      {loan.repaid_periods}/{loan.total_periods}
                    </td>
                    <td
                      className={`px-1 py-2 rounded-lg text-xs ${
                        loan.status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : loan.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : loan.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {loan.status === "pending"
                        ? "待还款"
                        : loan.status === "paid"
                        ? "已结清"
                        : loan.status === "overdue"
                        ? "逾期"
                        : loan.status}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleViewLoanDetails(loan.id)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        查看方案
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

      {/* 添加用户模态框 */}
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
                  className="input-base-w"
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
                  className="input-base-w"
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
                  className="input-base-w"
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
                  className="input-base-w"
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
    </div>
  );
}
