import { NextRequest } from "next/server";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  token: string;
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const adminCookie = req.cookies.get("admin")?.value;

  if (!adminCookie) {
    return null;
  }

  try {
    return JSON.parse(adminCookie);
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
