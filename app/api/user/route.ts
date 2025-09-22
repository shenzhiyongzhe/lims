import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    const where = phone
      ? {
          // 若仅支持精确匹配可用 equals: phone
          phone: { contains: phone }, // 模糊查询，可能走不到索引
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          phone: true,
          address: true,
          lv: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: { page, pageSize, total },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, phone, password, address } = body || {};

    if (!username || !phone || !password || !address) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    // 如果 phone 在模型是 @unique，冲突时会抛错
    const user = await prisma.user.create({
      data: { username, phone, password, address },
      select: {
        id: true,
        username: true,
        phone: true,
        address: true,
        lv: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "创建成功", data: user },
      { status: 201 }
    );
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
