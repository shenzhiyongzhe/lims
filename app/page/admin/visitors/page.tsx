"use client";

import { useState, useEffect } from "react";
import {
  getVisitorStats,
  getTopVisitors,
  VisitorStats,
  TopVisitor,
  GetVisitorStatsParams,
  GetTopVisitorsParams,
} from "@/lib/visitors";
import VisitorSummary from "@/app/_components/VisitorSummary";
import VisitorChart from "@/app/_components/VisitorChart";
import TopVisitorsTable from "@/app/_components/TopVisitorsTable";
import DateRangeSelector, {
  DateRange,
} from "@/app/_components/DateRangeSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";

export default function VisitorStatisticsPage() {
  const [data, setData] = useState<VisitorStats[]>([]);
  const [topAdmins, setTopAdmins] = useState<TopVisitor[]>([]);
  const [topUsers, setTopUsers] = useState<TopVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    range: "last_7_days",
  });

  const fetchData = async (params: GetVisitorStatsParams = {}) => {
    setLoading(true);
    setError("");

    try {
      console.log("📊 获取访客统计数据:", params);
      const stats = await getVisitorStats(params);
      setData(stats);

      // 获取管理员排行榜
      const adminParams: GetTopVisitorsParams = {
        ...params,
        visitor_type: "admin",
        limit: 10,
      };
      const admins = await getTopVisitors(adminParams);
      setTopAdmins(admins);

      // 获取用户排行榜
      const userParams: GetTopVisitorsParams = {
        ...params,
        visitor_type: "user",
        limit: 10,
      };
      const users = await getTopVisitors(userParams);
      setTopUsers(users);

      console.log("✅ 访客统计数据获取成功:", { stats, admins, users });
    } catch (error: any) {
      console.error("❌ 获取访客统计数据失败:", error);
      setError(error.message || "获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({
      range: dateRange.range,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, []);

  const handleApplyFilter = () => {
    fetchData({
      range: dateRange.range,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  };

  const handleRefresh = () => {
    fetchData({
      range: dateRange.range,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  };

  const handleExport = () => {
    // 简单的CSV导出功能
    if (data.length === 0) return;

    const headers = [
      "日期",
      "管理员总访问量",
      "管理员唯一访客",
      "用户总访问量",
      "用户唯一访客",
    ];
    const csvContent = [
      headers.join(","),
      ...data.map((item) =>
        [
          item.date,
          item.admin_total_visits,
          item.admin_unique_visitors,
          item.user_total_visits,
          item.user_unique_visitors,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `visitor_statistics_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作按钮 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">访客统计</h1>
              <p className="text-gray-600 mt-2">
                查看管理员和用户的访问统计信息
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                刷新
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                disabled={data.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </div>

        {/* 日期范围选择器 */}
        <div className="mb-8">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            onApply={handleApplyFilter}
            loading={loading}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 数据展示 */}
        {data.length > 0 ? (
          <div className="space-y-8">
            {/* 统计概览 */}
            <VisitorSummary data={data} />

            {/* 图表和排行榜 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* 访问趋势图表 */}
              <div className="xl:col-span-2">
                <VisitorChart data={data} />
              </div>

              {/* 排行榜 */}
              <div className="space-y-6">
                <TopVisitorsTable
                  data={topAdmins}
                  title="管理员排行榜"
                  description="访问次数最多的管理员"
                  visitorType="admin"
                />
                <TopVisitorsTable
                  data={topUsers}
                  title="用户排行榜"
                  description="访问次数最多的用户"
                  visitorType="user"
                />
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                暂无数据
              </h3>
              <p className="text-gray-600">所选时间范围内没有访客统计数据</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
