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
import { TopVisitor, formatVisitorCount } from "@/lib/visitors";

interface TopVisitorsTableProps {
  data: TopVisitor[];
  title?: string;
  description?: string;
  visitorType?: "admin" | "user" | "all";
}

export default function TopVisitorsTable({
  data,
  title = "访问排行榜",
  description = "显示访问次数最多的用户",
  visitorType = "all",
}: TopVisitorsTableProps) {
  const getRoleLabel = (type: string) => {
    switch (type) {
      case "admin":
        return "管理员";
      case "user":
        return "用户";
      default:
        return "未知";
    }
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case "admin":
        return "text-blue-600";
      case "user":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

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
                <TableHead className="w-[50px]">排名</TableHead>
                <TableHead>用户名称</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-right">访问次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                data.map((visitor, index) => (
                  <TableRow
                    key={`${visitor.visitor_type}-${visitor.visitor_id}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className="text-lg">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {visitor.visitor_name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getRoleColor(
                          visitor.visitor_type
                        )}`}
                      >
                        {getRoleLabel(visitor.visitor_type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatVisitorCount(visitor.visit_count)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
