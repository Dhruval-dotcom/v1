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
    const { title, description, route, url, grade } = await request.json();

    const fileLink = await prisma.fileLink.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(route !== undefined && { route }),
        ...(url !== undefined && { url }),
        ...(grade !== undefined && { grade }),
      },
    });

    revalidatePath("/");
    if (fileLink.grade) {
      revalidatePath(`/${fileLink.grade}`);
    }

    return Response.json(fileLink);
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

    const fileLink = await prisma.fileLink.delete({ where: { id } });

    revalidatePath("/");
    if (fileLink.grade) {
      revalidatePath(`/${fileLink.grade}`);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
