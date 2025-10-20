"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  VisitorStats,
  formatVisitorCount,
  calculateTotalVisits,
  calculateTotalUniqueVisitors,
  calculateAverageVisitsPerDay,
} from "@/lib/visitors";

interface VisitorSummaryProps {
  data: VisitorStats[];
  title?: string;
  description?: string;
}

export default function VisitorSummary({
  data,
  title = "访客统计概览",
  description = "所选时间范围内的访客统计汇总",
}: VisitorSummaryProps) {
  const totalVisits = calculateTotalVisits(data);
  const totalUniqueVisitors = calculateTotalUniqueVisitors(data);
  const averageVisitsPerDay = calculateAverageVisitsPerDay(data);
  const daysCount = data.length;

  // 计算各角色的总访问量
  const adminTotalVisits = data.reduce(
    (sum, item) => sum + item.admin_total_visits,
    0
  );
  const userTotalVisits = data.reduce(
    (sum, item) => sum + item.user_total_visits,
    0
  );

  // 计算各角色的唯一访客数
  const adminUniqueVisitors = data.reduce(
    (sum, item) => sum + item.admin_unique_visitors,
    0
  );
  const userUniqueVisitors = data.reduce(
    (sum, item) => sum + item.user_unique_visitors,
    0
  );

  const summaryCards = [
    {
      title: "总访问量",
      value: formatVisitorCount(totalVisits),
      description: `${daysCount}天累计`,
      color: "text-blue-600",
    },
    {
      title: "唯一访客数",
      value: formatVisitorCount(totalUniqueVisitors),
      description: "去重后的访客数",
      color: "text-purple-600",
    },
    {
      title: "平均每日访问量",
      value: formatVisitorCount(Math.round(averageVisitsPerDay)),
      description: daysCount > 0 ? `共${daysCount}天` : "无数据",
      color: "text-green-600",
    },
    {
      title: "管理员访问量",
      value: formatVisitorCount(adminTotalVisits),
      description: "管理员角色",
      color: "text-blue-600",
    },
    {
      title: "用户访问量",
      value: formatVisitorCount(userTotalVisits),
      description: "用户角色",
      color: "text-green-600",
    },
    {
      title: "管理员唯一访客",
      value: formatVisitorCount(adminUniqueVisitors),
      description: "去重后管理员数",
      color: "text-blue-600",
    },
    {
      title: "用户唯一访客",
      value: formatVisitorCount(userUniqueVisitors),
      description: "去重后用户数",
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
