// lib/rbac.ts
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

export type Role =
  | "管理员"
  | "财务员"
  | "风控人"
  | "负责人"
  | "收款人"
  | "打款人";

export function isAdmin(auth: AuthUser) {
  return auth.role === "管理员";
}

// 可扩展：细粒度权限表
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  管理员: ["*"],
  财务员: ["loan.read", "schedule.read"],
  风控人: ["loan.read", "schedule.read"],
  负责人: ["loan.read", "schedule.read"],
  收款人: ["loan.read", "schedule.read", "order.read"],
  打款人: ["loan.read"],
};

export function can(auth: AuthUser, perm: string) {
  const perms = ROLE_PERMISSIONS[(auth.role as Role) ?? "负责人"] || [];
  return perms.includes("*") || perms.includes(perm);
}

// 数据范围：LoanAccount
export function buildLoanWhere(
  auth: AuthUser,
  input: Prisma.LoanAccountWhereInput = {}
): Prisma.LoanAccountWhereInput {
  if (isAdmin(auth)) return input;
  const username = auth.username;

  switch (auth.role as Role) {
    case "收款人":
      return { ...input, OR: [{ collector: username }, { payee: username }] };
    case "风控人":
      return { ...input, risk_controller: username };
    case "负责人":
      return { ...input, lender: username };
    case "财务员":
    case "打款人":
      // 视业务而定，如果需要只看自己创建的可以用 created_by
      return { ...input, created_by: auth.id };
    default:
      return { ...input, created_by: auth.id };
  }
}

// 数据范围：Payee
export function buildPayeeWhere(
  auth: AuthUser,
  input: Prisma.PayeeWhereInput = {}
): Prisma.PayeeWhereInput {
  if (isAdmin(auth)) return input;
  if (auth.role === "收款人") return { ...input, username: auth.username };
  return { ...input, admin_id: auth.id };
}
