"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DailyStatistic,
  formatAmount,
  calculateTotalAmount,
  calculateAverageAmount,
} from "@/lib/statistics";

interface StatisticsSummaryProps {
  data: DailyStatistic[];
  title?: string;
  description?: string;
}

export default function StatisticsSummary({
  data,
  title = "统计概览",
  description = "所选时间范围内的收款统计汇总",
}: StatisticsSummaryProps) {
  const totalAmount = calculateTotalAmount(data);
  const averageAmount = calculateAverageAmount(data);
  const totalTransactions = data.reduce(
    (sum, item) => sum + item.transaction_count,
    0
  );
  const daysCount = data.length;

  // 计算各角色的总金额
  const payeeTotal = data.reduce((sum, item) => sum + item.payee_amount, 0);
  const collectorTotal = data.reduce(
    (sum, item) => sum + item.collector_amount,
    0
  );
  const riskControllerTotal = data.reduce(
    (sum, item) => sum + item.risk_controller_amount,
    0
  );

  const summaryCards = [
    {
      title: "总收款金额",
      value: formatAmount(totalAmount),
      description: `${daysCount}天累计`,
      color: "text-blue-600",
    },
    {
      title: "平均每日金额",
      value: formatAmount(averageAmount),
      description: daysCount > 0 ? `共${daysCount}天` : "无数据",
      color: "text-green-600",
    },
    {
      title: "总交易笔数",
      value: totalTransactions.toLocaleString(),
      description: "所有交易",
      color: "text-purple-600",
    },
    {
      title: "收款人金额",
      value: formatAmount(payeeTotal),
      description: "收款人角色",
      color: "text-blue-600",
    },
    {
      title: "负责人金额",
      value: formatAmount(collectorTotal),
      description: "负责人角色",
      color: "text-green-600",
    },
    {
      title: "风控人金额",
      value: formatAmount(riskControllerTotal),
      description: "风控人角色",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
