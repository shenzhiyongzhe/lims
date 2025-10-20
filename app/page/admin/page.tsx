"use client";

import { useState, useEffect } from "react";
import {
  getStatistics,
  DailyStatistic,
  GetStatisticsParams,
} from "@/lib/statistics";
import StatisticsSummary from "@/app/_components/StatisticsSummary";
import StatisticsChart from "@/app/_components/StatisticsChart";
import StatisticsTable from "@/app/_components/StatisticsTable";
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

export default function StatisticsDashboard() {
  const [data, setData] = useState<DailyStatistic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    range: "last_7_days",
  });

  const fetchData = async (params: GetStatisticsParams = {}) => {
    setLoading(true);
    setError("");

    try {
      console.log("📊 获取统计数据:", params);
      const statistics = await getStatistics(params);
      console.log("📈 统计数据:", statistics);
      setData(statistics);
    } catch (err: any) {
      console.error("❌ 获取统计数据失败:", err);
      setError(err.message || "获取统计数据失败");
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

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

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

    const headers = ["日期", "总金额", "收款人", "负责人", "风控人", "交易数"];
    const csvContent = [
      headers.join(","),
      ...data.map((item) =>
        [
          item.date,
          item.total_amount,
          item.payee_amount,
          item.collector_amount,
          item.risk_controller_amount,
          item.transaction_count,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `statistics_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">加载失败</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-600 mt-1">收款数据统计与分析</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
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

      {/* 日期范围选择器 */}
      <DateRangeSelector
        value={dateRange}
        onChange={handleDateRangeChange}
        onApply={handleApplyFilter}
        loading={loading}
      />

      {/* 统计概览 */}
      <StatisticsSummary data={data} />

      {/* 图表和表格 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 趋势图表 */}
        <div className="xl:col-span-2">
          <StatisticsChart data={data} />
        </div>

        {/* 数据表格 */}
        <div className="xl:col-span-2">
          <StatisticsTable data={data} />
        </div>
      </div>

      {/* 空状态 */}
      {!loading && data.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              暂无数据
            </h3>
            <p className="text-gray-600">所选时间范围内没有统计数据</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
