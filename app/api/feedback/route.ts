import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "open" | "fixed" | null;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;

    const [total, rows] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, pageSize, total },
    });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type = "bug", reporter, contact } = body || {};
    if (!title || !content) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    }
    const created = await prisma.feedback.create({
      data: { title, content, type, reporter, contact } as any,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    // 仅管理员可更新状态
    if (auth.role !== "管理员") {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    const { id, status } = await req.json();
    if (!id || !status)
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
    const updated = await prisma.feedback.update({
      where: { id: Number(id) },
      data: { status },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
