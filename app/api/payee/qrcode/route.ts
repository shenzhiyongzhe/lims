import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";
import { type PaymentMethod } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const payee_id = req.nextUrl.searchParams.get("payee_id");
    let payeeId: number;
    if (!payee_id) {
      const auth = requireAuth(req);

      const payee = await prisma.payee.findFirst({
        where: {
          admin_id: auth.id,
        },
      });
      if (!payee) {
        return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
      }
      payeeId = payee.id;
    } else {
      payeeId = Number(payee_id);
    }

    const payment_method = req.nextUrl.searchParams.get("payment_method");
    const active = req.nextUrl.searchParams.get("active");
    const qrcodes = await prisma.qrCode.findMany({
      where: {
        payee_id: payeeId,
        ...(payment_method
          ? { qrcode_type: payment_method as PaymentMethod }
          : {}),
        ...(active !== null ? { active: active === "true" } : {}),
      },
      orderBy: { id: "desc" },
      select: {
        id: true,
        qrcode_url: true,
        qrcode_type: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      data: qrcodes,
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const payee = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });
    if (!payee) {
      return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
    }
    const body = await req.json();
    const { qrcode_type, qrcode_url } = body || {};

    if (!qrcode_type || !qrcode_url) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.qrCode.create({
      data: {
        payee_id: payee.id,
        qrcode_type,
        qrcode_url,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
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
