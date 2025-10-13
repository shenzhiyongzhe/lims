"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/http";

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
      const url = `/stats/collector${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await get(url);
      if (res.code !== 200) throw new Error(res?.message || "加载失败");
      setStats(res.data || { daily: [], monthly: [], yearly: [] });
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    setOverdueError("");
    try {
      const url = `/stats/overdue${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await get(url);
      if (res.code !== 200) throw new Error(res?.message || "加载失败");
      setOverdue(res.data || null);
    } catch (e: any) {
      setOverdueError(e.message || "加载失败");
    }
  };
  const fetchRisk = async () => {
    setRiskLoading(true);
    setRiskError("");
    try {
      const url = `/customers/high_risk${
        collector ? `?collector=${encodeURIComponent(collector)}` : ""
      }`;
      const res = await get(url);
      if (res.code !== 200) throw new Error(res?.message || "加载失败");
      setRiskUsers(Array.isArray(res.data) ? res.data : []);
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

  const todayTotal = stats.today_total ?? 0;

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
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            负责人收款统计
          </h2>
          <p className="mt-1 text-sm text-gray-500">点击卡片可查看趋势明细</p>
        </div>
        <div className="text-sm text-gray-700">
          负责人：
          <span className="font-semibold text-gray-900">{collector}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => openOverlay("按年统计", stats.yearly)}
          className="group text-left bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500">累计总额</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ￥{Number(totalAll).toLocaleString()}
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
            查看年趋势
          </div>
        </button>

        <button
          type="button"
          onClick={() => openOverlay("本月（按月）统计", stats.monthly)}
          className="group text-left bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500">本月收入</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ￥{Number(lastMonthTotal).toLocaleString()}
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 ring-1 ring-sky-600/20">
            查看月趋势
          </div>
        </button>

        <button
          type="button"
          onClick={() => openOverlay("今日（按日）统计", stats.daily)}
          className="group text-left bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500">今日收入</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ￥{todayTotal.toLocaleString()}
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
            查看日趋势
          </div>
        </button>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4">
          <div className="text-sm text-gray-500">手续费金额</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ￥{Number(feeTotal).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={openRisk}
          className="text-left bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500">高风险用户</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-rose-700 tabular-nums">
            {riskUsers.length}
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
            查看名单
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/page/customers/management")}
          className="text-left bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500">全部客户</div>
          <div className="mt-2 text-sm text-gray-600">进入客户管理页面</div>
        </button>
      </div>
      {overlayOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-[90%] max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="font-semibold text-gray-800">{overlayTitle}</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOverlayOpen(false)}
                aria-label="关闭"
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
                <tbody className="divide-y divide-gray-100">
                  {overlayRows.length === 0 ? (
                    <tr className="text-gray-500">
                      <td className="px-4 py-4" colSpan={2}>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    overlayRows.map((r, idx) => (
                      <tr
                        key={r.period}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-[90%] max-w-3xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="font-semibold text-gray-800">高风险用户</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setRiskOpen(false)}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {riskError && (
                <div className="bg-red-50 ring-1 ring-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
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
                  <tbody className="divide-y divide-gray-100">
                    {riskUsers.length === 0 ? (
                      <tr className="text-gray-500">
                        <td className="px-4 py-4" colSpan={5}>
                          暂无高风险用户
                        </td>
                      </tr>
                    ) : (
                      riskUsers.map((u, idx) => (
                        <tr
                          key={u.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
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
