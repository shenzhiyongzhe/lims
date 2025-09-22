export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;
    const username = data.get("username") as string;
    const phone = data.get("phone") as string;
    const qrcode_type = data.get("qrcode_type") as string;

    if (!file) {
      return NextResponse.json({ message: "没有文件" }, { status: 400 });
    }

    if (!username || !phone ||!qrcode_type) {
      return NextResponse.json(
        { message: "缺少必要参数" },
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
    const filename = `${username}_${phone}${qrcode_type}_${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // 保存文件
    await writeFile(filepath, buffer);

    // 返回文件访问路径
    const fileUrl = `/uploads/payee/${filename}`;

    return NextResponse.json({
      message: "上传成功",
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
