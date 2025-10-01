import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { Role, roleZhToEn } from "@/lib/constants";

type UserWhereInput = {
  [key: string]: any; // Replace `any` with the actual type definition if known
};

const baseWhere: Partial<UserWhereInput> = {};
const baseWhere2: Partial<UserWhereInput> = {};
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const role = auth.role as Role;
    const roleEn = roleZhToEn(role);
    if (roleEn !== "admin") {
      baseWhere[roleEn as keyof UserWhereInput] = auth.username;
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    if (status) {
      baseWhere2.status = status;
    }
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    // 查询用户，并包含符合条件的 loanAccount 和 repaymentSchedules
    const [total, users] = await Promise.all([
      // 计算符合条件的用户总数
      prisma.user.count({
        where: {
          loanAccounts: {
            some: baseWhere,
          },
        },
      }),
      // 查询用户及其 loanAccount
      prisma.user.findMany({
        where: {
          loanAccounts: {
            some: baseWhere,
          },
        },
        select: {
          id: true,
          username: true,
          phone: true,
          address: true,
          lv: true,
          loanAccounts: {
            where: baseWhere,
            include: {
              repaymentSchedules: {
                where: baseWhere2,
                orderBy: { id: "asc" },
              },
            },
            orderBy: { id: "desc" },
          },
        },
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    // 转换数据结构以匹配期望的格式
    const formattedData = users.map((user) => ({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        address: user.address,
        lv: user.lv,
      },
      loanAccount: user.loanAccounts,
    }));

    return NextResponse.json({
      data: formattedData,
      pagination: { page, pageSize, total },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
