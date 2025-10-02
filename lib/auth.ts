import { NextRequest } from "next/server";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  token: string;
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const adminCookie = req.cookies.get("admin")?.value;

  // 添加调试日志
  console.log("All cookies:", req.cookies.getAll());
  console.log("Admin cookie value:", adminCookie);

  if (!adminCookie) {
    console.log("No admin cookie found");
    return null;
  }

  try {
    const user = JSON.parse(adminCookie);
    console.log("Parsed user:", user);
    return user;
  } catch (e) {
    console.error("Failed to parse admin cookie:", e);
    return null;
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error("未登录");
  }
  return user;
}
