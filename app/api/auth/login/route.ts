import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data?.username || !data?.password) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.admin.findFirst({
      where: { username: data.username },
    });
    if (!user)
      return NextResponse.json({ message: "用户不存在" }, { status: 401 });

    // 明文校验示例；若是哈希，改为 bcrypt.compare
    if (user.password !== data.password) {
      return NextResponse.json({ message: "密码错误" }, { status: 401 });
    }

    const { password, ...safe } = user as any;
    // 创建响应
    const response = NextResponse.json({
      message: "登录成功",
      data: safe,
    });
    if (user.role === "收款人") {
      const payee = await prisma.payee.findFirst({
        where: {
          username: user.username,
        },
      });
      if (payee) {
        response.cookies.set("payee_id", JSON.stringify(payee.id), {
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7天
          httpOnly: true, // 防止 XSS 攻击
          secure: process.env.NODE_ENV === "production", // 生产环境使用 HTTPS
          sameSite: "lax",
        });
      }
    }
    response.cookies.set("admin", JSON.stringify(safe), {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7天
      httpOnly: true, // 防止 XSS 攻击
      secure: process.env.NODE_ENV === "production", // 生产环境使用 HTTPS
      sameSite: "lax",
    });
    return response;
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
