"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/http";
import { useRouter } from "next/navigation";

type Stats = {
  todayCollection: number;
  monthCollection: number;
  yearCollection: number;
  totalHandlingFee: number;
  todayOverdueCount: number;
  todayPaidCount: number;
  todayPendingCount: number;
  totalBorrowedUsers: number;
  settledUsers: number;
  unsettledUsers: number;
};

type RepaymentRecord = {
  id: number;
  loan_id: string;
  user_id: number;
  paid_amount: number;
  paid_at: string;
  payment_method: string;
  payee_id: number;
  order_id: string;
  user_name: string;
  user_address: string;
  repaid_periods: number;
  total_periods: number;
};

type RepaymentRecordsResponse = {
  data: RepaymentRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export default function StatsPage() {
  const router = useRouter();
  const [collector, setCollector] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [repaymentRecords, setRepaymentRecords] = useState<RepaymentRecord[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await get("/statistics");
      if (res.code !== 200) throw new Error(res?.message || "加载统计数据失败");
      setStats(res.data as Stats);
    } catch (e: any) {
      setError(e.message || "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepaymentRecords = async () => {
    const res = await get("/repayment-records");
    if (res.code !== 200) throw new Error(res?.message || "加载还款记录失败");
    const responseData = res.data as RepaymentRecordsResponse;
    setRepaymentRecords(responseData.data);
  };

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (admin) {
      setCollector(JSON.parse(admin).username);
    }
    fetchStats().catch(() => {});
    fetchRepaymentRecords().catch(() => {});
  }, []);

  const n = (v?: number) => Number(v || 0);
  const pct = (part?: number, whole?: number) => {
    const w = n(whole);
    return w > 0 ? `${((n(part) / w) * 100).toFixed(1)}%` : "0%";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            负责人收款统计
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            概览今日、本月、本年关键指标
          </p>
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

      {/* 盒子 1：收款概览 */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="text-base font-semibold text-gray-900 mb-4">
          收款概览
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="text-sm/6 opacity-90">今日收款</div>
            <div className="mt-2 text-3xl font-extrabold tabular-nums">
              ￥{n(stats?.todayCollection).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl p-4 bg-gradient-to-br from-sky-500 to-sky-600 text-white">
            <div className="text-sm/6 opacity-90">本月收款</div>
            <div className="mt-2 text-3xl font-extrabold tabular-nums">
              ￥{n(stats?.monthCollection).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="text-sm/6 opacity-90">本年收款</div>
            <div className="mt-2 text-3xl font-extrabold tabular-nums">
              ￥{n(stats?.yearCollection).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 盒子 2：今日事项 */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="text-base font-semibold text-gray-900 mb-4">
          今日事项
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() =>
              router.push("/page/repayment-schedule?status=overdue")
            }
          >
            <div className="text-sm text-gray-500">今日逾期笔数</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.todayOverdueCount).toLocaleString()}
            </div>
          </div>
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => router.push("/page/repayment-schedule?status=paid")}
          >
            <div className="text-sm text-gray-500">今日已还笔数</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.todayPaidCount).toLocaleString()}
            </div>
          </div>
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() =>
              router.push("/page/repayment-schedule?status=pending")
            }
          >
            <div className="text-sm text-gray-500">今日待还笔数</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.todayPendingCount).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 盒子 3：用户概览 */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="text-base font-semibold text-gray-900 mb-4">
          用户概览
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => router.push("/page/loan/list")}
          >
            <div className="text-sm text-gray-500">借款人数</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.totalBorrowedUsers).toLocaleString()}
            </div>
          </div>
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => router.push("/page/loan/list?status=settled")}
          >
            <div className="text-sm text-gray-500">已结清用户</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.settledUsers).toLocaleString()}
            </div>
          </div>
          <div
            className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => router.push("/page/loan/list?status=unsettled")}
          >
            <div className="text-sm text-gray-500">未结清用户</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              {n(stats?.unsettledUsers).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 盒子 4：费用与比例 */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="text-base font-semibold text-gray-900 mb-4">
          费用与比例
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200">
            <div className="text-sm text-gray-500">累计手续费</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
              ￥{n(stats?.totalHandlingFee).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      {/* 还款记录 */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="text-base font-semibold text-gray-900 mb-4">
          还款记录
        </div>
        {repaymentRecords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无还款记录</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repaymentRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-gray-200 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {record.user_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    期数: {record.repaid_periods}/{record.total_periods}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  地址: {record.user_address}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-bold text-green-600">
                    ¥{record.paid_amount.toLocaleString()}
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.payment_method === "wechat_pay"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {record.payment_method === "wechat_pay" ? "微信" : "支付宝"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(record.paid_at).toLocaleString("zh-CN")}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  订单ID: {record.order_id.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 加载骨架 */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}
