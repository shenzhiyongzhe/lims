"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  formatDate,
  calculateTotalAmount,
} from "@/lib/statistics";

interface StatisticsTableProps {
  data: DailyStatistic[];
  title?: string;
  description?: string;
}

export default function StatisticsTable({
  data,
  title = "每日收款明细",
  description = "显示每日各角色的收款金额和交易数量",
}: StatisticsTableProps) {
  // 计算总计
  const totals = data.reduce(
    (acc, item) => ({
      total_amount: acc.total_amount + item.total_amount,
      payee_amount: acc.payee_amount + item.payee_amount,
      collector_amount: acc.collector_amount + item.collector_amount,
      risk_controller_amount:
        acc.risk_controller_amount + item.risk_controller_amount,
      transaction_count: acc.transaction_count + item.transaction_count,
    }),
    {
      total_amount: 0,
      payee_amount: 0,
      collector_amount: 0,
      risk_controller_amount: 0,
      transaction_count: 0,
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">日期</TableHead>
                <TableHead className="text-right">总金额</TableHead>
                <TableHead className="text-right">收款人</TableHead>
                <TableHead className="text-right">负责人</TableHead>
                <TableHead className="text-right">风控人</TableHead>
                <TableHead className="text-right">交易数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((item, index) => (
                    <TableRow key={item.date}>
                      <TableCell className="font-medium">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        {formatAmount(item.payee_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatAmount(item.collector_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatAmount(item.risk_controller_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.transaction_count}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 总计行 */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="font-bold">总计</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatAmount(totals.total_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-600">
                      {formatAmount(totals.payee_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      {formatAmount(totals.collector_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-orange-600">
                      {formatAmount(totals.risk_controller_amount)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {totals.transaction_count}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
