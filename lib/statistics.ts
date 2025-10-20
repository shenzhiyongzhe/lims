import { get, post } from "./http";

export interface DailyStatistic {
  date: string;
  total_amount: number;
  payee_amount: number;
  collector_amount: number;
  risk_controller_amount: number;
  transaction_count: number;
}

export interface StatisticsResponse {
  code: number;
  data: DailyStatistic[];
  message: string;
}

export interface GetStatisticsParams {
  range?: "last_7_days" | "last_30_days" | "last_90_days" | "custom";
  startDate?: string;
  endDate?: string;
}

export const getStatistics = async (
  params: GetStatisticsParams = {}
): Promise<DailyStatistic[]> => {
  const { range = "last_7_days", startDate, endDate } = params;

  const queryParams: Record<string, string> = { range };
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const response = await get<StatisticsResponse>("/statistics", {
    params: queryParams,
  });

  if (response.code !== 200) {
    throw new Error(response.message || "获取统计数据失败");
  }

  return response.data;
};

export const calculateStatistics = async (date: string): Promise<void> => {
  const response = await post("/statistics/calculate", { date });

  if (response.code !== 200) {
    throw new Error(response.message || "计算统计数据失败");
  }
};

export const calculateStatisticsRange = async (
  startDate: string,
  endDate: string
): Promise<void> => {
  const response = await post("/statistics/calculate-range", {
    startDate,
    endDate,
  });

  if (response.code !== 200) {
    throw new Error(response.message || "批量计算统计数据失败");
  }
};

// 格式化金额显示
export const formatAmount = (amount: number): string => {
  return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;
};

// 格式化日期显示
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

// 计算总金额
export const calculateTotalAmount = (statistics: DailyStatistic[]): number => {
  return statistics.reduce((sum, stat) => sum + stat.total_amount, 0);
};

// 计算平均每日金额
export const calculateAverageAmount = (
  statistics: DailyStatistic[]
): number => {
  if (statistics.length === 0) return 0;
  return calculateTotalAmount(statistics) / statistics.length;
};
