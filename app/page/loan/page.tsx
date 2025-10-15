"use client";
import { get, post } from "@/lib/http";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStatusColor, translateStatus } from "@/lib/constants";

export default function LoanSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loanId = searchParams.get("loan_id");

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loanInfo, setLoanInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editScheduleForm, setEditScheduleForm] = useState({
    due_amount: 0,
    paid_amount: 0,
    due_end_date: "",
    status: "",
  });
  const [copyToast, setCopyToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function fetchSchedules() {
    if (!loanId) {
      console.error("缺少 loan_id 参数");
      return;
    }

    setScheduleLoading(true);
    try {
      const res = await get(`/loan-accounts/${loanId}`);
      console.log("贷款详情API响应:", res);

      if (res.code === 200 && res.data) {
        setLoanInfo(res.data);
        setUserInfo(res.data.user);
        setSchedules(res.data.repaymentSchedules || []);
      } else {
        throw new Error(res.message || "获取数据失败");
      }
    } catch (error) {
      console.error("获取贷款详情失败:", error);
    } finally {
      setScheduleLoading(false);
    }
  }

  // 新增批量操作相关函数
  const generateShareLink = async () => {
    if (!loanId) return;
    const url = `${window.location.origin}/page/share-links?loan_id=${loanId}`;
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
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("复制失败");
      }
      setCopyToast({ type: "success", text: "链接已复制到剪贴板" });
    } catch (e: any) {
      setCopyToast({ type: "error", text: e?.message || "复制失败" });
    } finally {
      setTimeout(() => setCopyToast(null), 2000);
    }
  };

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
        `/repayment-schedules/${editingSchedule.id}`,
        editScheduleForm
      );
      // 刷新数据
      await fetchSchedules();
      setEditingSchedule(null);
      alert("更新成功");
    } catch (error: any) {
      alert(error.message || "更新失败");
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchSchedules();
    }
  }, [loanId]);

  // 如果没有 loan_id 参数，显示错误信息
  if (!loanId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">参数错误</h1>
            <p className="text-gray-600 mb-6">缺少必要的 loan_id 参数</p>
            <button
              onClick={() => router.push("/page/loan/list")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回贷款列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {copyToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-md text-white ${
              copyToast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {copyToast.text}
          </div>
        )}
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">贷款方案详情</h1>
              <p className="text-sm text-gray-600 mt-1">方案ID: {loanId}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              返回
            </button>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="space-y-6">
          {/* 用户信息卡片 */}
          {userInfo && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                用户信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    用户名
                  </label>
                  <p className="text-gray-900">{userInfo.username}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    手机号
                  </label>
                  <p className="text-gray-900">{userInfo.phone}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    地址
                  </label>
                  <p className="text-gray-900">{userInfo.address}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    用户等级
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      userInfo.lv === "青铜用户"
                        ? "bg-gray-100 text-gray-800"
                        : userInfo.lv === "白银用户"
                        ? "bg-gray-200 text-gray-800"
                        : userInfo.lv === "黄金用户"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {userInfo.lv}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    超时次数
                  </label>
                  <p className="text-gray-900">{userInfo.overtime}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    逾期次数
                  </label>
                  <p className="text-gray-900">{userInfo.overdue_time}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    高风险用户
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      userInfo.is_high_risk
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {userInfo.is_high_risk ? "是" : "否"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 贷款信息卡片 */}
          {loanInfo && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                贷款信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    贷款金额
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    ¥{loanInfo.loan_amount}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    本金
                  </label>
                  <p className="text-gray-900">¥{loanInfo.capital}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    利息
                  </label>
                  <p className="text-gray-900">¥{loanInfo.interest}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    手续费
                  </label>
                  <p className="text-gray-900">¥{loanInfo.handling_fee}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    总期数
                  </label>
                  <p className="text-gray-900">{loanInfo.total_periods}期</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    已还期数
                  </label>
                  <p className="text-gray-900">{loanInfo.repaid_periods}期</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    日还款额
                  </label>
                  <p className="text-gray-900">¥{loanInfo.daily_repayment}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    贷款状态
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      loanInfo.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : loanInfo.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : loanInfo.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : loanInfo.status === "overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {translateStatus(loanInfo.status)}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    风控人
                  </label>
                  <p className="text-gray-900">{loanInfo.risk_controller}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    负责人
                  </label>
                  <p className="text-gray-900">{loanInfo.collector}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    收款人
                  </label>
                  <p className="text-gray-900">{loanInfo.payee}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    打款人
                  </label>
                  <p className="text-gray-900">{loanInfo.lender}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    公司成本
                  </label>
                  <p className="text-gray-900">¥{loanInfo.company_cost}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    贷款开始日期
                  </label>
                  <p className="text-gray-900">
                    {new Date(loanInfo.due_start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    贷款结束日期
                  </label>
                  <p className="text-gray-900">
                    {new Date(loanInfo.due_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 还款计划卡片 */}
          <div className="bg-white rounded-lg shadow-sm">
            {scheduleLoading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    还款计划
                  </h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={generateShareLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      生成链接
                    </button>
                  </div>
                </div>

                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-center">期数</th>
                        <th className="px-4 py-2 text-center">应还金额</th>
                        <th className="px-4 py-2 text-center">本金</th>
                        <th className="px-4 py-2 text-center">利息</th>
                        <th className="px-4 py-2 text-center">开始日期</th>
                        <th className="px-4 py-2 text-center">截止日期</th>
                        <th className="px-4 py-2 text-center">状态</th>
                        <th className="px-4 py-2 text-center">实还金额</th>
                        <th className="px-4 py-2 text-center">还款时间</th>
                        <th className="px-4 py-2 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.length > 0 ? (
                        schedules.map((s: any) => (
                          <tr key={s.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-center font-medium">
                              {s.period}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-gray-900">
                              ¥{s.due_amount}
                            </td>
                            <td className="px-4 py-2 text-center">
                              ¥{s.capital}
                            </td>
                            <td className="px-4 py-2 text-center">
                              ¥{s.interest}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {new Date(s.due_start_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {new Date(s.due_end_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                                  s.status
                                )}`}
                              >
                                {translateStatus(s.status)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              {s.paid_amount ? `¥${s.paid_amount}` : "-"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {s.paid_at
                                ? new Date(s.paid_at).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleEditSchedule(s)}
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                              >
                                编辑
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-8 text-center text-gray-500">
                            暂无还款计划
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  className="input-base-w"
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
                  className="input-base-w"
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
                  className="input-base-w"
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
                  className="input-base-w"
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
