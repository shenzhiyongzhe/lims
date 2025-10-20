"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRange = {
  range: "last_7_days" | "last_30_days" | "last_90_days" | "custom";
  startDate?: string;
  endDate?: string;
};

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply: () => void;
  loading?: boolean;
}

export default function DateRangeSelector({
  value,
  onChange,
  onApply,
  loading = false,
}: DateRangeSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState(value.startDate || "");
  const [customEndDate, setCustomEndDate] = useState(value.endDate || "");

  const handleRangeChange = (newRange: string) => {
    const range = newRange as DateRange["range"];
    onChange({
      range,
      startDate: range === "custom" ? customStartDate : undefined,
      endDate: range === "custom" ? customEndDate : undefined,
    });
  };

  const handleCustomDateChange = (
    field: "startDate" | "endDate",
    date: string
  ) => {
    if (field === "startDate") {
      setCustomStartDate(date);
      onChange({
        ...value,
        startDate: date,
      });
    } else {
      setCustomEndDate(date);
      onChange({
        ...value,
        endDate: date,
      });
    }
  };

  const isCustomRange = value.range === "custom";
  const canApply = !isCustomRange || (customStartDate && customEndDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>日期范围选择</CardTitle>
        <CardDescription>选择要查看统计数据的时间范围</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="range-select">预设范围</Label>
          <Select value={value.range} onValueChange={handleRangeChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择日期范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">最近7天</SelectItem>
              <SelectItem value="last_30_days">最近30天</SelectItem>
              <SelectItem value="last_90_days">最近90天</SelectItem>
              <SelectItem value="custom">自定义范围</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCustomRange && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">开始日期</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) =>
                  handleCustomDateChange("startDate", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">结束日期</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) =>
                  handleCustomDateChange("endDate", e.target.value)
                }
              />
            </div>
          </div>
        )}

        <Button
          onClick={onApply}
          disabled={!canApply || loading}
          className="w-full"
        >
          {loading ? "加载中..." : "应用筛选"}
        </Button>
      </CardContent>
    </Card>
  );
}
