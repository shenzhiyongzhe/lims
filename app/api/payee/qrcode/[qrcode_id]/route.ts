import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

type Ctx = {
  params: Promise<{ qrcode_id: string }>;
};

// 获取单个二维码详情
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const auth = requireAuth(req);
    const { qrcode_id } = await params;
    const qrcodeId = Number(qrcode_id);

    if (!Number.isInteger(qrcodeId)) {
      return NextResponse.json({ message: "参数错误" }, { status: 400 });
    }

    // 查找当前用户对应的收款人记录
    const payee = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });

    if (!payee) {
      return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
    }

    // 查找二维码记录
    const qrCode = await prisma.qrCode.findFirst({
      where: {
        qrcode_id: qrcodeId,
        payee_id: payee.payee_id, // 确保只能访问自己的二维码
      },
      select: {
        qrcode_id: true,
        qrcode_url: true,
        qrcode_type: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json({ message: "二维码不存在" }, { status: 404 });
    }

    return NextResponse.json({
      message: "获取成功",
      data: qrCode,
    });
  } catch (e: any) {
    console.error("获取二维码详情失败:", e);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

// 更新二维码信息
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const auth = requireAuth(req);
    const { qrcode_id } = await params;
    const qrcodeId = Number(qrcode_id);
    const body = await req.json();
    const { qrcode_type, qrcode_url, active } = body || {};

    if (!Number.isInteger(qrcodeId)) {
      return NextResponse.json({ message: "参数错误" }, { status: 400 });
    }

    // 查找当前用户对应的收款人记录
    const payee = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });

    if (!payee) {
      return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
    }

    // 检查二维码是否存在且属于当前用户
    const existingQrCode = await prisma.qrCode.findFirst({
      where: {
        qrcode_id: qrcodeId,
        payee_id: payee.payee_id,
      },
    });

    if (!existingQrCode) {
      return NextResponse.json({ message: "二维码不存在" }, { status: 404 });
    }

    // 准备更新数据
    const updateData: any = {
      updated_at: new Date(),
    };

    if (qrcode_type !== undefined) {
      if (!["wechat_pay", "ali_pay"].includes(qrcode_type)) {
        return NextResponse.json(
          { message: "无效的支付方式" },
          { status: 400 }
        );
      }
      updateData.qrcode_type = qrcode_type;
    }

    if (qrcode_url !== undefined) {
      updateData.qrcode_url = qrcode_url;
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // 更新二维码
    const updatedQrCode = await prisma.qrCode.update({
      where: {
        qrcode_id: qrcodeId,
      },
      data: updateData,
      select: {
        qrcode_id: true,
        qrcode_url: true,
        qrcode_type: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      message: "更新成功",
      data: updatedQrCode,
    });
  } catch (e: any) {
    console.error("更新二维码失败:", e);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

// 删除二维码
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = requireAuth(req);
    const { qrcode_id } = await params;
    const qrcodeId = Number(qrcode_id);

    if (!Number.isInteger(qrcodeId)) {
      return NextResponse.json({ message: "参数错误" }, { status: 400 });
    }

    // 查找当前用户对应的收款人记录
    const payee = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });

    if (!payee) {
      return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
    }

    // 检查二维码是否存在且属于当前用户
    const existingQrCode = await prisma.qrCode.findFirst({
      where: {
        qrcode_id: qrcodeId,
        payee_id: payee.payee_id,
      },
    });

    if (!existingQrCode) {
      return NextResponse.json({ message: "二维码不存在" }, { status: 404 });
    }

    // 删除二维码
    await prisma.qrCode.delete({
      where: {
        qrcode_id: qrcodeId,
      },
    });

    return NextResponse.json({
      message: "删除成功",
    });
  } catch (e: any) {
    console.error("删除二维码失败:", e);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
