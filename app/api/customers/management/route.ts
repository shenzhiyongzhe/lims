import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    const search = searchParams.get("search")?.trim() || "";
    const where: any = {};
    if (search) {
      where.username = { contains: search };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
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
    const { username, phone, address } = body || {};

    if (!username || !phone || !address) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    // 如果 phone 在模型是 @unique，冲突时会抛错
    const user = await prisma.user.create({
      data: { username, phone, address, password: "123456" },
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
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, username, phone, password, address, lv } = body || {};
    if (!Number.isInteger(id))
      return NextResponse.json({ message: "参数错误" }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: { username, phone, password, address, lv },
      select: {
        id: true,
        username: true,
        phone: true,
        address: true,
        lv: true,
      },
    });
    return NextResponse.json({ message: "更新成功", data: updated });
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json({ message: "未找到" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await prisma.user.delete({ where: { id: 1 } });
    return NextResponse.json({ message: "已删除" });
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json({ message: "未找到" }, { status: 404 });
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
