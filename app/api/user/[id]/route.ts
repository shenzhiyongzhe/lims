import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        phone: true,
        address: true,
        lv: true,
        createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ message: "未找到" }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    const body = await req.json();
    const { username, phone, password, address, lv } = body || {};

    const updated = await prisma.user.update({
      where: { id },
      data: { username, phone, password, address, lv },
      select: {
        id: true,
        username: true,
        phone: true,
        address: true,
        lv: true,
      },
    });
    return NextResponse.json({ message: "更新成功", data: updated });
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json({ message: "未找到" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json({ message: "手机号已存在" }, { status: 409 });
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ message: "参数错误" }, { status: 400 });

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "已删除" });
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json({ message: "未找到" }, { status: 404 });
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
