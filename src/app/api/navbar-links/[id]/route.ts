import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const RESERVED_SLUGS = ["/login", "/manage", "/students", "/file"];

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
    const { label, href, isGradePage, order } = await request.json();

    if (href && RESERVED_SLUGS.includes(href)) {
      return Response.json(
        { error: `"${href}" is a reserved path and cannot be used` },
        { status: 400 }
      );
    }

    const link = await prisma.navbarLink.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(href !== undefined && { href }),
        ...(isGradePage !== undefined && { isGradePage }),
        ...(order !== undefined && { order }),
      },
    });

    revalidatePath("/");

    return Response.json(link);
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

    await prisma.navbarLink.delete({ where: { id } });

    revalidatePath("/");

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
