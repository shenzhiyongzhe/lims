export const VALID_STATUSES = [
  "pending",
  "active",
  "paid",
  "overdue",
  "overtime",
] as const;
export type RepaymentStatus = (typeof VALID_STATUSES)[number];

// 其他常用常量也可以放这里
export const COLLECTOR_ROLES = [
  "管理员",
  "财务员",
  "负责人",
  "收款人",
] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
