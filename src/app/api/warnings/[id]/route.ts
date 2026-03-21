import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { warningTypeId, details, actionPlan, date, message } =
      await request.json();

    // Check batch access for admins
    const existing = await prisma.warning.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      return Response.json({ error: "Warning not found" }, { status: 404 });
    }

    if (
      user.role === "admin" &&
      user.batchId &&
      existing.student.batchId !== user.batchId
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const warning = await prisma.warning.update({
      where: { id },
      data: {
        ...(warningTypeId && { warningTypeId }),
        ...(details && { details }),
        ...(actionPlan && { actionPlan }),
        ...(date && { date: new Date(date) }),
        ...(message !== undefined && { message }),
      },
      include: {
        warningType: true,
        student: { include: { batch: true } },
      },
    });

    revalidatePath("/manage/warnings");
    return Response.json(warning);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.warning.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      return Response.json({ error: "Warning not found" }, { status: 404 });
    }

    if (
      user.role === "admin" &&
      user.batchId &&
      existing.student.batchId !== user.batchId
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.warning.delete({ where: { id } });

    revalidatePath("/manage/warnings");
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
