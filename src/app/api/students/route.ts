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

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let batchId = searchParams.get("batchId");

    // Admin role users can only see their own batch
    if (user.role === "admin") {
      batchId = user.batchId ?? null;
    }

    const where = batchId ? { batchId } : {};

    const students = await prisma.student.findMany({
      where,
      include: {
        batch: true,
        adminRole: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(students);
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

    const { name, email, phoneNumbers, batchId } = await request.json();

    if (!name || !batchId) {
      return Response.json(
        { error: "Name and batchId are required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name,
        email: email || null,
        phoneNumbers: phoneNumbers ?? [],
        batchId,
      },
      include: {
        batch: true,
        adminRole: { select: { id: true } },
      },
    });

    revalidatePath("/manage/students");

    return Response.json(student, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
