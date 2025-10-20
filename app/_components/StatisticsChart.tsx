"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { DailyStatistic, formatAmount, formatDate } from "@/lib/statistics";

interface StatisticsChartProps {
  data: DailyStatistic[];
  title?: string;
  description?: string;
}

const chartColors = {
  payee: "#3b82f6", // Blue
  collector: "#10b981", // Green
  risk_controller: "#f59e0b", // Orange
};

export default function StatisticsChart({
  data,
  title = "收款统计趋势",
  description = "显示不同角色的每日收款金额变化",
}: StatisticsChartProps) {
  // 准备图表数据
  const chartData = data.map((item) => ({
    date: item.date,
    formattedDate: formatDate(item.date),
    payee: Number(item.payee_amount) || 0,
    collector: Number(item.collector_amount) || 0,
    risk_controller: Number(item.risk_controller_amount) || 0,
    total: Number(item.total_amount) || 0,
  }));

  // 计算最大值用于Y轴范围
  const maxAmount = Math.max(
    ...chartData.flatMap((d) => [d.payee, d.collector, d.risk_controller]),
    1000 // 确保最小值
  );

  // 调试信息
  console.log("📊 Chart data:", chartData);
  console.log("📈 Max amount:", maxAmount);

  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>暂无数据</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            payee: {
              label: "收款人",
            },
            collector: {
              label: "负责人",
            },
            risk_controller: {
              label: "风控人",
            },
          }}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
                axisLine={{ stroke: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
                axisLine={{ stroke: "#6b7280" }}
                tickFormatter={(value) => formatAmount(value)}
                domain={[0, maxAmount * 1.1]}
                allowDataOverflow={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatAmount(Number(value)),
                      name === "payee"
                        ? "收款人"
                        : name === "collector"
                        ? "负责人"
                        : "风控人",
                    ]}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              <Line
                type="monotone"
                dataKey="payee"
                stroke={chartColors.payee}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: chartColors.payee, strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="collector"
                stroke={chartColors.collector}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: chartColors.collector,
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="risk_controller"
                stroke={chartColors.risk_controller}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: chartColors.risk_controller,
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
