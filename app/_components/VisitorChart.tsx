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
import { VisitorStats, formatVisitorCount, formatDate } from "@/lib/visitors";

interface VisitorChartProps {
  data: VisitorStats[];
  title?: string;
  description?: string;
}

const chartColors = {
  admin: "#3b82f6", // Blue
  user: "#10b981", // Green
};

export default function VisitorChart({
  data,
  title = "访客统计趋势",
  description = "显示管理员和用户的每日访问量变化",
}: VisitorChartProps) {
  // 准备图表数据
  const chartData = data.map((item) => ({
    date: item.date,
    formattedDate: formatDate(item.date),
    admin: item.admin_total_visits,
    user: item.user_total_visits,
    adminUnique: item.admin_unique_visitors,
    userUnique: item.user_unique_visitors,
  }));

  // 计算最大值用于Y轴范围
  const maxVisits = Math.max(
    ...chartData.flatMap((d) => [d.admin, d.user]),
    1 // 确保最小值
  );

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
            admin: {
              label: "管理员",
            },
            user: {
              label: "用户",
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
                tickFormatter={(value) => formatVisitorCount(value)}
                domain={[0, maxVisits * 1.1]}
                allowDataOverflow={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatVisitorCount(Number(value)),
                      name === "admin" ? "管理员" : "用户",
                    ]}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              <Line
                type="monotone"
                dataKey="admin"
                stroke={chartColors.admin}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: chartColors.admin, strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="user"
                stroke={chartColors.user}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: chartColors.user,
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
