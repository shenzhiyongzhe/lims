import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const users = await prisma.payee.findMany({
      orderBy: { payee_id: "desc" },
      select: {
        payee_id: true,
        username: true,
        admin_id: true,
        address: true,
        payment_limit: true,
        qrcode_number: true,
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
    const { admin_id, username, address, payment_limit, qrcode_number } =
      body || {};

    if (
      !admin_id ||
      !username ||
      !address ||
      !payment_limit ||
      !qrcode_number
    ) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.payee.create({
      data: {
        admin_id,
        username,
        address,
        payment_limit,
        qrcode_number,
      } as any,
    });

    return NextResponse.json(
      { message: "创建成功", data: user },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
