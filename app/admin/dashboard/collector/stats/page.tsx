"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Point = { period: string; total: number };
type Stats = {
  daily: Point[];
  monthly: Point[];
  yearly: Point[];
  total_all?: number;
  month_total?: number;
  today_total?: number;
  fee_total?: number;
};

type OverdueUser = {
  id: number;
  username: string;
  phone: string;
  address: string;
};
type OverdueData = {
  list: OverdueUser[];
  today_overdue: number;
  month_overdue: number;
  year_overdue: number;
};

export default function StatsPage() {
  const router = useRouter();
  const [collector, setCollector] = useState("");
  const [stats, setStats] = useState<Stats>({
    daily: [],
    monthly: [],
    yearly: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [overdue, setOverdue] = useState<OverdueData | null>(null);
  const [overdueError, setOverdueError] = useState<string>("");

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState("");
  const [overlayRows, setOverlayRows] = useState<Point[]>([]);
  const [riskOpen, setRiskOpen] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskUsers, setRiskUsers] = useState<OverdueUser[]>([]);
  const [riskError, setRiskError] = useState<string>("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const url = `/api/collector/stats${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "加载失败");
      setStats(json.data || { daily: [], monthly: [], yearly: [] });
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    setOverdueError("");
    try {
      const url = `/api/collector/overdue${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "加载失败");
      setOverdue(json.data || null);
    } catch (e: any) {
      setOverdueError(e.message || "加载失败");
    }
  };
  const fetchRisk = async () => {
    setRiskLoading(true);
    setRiskError("");
    try {
      const url = `/api/users/high_risk${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "加载失败");
      setRiskUsers(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setRiskError(e.message || "加载失败");
    } finally {
      setRiskLoading(false);
    }
  };

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (admin) {
      setCollector(JSON.parse(admin).username);
    }
    // 负责人可直接加载；管理员需先填写 collector 再点查询
    fetchStats().catch(() => {});
    fetchOverdue().catch(() => {});
    fetchRisk().catch(() => {});
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayTotal = stats.today_total ?? 0;

  const sum = (arr: Point[]) =>
    arr.reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  const last = (arr: Point[]) => (arr.length ? arr[arr.length - 1] : null);

  const lastMonthTotal = stats.month_total ?? (last(stats.monthly)?.total || 0);
  const totalAll = stats.total_all ?? 0;
  const feeTotal = stats.fee_total ?? 0;

  const openOverlay = (title: string, rows: Point[]) => {
    setOverlayTitle(title);
    setOverlayRows(rows || []);
    setOverlayOpen(true);
  };

  const openRisk = async () => {
    setRiskOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold text-gray-900">
          负责人收款统计
        </span>
        <span className="text-xl font-semibold text-gray-900">
          负责人：{collector}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-3 bg-blue-200 rounded-xl p-2">
          <div className="flex items-baseline  gap-2">
            <div
              className="font-bold text-lg cursor-pointer"
              onClick={() => openOverlay("按年统计", stats.yearly)}
            >
              累计总额:
            </div>
            <div className="text-2xl font-bold text-gray-900 whitespace-nowrap">
              ￥{Number(totalAll).toLocaleString()}
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="text-gray-500 text-sm cursor-pointer"
                onClick={() => openOverlay("本月（按月）统计", stats.monthly)}
              >
                本月收入
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ￥{Number(lastMonthTotal).toLocaleString()}
              </span>
            </div>

            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="text-gray-500 text-sm cursor-pointer"
                onClick={() => openOverlay("今日（按日）统计", stats.daily)}
              >
                今日收入
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ￥{todayTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-blue-200 rounded-xl p-2">
        <div className="text-gray-500 text-sm">手续费金额</div>
        <div className="mt-2 text-2xl font-bold text-gray-900">
          ￥{Number(feeTotal).toLocaleString()}
        </div>
      </div>
      <div
        className="flex flex-col gap-3 bg-blue-200 rounded-xl p-2"
        onClick={openRisk}
      >
        <div className="text-gray-500 text-sm">高风险用户</div>
        <div className="mt-2 text-2xl font-bold text-gray-900">
          {riskUsers.length}
        </div>
      </div>
      <div className="flex flex-col gap-3 bg-blue-200 rounded-xl p-2">
        <div
          className="text-gray-500 text-sm"
          onClick={() => router.push("/admin/dashboard/customers")}
        >
          全部客户
        </div>
      </div>
      {overlayOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-gray-800">{overlayTitle}</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOverlayOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      时间
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overlayRows.length === 0 ? (
                    <tr className="border-t text-gray-500">
                      <td className="px-4 py-4" colSpan={2}>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    overlayRows.map((r) => (
                      <tr key={r.period} className="border-t text-gray-700">
                        <td className="px-4 py-2">{r.period}</td>
                        <td className="px-4 py-2 text-right">
                          ￥{Number(r.total).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {riskOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-gray-800">高风险用户</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setRiskOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {riskError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
                  {riskError}
                </div>
              )}
              {riskLoading ? (
                <div className="text-center text-gray-600 py-8">加载中...</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        用户
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        电话
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        地址
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">
                        超时
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">
                        逾期
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskUsers.length === 0 ? (
                      <tr className="border-t text-gray-500">
                        <td className="px-4 py-4" colSpan={5}>
                          暂无高风险用户
                        </td>
                      </tr>
                    ) : (
                      riskUsers.map((u) => (
                        <tr key={u.id} className="border-t text-gray-700">
                          <td className="px-4 py-2">{u.username}</td>
                          <td className="px-4 py-2">{u.phone}</td>
                          <td className="px-4 py-2">{u.address}</td>
                          <td className="px-4 py-2 text-right">
                            {(u as any).overtime ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {(u as any).overdue_time ?? "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-gray-800">逾期概览</div>
            {overdue && (
              <div className="flex gap-4 text-sm text-gray-700">
                <span>
                  今日逾期：<b>{overdue.today_overdue}</b>
                </span>
                <span>
                  本月逾期：<b>{overdue.month_overdue}</b>
                </span>
                <span>
                  本年逾期：<b>{overdue.year_overdue}</b>
                </span>
              </div>
            )}
          </div>
          {overdueError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
              {overdueError}
            </div>
          )}
          <div className="border rounded overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    客户
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    电话
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    地址
                  </th>
                </tr>
              </thead>
              <tbody>
                {!overdue || overdue.list.length === 0 ? (
                  <tr className="border-t text-gray-500">
                    <td className="px-4 py-4" colSpan={3}>
                      暂无逾期客户
                    </td>
                  </tr>
                ) : (
                  overdue.list.map((u) => (
                    <tr key={u.id} className="border-t text-gray-700">
                      <td className="px-4 py-2">{u.username}</td>
                      <td className="px-4 py-2">{u.phone}</td>
                      <td className="px-4 py-2">{u.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
