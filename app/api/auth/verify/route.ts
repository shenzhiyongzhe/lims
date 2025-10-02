import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 使用现有的 requireAuth 函数验证 token
    const auth = requireAuth(req);

    // 如果验证成功，返回用户信息
    const admin = await prisma.admin.findFirst({
      where: { username: auth.username },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "用户不存在", valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "验证成功",
      valid: true,
      data: admin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "验证失败", valid: false },
      { status: 401 }
    );
  }
}
