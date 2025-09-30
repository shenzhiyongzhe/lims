import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const users = await prisma.payee.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: users,
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    const { username, phone, qrcode_type, qrcode_url } = body || {};

    if (!username || !phone || !qrcode_type || !qrcode_url) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.payee.create({
      data: {
        admin_id: auth.id,
        username,
        address: "",
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
