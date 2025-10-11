export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/prisma/prisma";
import { type PaymentMethod } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;
    const auth = requireAuth(req);
    const qrcode_type = data.get("qrcode_type") as string;

    console.log("Upload request data:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      qrcode_type,
      authId: auth.id,
    });

    if (!file) {
      return NextResponse.json({ message: "没有文件" }, { status: 400 });
    }

    if (!auth.id || !qrcode_type) {
      return NextResponse.json(
        {
          message: "缺少必要参数",
          details: { authId: auth.id, qrcode_type },
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: "文件过大" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 创建上传目录
    const uploadDir = join(process.cwd(), "public/uploads/payee");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 根据用户名和手机号生成文件名
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${auth.id}_${qrcode_type}_${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // 保存文件
    await writeFile(filepath, buffer);

    // 返回文件访问路径
    const fileUrl = `/uploads/payee/${filename}`;

    // 获取收款人信息
    const payee = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });

    if (!payee) {
      return NextResponse.json({ message: "收款人不存在" }, { status: 404 });
    }

    // 创建二维码记录
    const qrCode = await prisma.qrCode.create({
      data: {
        payee_id: payee.id,
        qrcode_type: qrcode_type as PaymentMethod,
        qrcode_url: fileUrl,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "上传并创建成功",
      data: {
        id: qrCode.id,
        qrcode_url: fileUrl,
        qrcode_type: qrcode_type,
        active: true,
        created_at: qrCode.created_at,
        updated_at: qrCode.updated_at,
      },
      url: fileUrl,
      filename: filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "上传失败" }, { status: 500 });
  }
}
