import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "退出成功" });

  // 清除 cookie
  response.cookies.set("admin", "", {
    path: "/",
    maxAge: 0, // 立即过期
  });

  return response;
}
