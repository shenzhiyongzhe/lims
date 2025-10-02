import { NextRequest } from "next/server";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  token: string;
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  // 优先从 Authorization header 读取
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const user = JSON.parse(atob(token)); // 简单的 base64 解码
      return user;
    } catch (e) {
      console.error("Failed to parse auth header:", e);
    }
  }

  // 备用：从 cookie 读取
  const adminCookie = req.cookies.get("admin")?.value;
  if (adminCookie) {
    try {
      return JSON.parse(adminCookie);
    } catch (e) {
      console.error("Failed to parse admin cookie:", e);
    }
  }

  return null;
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error("未登录");
  }
  return user;
}
