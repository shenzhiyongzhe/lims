export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { roleZhToEn } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 20))
  );
  const skip = (page - 1) * pageSize;

  const auth = requireAuth(req);

  if (!auth) return NextResponse.json({ message: "未登录" }, { status: 403 });

  const users = await prisma.user.findMany({
    skip,
    take: pageSize,
  });

  const total = await prisma.user.count();

  return NextResponse.json({
    data: users,
    pagination: { page, pageSize, total },
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return NextResponse.json({ message: "未登录" }, { status: 403 });

    const body = await req.json();
    const {
      username,
      phone,
      address,
      password = "123456",
      lv = "青铜用户",
    } = body || {};

    if (!username || !phone || !address) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        phone,
        address,
        password, // 简化：明文；生产应加密
        lv,
      } as any,
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
