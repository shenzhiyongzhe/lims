import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { ManagementRoles } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role")?.trim() || "";

    const where = role
      ? {
          role: { equals: role as ManagementRoles },
        }
      : {};

    const users = await prisma.admin.findMany({
      where,
      orderBy: { id: "desc" },
    });

    return NextResponse.json({
      data: users,
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, phone, password, role } = body || {};

    if (!username || !phone || !password || !role) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    // 如果 phone 在模型是 @unique，冲突时会抛错
    const user = await prisma.admin.upsert({
      where: { phone },
      update: { username, password, role },
      create: { username, phone, password, role },
    });
    return NextResponse.json(
      { message: "保存成功", data: user },
      { status: 200 }
    );
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
