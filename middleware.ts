import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 需要保护的路径
  const protectedPaths = ["/admin/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 登录页面路径
  const loginPaths = ["/admin/login", "/user/login", "/login"];
  const isLoginPath = loginPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    // 检查是否有登录token
    const adminToken = request.cookies.get("admin")?.value;
    const userToken = request.cookies.get("user")?.value;

    if (!adminToken && !userToken) {
      // 重定向到登录页
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 如果已登录用户访问登录页，重定向到对应dashboard
  if (isLoginPath) {
    const adminToken = request.cookies.get("admin")?.value;
    const userToken = request.cookies.get("user")?.value;

    if (adminToken && pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (userToken && pathname.startsWith("/user/login")) {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/user/dashboard/:path*",
    "/admin/login",
    "/user/login",
    "/login",
  ],
};
