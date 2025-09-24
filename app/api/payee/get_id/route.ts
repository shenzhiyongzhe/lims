import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const users = await prisma.payee.findFirst({
      where: {
        admin_id: auth.id,
      },
    });

    return NextResponse.json({
      data: users,
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
