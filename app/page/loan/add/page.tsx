"use client";

import { useEffect, useState, useRef } from "react";
import { get, post } from "@/lib/http";
import SearchableSelect, {
  SelectOption,
} from "@/app/_components/SearchableSelect";
import UserSelectWithAdd from "@/app/_components/UserSelectWithAdd";
import { useSearchableSelect } from "@/app/_hooks/useSearchableSelect";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LoanPlanForm = {
  user_id: number;
  loan_amount: number;
  capital: number;
  interest: number;
  to_hand_ratio: number;
  due_start_date: string;
  due_end_date: string;
  handling_fee: number;
  total_periods: number;
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
    handling_fee: 0,
    total_periods: 0,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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
      endDate.setDate(startDate.getDate() + form.total_periods - 1);

      const formattedEndDate = endDate.toISOString().split("T")[0];
      setForm((f) => ({ ...f, due_end_date: formattedEndDate }));
    }
  }, [form.due_start_date, form.total_periods]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await post<{ message: string; data: { id: number } }>(
        "/loan-accounts",
        form
      );

      setCreatedLoanId(res.data.id);
      setShowSuccessDialog(true);
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedUser = () => {
    return users.find((user) => user.id === form.user_id);
  };

  const handleCopyShareLink = async () => {
    if (!createdLoanId) return;
    const url = `${window.location.origin}/page/customers?loan_id=${createdLoanId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShowSuccessDialog(false);
      toast({
        title: "复制成功",
        description: "链接已复制到剪贴板",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "复制失败",
        description: e?.message || "复制失败",
        variant: "destructive",
      });
    }
  };

  const handleGoToDetail = () => {
    if (!createdLoanId) return;
    setShowSuccessDialog(false);
    router.push(`/page/loan?loan_id=${createdLoanId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建贷款方案</h1>
          <p className="text-gray-600">
            为客户创建新的贷款方案，填写完整信息后系统将自动生成还款计划
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Customer Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>客户信息</CardTitle>
              <CardDescription>选择要创建贷款方案的客户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <UserSelectWithAdd
                    label="选择用户 *"
                    placeholder="请选择用户"
                    value={userSelect.selectedValue as any}
                    onChange={(opt) => handleUserSelect(opt)}
                  />
                </div>
                {getSelectedUser() && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900">已选择客户</h4>
                    <p className="text-sm text-blue-700">
                      {getSelectedUser()?.username} -{" "}
                      {getSelectedUser()?.address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loan Amount Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle>贷款金额设置</CardTitle>
              <CardDescription>
                设置贷款的金额、成数和其他财务参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label
                    htmlFor="loan_amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    总金额（元） *
                  </Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={form.loan_amount || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        loan_amount: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入贷款总金额"
                    required
                    className="max-w-[240px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="to_hand_ratio"
                    className="text-sm font-medium text-gray-700"
                  >
                    到手成数
                  </Label>
                  <Input
                    id="to_hand_ratio"
                    type="number"
                    value={form.to_hand_ratio || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        to_hand_ratio: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入到手成数"
                    className="max-w-[120px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="capital"
                    className="text-sm font-medium text-gray-700"
                  >
                    本金
                  </Label>
                  <Input
                    id="capital"
                    type="number"
                    value={form.capital || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        capital: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入本金"
                    className="max-w-[240px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="interest"
                    className="text-sm font-medium text-gray-700"
                  >
                    利息
                  </Label>
                  <Input
                    id="interest"
                    type="number"
                    value={form.interest || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        interest: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入利息"
                    className="max-w-[240px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="company_cost"
                    className="text-sm font-medium text-gray-700"
                  >
                    公司实际成本 *
                  </Label>
                  <Input
                    id="company_cost"
                    type="number"
                    value={form.company_cost || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        company_cost: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入公司实际成本"
                    required
                    className="max-w-[240px] mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repayment Plan Section */}
          <Card>
            <CardHeader>
              <CardTitle>还款计划</CardTitle>
              <CardDescription>设置还款金额、期数和时间安排</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="daily_repayment"
                    className="text-sm font-medium text-gray-700"
                  >
                    每期还款金额 *
                  </Label>
                  <Input
                    id="daily_repayment"
                    type="number"
                    value={form.daily_repayment || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        daily_repayment: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入每期还款金额"
                    required
                    className="max-w-[240px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="total_periods"
                    className="text-sm font-medium text-gray-700"
                  >
                    总期数 *
                  </Label>
                  <Input
                    id="total_periods"
                    type="number"
                    value={form.total_periods || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_periods: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入总期数"
                    required
                    className="max-w-[120px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="due_start_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    开始还款日期 *
                  </Label>
                  <Input
                    id="due_start_date"
                    type="date"
                    value={form.due_start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due_start_date: e.target.value }))
                    }
                    required
                    className="max-w-[240px] mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="due_end_date"
                    className="text-sm font-medium text-gray-400"
                  >
                    结束还款日期
                  </Label>
                  <Input
                    id="due_end_date"
                    type="date"
                    value={form.due_end_date}
                    disabled
                    className="max-w-[240px] mt-1 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    系统将根据开始日期和总期数自动计算
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Assignment Section */}
          <Card>
            <CardHeader>
              <CardTitle>管理人员分配</CardTitle>
              <CardDescription>为贷款方案分配负责的管理人员</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    风控人
                  </Label>
                  <SearchableSelect
                    label=""
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
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    打款人
                  </Label>
                  <SearchableSelect
                    label=""
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
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    负责人
                  </Label>
                  <SearchableSelect
                    label=""
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
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    收款人
                  </Label>
                  <SearchableSelect
                    label=""
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Fees Section */}
          <Card>
            <CardHeader>
              <CardTitle>其他费用</CardTitle>
              <CardDescription>设置手续费等其他相关费用</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="handling_fee"
                    className="text-sm font-medium text-gray-700"
                  >
                    手续费
                  </Label>
                  <Input
                    id="handling_fee"
                    type="number"
                    value={form.handling_fee || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        handling_fee: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="请输入手续费"
                    className="max-w-[240px] mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建贷款方案"
              )}
            </Button>
          </div>
        </form>
        {/* Success Alert Dialog */}
        <AlertDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>创建成功</AlertDialogTitle>
              <AlertDialogDescription>
                贷款方案已创建。您可以复制分享链接发送给客户，或前往详情页查看。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-center flex-col gap-6">
              <AlertDialogCancel onClick={handleCopyShareLink}>
                复制链接
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleGoToDetail}>
                前往详情
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Toaster />
      </div>
    </div>
  );
}
