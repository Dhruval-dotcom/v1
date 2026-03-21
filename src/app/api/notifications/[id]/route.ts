import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user || user.role !== "super_admin") return null;
  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { content, link } = await request.json();

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(link !== undefined && { link }),
      },
    });

    revalidatePath("/");
    revalidatePath("/manage/notifications");

    return Response.json(notification);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.notification.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/manage/notifications");

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
