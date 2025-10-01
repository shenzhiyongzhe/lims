"use client";
import { get, post } from "@/lib/http";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LoanSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.loan_id as string;

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editScheduleForm, setEditScheduleForm] = useState({
    due_amount: 0,
    paid_amount: 0,
    due_end_date: "",
    status: "",
  });

  // 批量选择生成链接
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<Set<number>>(
    new Set()
  );
  const [batchGenerating, setBatchGenerating] = useState(false);

  async function fetchSchedules() {
    setScheduleLoading(true);
    try {
      const res = await get(`/api/collector/schedules?loan_id=${loanId}`);
      setSchedules(res.data || []);
    } catch (error) {
      console.error("获取还款计划失败:", error);
    } finally {
      setScheduleLoading(false);
    }
  }

  // 新增批量操作相关函数
  const handleBatchModeToggle = () => {
    setBatchMode(!batchMode);
    setSelectedSchedules(new Set());
  };

  const handleScheduleSelect = (scheduleId: number) => {
    const newSelected = new Set(selectedSchedules);
    if (newSelected.has(scheduleId)) {
      newSelected.delete(scheduleId);
    } else {
      newSelected.add(scheduleId);
    }
    setSelectedSchedules(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSchedules.size === schedules.length) {
      setSelectedSchedules(new Set());
    } else {
      setSelectedSchedules(new Set(schedules.map((s: any) => s.id)));
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedSchedules.size === 0) {
      alert("请选择要生成链接的还款计划");
      return;
    }

    setBatchGenerating(true);

    try {
      const ids = Array.from(selectedSchedules);
      const share_res = await post(`/api/collector/schedules/share`, { ids });

      if (share_res.data.shareUrl) {
        try {
          await navigator.clipboard.writeText(share_res.data.shareUrl);
          alert(`已生成 ${selectedSchedules.size} 个分享链接并复制到剪贴板`);
        } catch (error) {
          // 降级方案
          const textArea = document.createElement("textarea");
          textArea.value = share_res.data.shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          alert(`已生成 ${selectedSchedules.size} 个分享链接并复制到剪贴板`);
        }
      }
      // 重置选择状态
      setSelectedSchedules(new Set());
      setBatchMode(false);
    } catch (error) {
      console.error("生成分享链接失败:", error);
      alert("生成分享链接失败");
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleBatchCancel = () => {
    setSelectedSchedules(new Set());
    setBatchMode(false);
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
        `/api/collector/schedules/${editingSchedule.id}`,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="bg-white rounded-lg shadow-sm">
          {scheduleLoading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {!batchMode ? (
                    <button
                      onClick={handleBatchModeToggle}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      生成链接
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                      >
                        {selectedSchedules.size === schedules.length
                          ? "取消全选"
                          : "全选"}
                      </button>
                      <span className="text-sm text-gray-600">
                        已选择 {selectedSchedules.size} 项
                      </span>
                    </div>
                  )}
                </div>

                {batchMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleBatchCancel}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                      disabled={batchGenerating}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleBatchGenerate}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                      disabled={batchGenerating || selectedSchedules.size === 0}
                    >
                      {batchGenerating ? "生成中..." : "确定生成"}
                    </button>
                  </div>
                )}
              </div>

              {/* 表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-center">期数</th>
                      <th className="px-4 py-2 text-center">应还金额</th>
                      <th className="px-4 py-2 text-center">截止日期</th>
                      <th className="px-4 py-2 text-center">状态</th>
                      <th className="px-4 py-2 text-center">操作</th>
                      {batchMode && (
                        <th className="px-4 py-2 text-center">生成链接</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length > 0 ? (
                      schedules.map((s: any) => (
                        <tr key={s.id} className="border-t">
                          <td className="px-4 py-2 text-center">{s.period}</td>
                          <td className="px-4 py-2 text-center">
                            ¥{s.due_amount}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {String(s.due_end_date).slice(0, 10)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                s.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : s.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : s.status === "overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {s.status === "pending"
                                ? "待还款"
                                : s.status === "paid"
                                ? "已还款"
                                : s.status === "overdue"
                                ? "逾期"
                                : s.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleEditSchedule(s)}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                            >
                              编辑
                            </button>
                          </td>
                          {batchMode && (
                            <td className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedSchedules.has(s.id)}
                                onChange={() => handleScheduleSelect(s.id)}
                                className="rounded"
                              />
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={batchMode ? 6 : 5}
                          className="px-4 py-8 text-center text-gray-500"
                        >
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
