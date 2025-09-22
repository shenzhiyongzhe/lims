"use client";

import { useEffect, useState, useRef } from "react";
import { get, post } from "@/lib/http";

type LoanPlanForm = {
  user_id: number;
  username: string;
  loan_amount: number;
  capital: number;
  interest: number;
  due_start_date: string;
  due_end_date: string; // 日期
  handling_fee: number; // 金额
  total_periods: number; // 期数
  monthly_repayment: number;
  risk_controller: string;
  collector: string;
  payee: string;
  company_cost: number;
  remark: string;
};
type UserItem = { id: number; username: string; phone: string };

// 统一的下拉搜索组件
interface SearchableSelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: UserItem[];
  loading: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (user: UserItem) => void;
  onToggle: () => void;
  onClose: () => void; // 添加关闭回调
  isOpen: boolean;
  disabled?: boolean;
}
function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  loading,
  query,
  onQueryChange,
  onSelect,
  onToggle,
  isOpen,
  onClose, // 接收关闭回调
  disabled = false,
}: SearchableSelectProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        onClose(); // 调用父组件的关闭函数
      }
    }
    if (isOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen, onClose]);

  const filtered = query
    ? options.filter((u) =>
        u.username?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="input-base flex items-center justify-between disabled:opacity-50"
      >
        <span>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={`搜索${label}`}
              className="input-base"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">暂无匹配用户</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onSelect(u)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-500"
                >
                  {u.username}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddLoanPlanPage() {
  const [form, setForm] = useState<LoanPlanForm>({
    user_id: 0,
    username: "",
    loan_amount: 0,
    capital: 0,
    interest: 0,
    due_start_date: "",
    due_end_date: "",
    handling_fee: 0, // 金额
    total_periods: 0, // 期数
    monthly_repayment: 0,
    risk_controller: "",
    collector: "",
    payee: "",
    company_cost: 0,
    remark: "",
  });
  // 统一的状态管理
  const [dropdowns, setDropdowns] = useState({
    user: { isOpen: false, query: "", loading: false },
    collector: { isOpen: false, query: "", loading: false },
    payee: { isOpen: false, query: "", loading: false },
  });

  const [userOpen, setUserOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<UserItem[]>([]);
  const [collectorOptions, setCollectorOptions] = useState<UserItem[]>([]);
  const [payeeOptions, setPayeeOptions] = useState<UserItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const rolesMap = {
    collector: "负责人",
    payee: "收款人",
  };

  // 加载用户数据
  async function loadUsersOnce() {
    if (userOptions.length) return;
    setDropdowns((prev) => ({
      ...prev,
      user: { ...prev.user, loading: true },
    }));
    try {
      const res = await get<{ data: UserItem[] }>("/api/user", {
        params: { page: 1, pageSize: 500 },
      });
      setUserOptions(res.data || []);
    } finally {
      setDropdowns((prev) => ({
        ...prev,
        user: { ...prev.user, loading: false },
      }));
    }
  }
  async function loadAdminsOnce(type: keyof typeof rolesMap) {
    if (type === "collector") {
      if (collectorOptions.length) return;
    } else if (type === "payee") {
      if (payeeOptions.length) return;
    }
    setDropdowns((prev) => ({
      ...prev,
      [type]: { ...prev[type], loading: true },
    }));
    try {
      const res = await get<{ data: UserItem[] }>(
        `/api/admin?role=${rolesMap[type]}`
      );
      if (type === "collector") {
        setCollectorOptions(res.data || []);
      } else if (type === "payee") {
        setPayeeOptions(res.data || []);
      }
    } finally {
      setDropdowns((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: false },
      }));
    }
  }
  // 统一的下拉控制函数
  const handleDropdownToggle = (type: keyof typeof dropdowns) => {
    setDropdowns((prev) => ({
      ...prev,
      [type]: { ...prev[type], isOpen: !prev[type].isOpen },
    }));
  };
  // 在父组件中
  const handleDropdownClose = (type: keyof typeof dropdowns) => {
    setDropdowns((prev) => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false },
    }));
  };
  const handleQueryChange = (type: keyof typeof dropdowns, query: string) => {
    setDropdowns((prev) => ({
      ...prev,
      [type]: { ...prev[type], query },
    }));
  };

  const handleUserSelect = (
    user: UserItem,
    type: "user" | "collector" | "payee"
  ) => {
    if (type === "user") {
      setForm((f) => ({
        ...f,
        user_id: user.id,
        username: user.username,
      }));
    } else {
      setForm((f) => ({
        ...f,
        [type]: user.username,
      }));
    }
    setDropdowns((prev) => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false, query: "" },
    }));
  };
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setUserOpen(false);
    }
    if (userOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [userOpen]);
  useEffect(() => {
    if (form.due_start_date && form.total_periods > 0) {
      const startDate = new Date(form.due_start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + form.total_periods - 1); // 减1因为开始日期算第一期

      const formattedEndDate = endDate.toISOString().split("T")[0];
      setForm((f) => ({ ...f, due_end_date: formattedEndDate }));
    }
  }, [form.due_start_date, form.total_periods]);

  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await post<{ message: string }>("/api/loan", form);
      setMessage(res.message);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">添加用户贷款方案</h2>

      <form onSubmit={onSubmit} className="bg-white  rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 用户选择 */}
          <SearchableSelect
            label="姓名"
            value={form.username}
            placeholder="请选择用户"
            options={userOptions}
            loading={dropdowns.user.loading}
            query={dropdowns.user.query}
            onQueryChange={(query) => handleQueryChange("user", query)}
            onSelect={(user) => handleUserSelect(user, "user")}
            onToggle={() => {
              loadUsersOnce();
              handleDropdownToggle("user");
            }}
            onClose={() => handleDropdownClose("user")} // 传入关闭回调
            isOpen={dropdowns.user.isOpen}
          />
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              总金额（元）
            </label>
            <input
              type="number"
              value={form.loan_amount || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  loan_amount: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base"
              placeholder="请输入总金额"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">本金</label>
            <input
              type="number"
              value={form.capital || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, capital: Number(e.target.value) || 0 }))
              }
              className="input-base"
              placeholder="请输入本金"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">利息</label>
            <input
              type="number"
              value={form.interest || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  interest: Number(e.target.value) || 0,
                }))
              }
              className="input-base"
              placeholder="请输入利息"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              开始还款日期
            </label>
            <input
              type="date"
              value={form.due_start_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_start_date: e.target.value }))
              }
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">总期数</label>
            <input
              type="number"
              value={form.total_periods || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  total_periods: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base"
              placeholder="请输入总期数"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              结束还款日期
            </label>
            <input
              type="date"
              value={form.due_end_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_end_date: e.target.value }))
              }
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200 text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              每期还款金额
            </label>
            <input
              type="number"
              value={form.monthly_repayment || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  monthly_repayment: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base"
              placeholder="请输入每期还款金额"
            />
          </div>
          {/* 负责人选择 */}
          <SearchableSelect
            label="负责人"
            value={form.collector}
            placeholder="请选择负责人"
            options={collectorOptions}
            loading={dropdowns.collector.loading}
            query={dropdowns.collector.query}
            onQueryChange={(query) => handleQueryChange("collector", query)}
            onSelect={(user) => handleUserSelect(user, "collector")}
            onToggle={() => {
              loadAdminsOnce("collector");
              handleDropdownToggle("collector");
            }}
            onClose={() => handleDropdownClose("collector")}
            isOpen={dropdowns.collector.isOpen}
          />
          {/* 收款人选择 */}
          <SearchableSelect
            label="收款人"
            value={form.payee}
            placeholder="请选择收款人"
            options={payeeOptions}
            loading={dropdowns.payee.loading}
            query={dropdowns.payee.query}
            onQueryChange={(query) => handleQueryChange("payee", query)}
            onSelect={(user) => handleUserSelect(user, "payee")}
            onToggle={() => {
              loadAdminsOnce("payee");
              handleDropdownToggle("payee");
            }}
            onClose={() => handleDropdownClose("payee")}
            isOpen={dropdowns.payee.isOpen}
          />
          <div>
            <label className="block text-sm text-gray-600 mb-1">手续费</label>
            <input
              type="number"
              value={form.handling_fee || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  handling_fee: Number(e.target.value) || 0,
                }))
              }
              className="input-base"
              placeholder="请输入手续费"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              公司实际成本
            </label>
            <input
              type="number"
              value={form.company_cost || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  company_cost: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base"
              placeholder="请输入公司实际成本"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">备注</label>
          <input
            type="text"
            value={form.remark}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                remark: e.target.value,
              }))
            }
            className="input-base"
          />
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            提交
          </button>
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
      </form>
    </div>
  );
}
