export const VALID_STATUSES = [
  "pending",
  "active",
  "paid",
  "overdue",
  "overtime",
] as const;

export const VALID_STATUSES_REVERSE: Record<
  string,
  keyof typeof VALID_STATUSES
> = Object.fromEntries(
  Object.entries(VALID_STATUSES).map(([en, zh]) => [zh, en])
) as any;
export const statusEnToZh = (en: keyof typeof VALID_STATUSES) =>
  VALID_STATUSES[en];
export const statusZhToEn = (zh: string) => VALID_STATUSES_REVERSE[zh];

export type RepaymentStatus = (typeof VALID_STATUSES)[number];

// 其他常用常量也可以放这里
export const ROLES = [
  "管理员",
  "财务员",
  "风控人",
  "负责人",
  "收款人",
  "打款人",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLESMAP = {
  admin: "管理员",
  accountant: "财务员",
  risk_controller: "风控人",
  collector: "负责人",
  payee: "收款人",
  lender: "打款人",
};
// 中→英（简单版：若中文重复，取“最后一个”）
export const ROLESMAP_REVERSE: Record<string, keyof typeof ROLESMAP> =
  Object.fromEntries(
    Object.entries(ROLESMAP).map(([en, zh]) => [zh, en])
  ) as any;

// 工具函数
export const roleEnToZh = (en: keyof typeof ROLESMAP) => ROLESMAP[en];
export const roleZhToEn = (zh: string) => ROLESMAP_REVERSE[zh];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PAYMENT_METHODS = ["wechat_pay", "ali_pay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BASE_URL = "http://localhost:3000";

// 多语言对照
export type Locale = "zh" | "en";

export const TRANSLATIONS = {
  status: {
    pending: { zh: "待还款", en: "pending" },
    active: { zh: "进行中", en: "active" },
    paid: { zh: "已还清", en: "paid" },
    overtime: { zh: "超时", en: "overtime" },
    overdue: { zh: "逾期", en: "overdue" },
  } as Record<RepaymentStatus | LoanAccountStatus, Record<Locale, string>>,
  paymentMethod: {
    wechat_pay: { zh: "微信支付", en: "WeChat Pay" },
    ali_pay: { zh: "支付宝", en: "Alipay" },
  } as Record<PaymentMethod, Record<Locale, string>>,
  role: {
    管理员: { zh: "管理员", en: "Admin" },
    财务员: { zh: "财务员", en: "Accountant" },
    风控人: { zh: "风控人", en: "Risk Controller" },
    负责人: { zh: "负责人", en: "Manager" },
    收款人: { zh: "收款人", en: "Collector" },
    打款人: { zh: "打款人", en: "Payer" },
  } as Record<(typeof ROLES)[number], Record<Locale, string>>,
} as const;

export function translateStatus(
  value: RepaymentStatus | LoanAccountStatus,
  locale: Locale = "zh"
) {
  return (
    TRANSLATIONS.status[value as RepaymentStatus | LoanAccountStatus]?.[
      locale
    ] ?? value
  );
}

export function translatePaymentMethod(
  value: PaymentMethod,
  locale: Locale = "zh"
) {
  return TRANSLATIONS.paymentMethod[value]?.[locale] ?? value;
}

export function translateRole(
  value: (typeof ROLES)[number],
  locale: Locale = "zh"
) {
  return TRANSLATIONS.role[value]?.[locale] ?? value;
}

const colorMap: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overtime: "bg-orange-100 text-orange-800",
  overdue: "bg-red-100 text-red-800",
  settled: "bg-green-100 text-green-800",
  unsettled: "bg-yellow-100 text-yellow-800",
  negotiated: "bg-blue-100 text-blue-800",
  to_be_processed: "bg-orange-100 text-orange-800",
  blacklist: "bg-red-100 text-red-800",
};

export const getStatusColor = (status: string) => {
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

export const LoanAccountStatus = [
  "pending",
  "active",
  "overdue",
  "settled",
  "unsettled",
  "negotiated",
  "to_be_processed",
  "blacklist",
];
export type LoanAccountStatus = (typeof LoanAccountStatus)[number];
