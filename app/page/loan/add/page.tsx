"use client";

import { useEffect, useState, useRef } from "react";
import { get, post } from "@/lib/http";
import SearchableSelect, {
  SelectOption,
} from "@/app/_components/SearchableSelect";
import { useSearchableSelect } from "@/app/_hooks/useSearchableSelect";
import { useRouter } from "next/navigation";

type LoanPlanForm = {
  user_id: number;
  loan_amount: number;
  capital: number;
  interest: number;
  to_hand_ratio: number;
  due_start_date: string;
  due_end_date: string; // 日期
  handling_fee: number; // 金额
  total_periods: number; // 期数
  daily_repayment: number;
  risk_controller: string;
  collector: string;
  payee: string;
  lender: string;
  company_cost: number;
};

export default function AddLoanPlanPage() {
  const [form, setForm] = useState<LoanPlanForm>({
    user_id: 0,
    loan_amount: 0,
    capital: 0,
    interest: 0,
    to_hand_ratio: 0,
    due_start_date: "",
    due_end_date: "",
    handling_fee: 0, // 金额
    total_periods: 0, // 期数
    daily_repayment: 0,
    risk_controller: "",
    collector: "",
    payee: "",
    lender: "",
    company_cost: 0,
  });

  const [users, setUsers] = useState<SelectOption[]>([]);
  const [collectorOptions, setCollectorOptions] = useState<SelectOption[]>([]);
  const [riskControllerOptions, setRiskControllerOptions] = useState<
    SelectOption[]
  >([]);
  const [lenderOptions, setLenderOptions] = useState<SelectOption[]>([]);
  const [payeeOptions, setPayeeOptions] = useState<SelectOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [collectorLoading, setCollectorLoading] = useState(false);
  const [riskControllerLoading, setRiskControllerLoading] = useState(false);
  const [lenderLoading, setLenderLoading] = useState(false);
  const [payeeLoading, setPayeeLoading] = useState(false);
  const router = useRouter();
  // 使用自定义Hook管理下拉选择状态
  const userSelect = useSearchableSelect();
  const collectorSelect = useSearchableSelect();
  const riskControllerSelect = useSearchableSelect();
  const lenderSelect = useSearchableSelect();
  const payeeSelect = useSearchableSelect();

  const fetchUsers = async (query: string) => {
    setUsersLoading(true);
    try {
      const res = await get(`/users?search=${query}`);
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("获取用户列表失败:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // 通用：按管理员角色获取列表（仅首次加载，避免重复请求）
  const fetchAdminRole = async (
    role: string,
    current: SelectOption[],
    setOptions: (opts: SelectOption[]) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      if (current.length) return;
      const res = await get(`/admins/role?role=${role}`);
      setOptions(res.data || []);
    } catch (error) {
      console.error(`获取 ${role} 列表失败:`, error);
    } finally {
      setLoading(false);
    }
  };
  type FormStringKeys = "risk_controller" | "collector" | "payee" | "lender";
  const createHandleAdminSelect =
    (select: ReturnType<typeof useSearchableSelect>, key: FormStringKeys) =>
    (user: SelectOption) => {
      const selected = select.handleSelect(user);
      setForm((prev) => ({ ...prev, [key]: selected.username || "" }));
    };
  const handleRiskControllerSelect = createHandleAdminSelect(
    riskControllerSelect,
    "risk_controller"
  );
  const handleLenderSelect = createHandleAdminSelect(lenderSelect, "lender");

  // 处理用户选择
  const handleUserSelect = (user: SelectOption) => {
    const selectedUser = userSelect.handleSelect(user);
    setForm((prev) => ({
      ...prev,
      user_id: selectedUser.id as number,
    }));
  };

  // 处理收款员选择
  const handleCollectorSelect = createHandleAdminSelect(
    collectorSelect,
    "collector"
  );

  // 处理付款员选择
  const handlePayeeSelect = createHandleAdminSelect(payeeSelect, "payee");
  useEffect(() => {
    fetchUsers("");
    fetchAdminRole(
      "负责人",
      collectorOptions,
      setCollectorOptions,
      setCollectorLoading
    );
    fetchAdminRole("收款人", payeeOptions, setPayeeOptions, setPayeeLoading);
    fetchAdminRole(
      "风控人",
      riskControllerOptions,
      setRiskControllerOptions,
      setRiskControllerLoading
    );
    fetchAdminRole("打款人", lenderOptions, setLenderOptions, setLenderLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userSelect.query) {
      fetchUsers(userSelect.query);
    }
  }, [userSelect.query]);

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
      const res = await post<{ message: string; data: { id: number } }>(
        "/loan-accounts",
        form
      );
      setMessage(res.message);
      router.push(`/page/loan?loan_id=${res.data.id}`);
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
            label="选择用户"
            value={userSelect.selectedValue}
            placeholder="请选择用户"
            options={users}
            loading={usersLoading}
            query={userSelect.query}
            onQueryChange={userSelect.handleQueryChange}
            onSelect={handleUserSelect}
            onToggle={userSelect.handleToggle}
            onClose={userSelect.handleClose}
            isOpen={userSelect.isOpen}
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
              className="input-base-w"
              placeholder="请输入总金额"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">到手成数</label>
            <input
              type="number"
              value={form.to_hand_ratio || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  to_hand_ratio: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base-w"
              placeholder="请输入到手成数"
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
              className="input-base-w"
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
              className="input-base-w"
              placeholder="请输入利息"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              每期还款金额
            </label>
            <input
              type="number"
              value={form.daily_repayment || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  daily_repayment: Number(e.target.value) || 0,
                }))
              }
              required
              className="input-base-w"
              placeholder="请输入每期还款金额"
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
              className="input-base-w"
              placeholder="请输入总期数"
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
              className="input-base-w"
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

          <SearchableSelect
            label="风控人"
            value={riskControllerSelect.selectedValue}
            placeholder="请选择风控人"
            options={riskControllerOptions}
            loading={riskControllerLoading}
            query={riskControllerSelect.query}
            onQueryChange={riskControllerSelect.handleQueryChange}
            onSelect={handleRiskControllerSelect}
            onToggle={riskControllerSelect.handleToggle}
            onClose={riskControllerSelect.handleClose}
            isOpen={riskControllerSelect.isOpen}
          />
          <SearchableSelect
            label="打款人"
            value={lenderSelect.selectedValue}
            placeholder="请选择打款人"
            options={lenderOptions}
            loading={lenderLoading}
            query={lenderSelect.query}
            onQueryChange={lenderSelect.handleQueryChange}
            onSelect={handleLenderSelect}
            onToggle={lenderSelect.handleToggle}
            onClose={lenderSelect.handleClose}
            isOpen={lenderSelect.isOpen}
          />
          {/* 负责人选择 */}
          <SearchableSelect
            label="负责人"
            value={collectorSelect.selectedValue}
            placeholder="请选择负责人"
            options={collectorOptions}
            loading={collectorLoading}
            query={collectorSelect.query}
            onQueryChange={collectorSelect.handleQueryChange}
            onSelect={handleCollectorSelect}
            onToggle={collectorSelect.handleToggle}
            onClose={collectorSelect.handleClose}
            isOpen={collectorSelect.isOpen}
          />
          {/* 收款人选择 */}
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
              className="input-base-w"
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
              className="input-base-w"
              placeholder="请输入公司实际成本"
            />
          </div>
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
