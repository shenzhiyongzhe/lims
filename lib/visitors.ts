import { get, post } from "./http";

export interface VisitorLog {
  visitor_type: "admin" | "user";
  visitor_id: number;
  action_type: "login" | "page_view" | "submit_order";
  page_url?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface VisitorStats {
  date: string;
  admin_total_visits: number;
  admin_unique_visitors: number;
  user_total_visits: number;
  user_unique_visitors: number;
}

export interface TopVisitor {
  visitor_id: number;
  visitor_name: string;
  visitor_type: string;
  visit_count: number;
}

export interface VisitorStatsResponse {
  code: number;
  data: VisitorStats[];
  message: string;
}

export interface TopVisitorsResponse {
  code: number;
  data: TopVisitor[];
  message: string;
}

export interface GetVisitorStatsParams {
  range?: "last_7_days" | "last_30_days" | "last_90_days" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface GetTopVisitorsParams {
  startDate?: string;
  endDate?: string;
  visitor_type?: "admin" | "user";
  limit?: number;
}

export const logVisit = async (data: VisitorLog): Promise<void> => {
  const response = await post("/visitors/log", data);

  if (response.code !== 200) {
    throw new Error(response.message || "Failed to log visitor activity");
  }
};

export const getVisitorStats = async (
  params: GetVisitorStatsParams = {}
): Promise<VisitorStats[]> => {
  const { range = "last_7_days", startDate, endDate } = params;

  const queryParams: Record<string, string> = { range };
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const response = await get<VisitorStatsResponse>("/visitors/stats", {
    params: queryParams,
  });

  if (response.code !== 200) {
    throw new Error(response.message || "Failed to get visitor statistics");
  }

  return response.data;
};

export const getTopVisitors = async (
  params: GetTopVisitorsParams = {}
): Promise<TopVisitor[]> => {
  const queryParams: Record<string, string> = {};
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (params.visitor_type) queryParams.visitor_type = params.visitor_type;
  if (params.limit) queryParams.limit = params.limit.toString();

  const response = await get<TopVisitorsResponse>("/visitors/top", {
    params: queryParams,
  });

  if (response.code !== 200) {
    throw new Error(response.message || "Failed to get top visitors");
  }

  return response.data;
};

export const calculateVisitorStats = async (date: string): Promise<void> => {
  const response = await post("/visitors/calculate", { date });

  if (response.code !== 200) {
    throw new Error(
      response.message || "Failed to calculate visitor statistics"
    );
  }
};

export const calculateVisitorStatsRange = async (
  startDate: string,
  endDate: string
): Promise<void> => {
  const response = await post("/visitors/calculate-range", {
    startDate,
    endDate,
  });

  if (response.code !== 200) {
    throw new Error(
      response.message || "Failed to calculate visitor statistics range"
    );
  }
};

// Helper functions for formatting
export const formatVisitorCount = (count: number): string => {
  return count.toLocaleString("zh-CN");
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

export const calculateTotalVisits = (stats: VisitorStats[]): number => {
  return stats.reduce(
    (sum, stat) => sum + stat.admin_total_visits + stat.user_total_visits,
    0
  );
};

export const calculateTotalUniqueVisitors = (stats: VisitorStats[]): number => {
  return stats.reduce(
    (sum, stat) => sum + stat.admin_unique_visitors + stat.user_unique_visitors,
    0
  );
};

export const calculateAverageVisitsPerDay = (stats: VisitorStats[]): number => {
  if (stats.length === 0) return 0;
  return calculateTotalVisits(stats) / stats.length;
};
