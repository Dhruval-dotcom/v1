import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.NotificationWhereInput = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(notifications);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== "super_admin") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { content, link } = await request.json();

    if (!content || typeof content !== "string") {
      return Response.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        content,
        ...(link !== undefined && { link }),
      },
    });

    revalidatePath("/");
    revalidatePath("/manage/notifications");

    return Response.json(notification, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
