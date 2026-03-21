import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user || user.role !== "super_admin") return null;
  return user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return Response.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);

    const adminRole = await prisma.adminRole.upsert({
      where: { studentId: id },
      update: { password: hashed },
      create: { studentId: id, password: hashed },
    });

    revalidatePath("/");
    revalidatePath("/manage/students");

    return Response.json(adminRole, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
