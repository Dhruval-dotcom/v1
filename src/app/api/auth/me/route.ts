import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role === "super_admin") {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: payload.id },
      });

      if (!superAdmin) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
      });
    }

    if (payload.role === "admin") {
      const student = await prisma.student.findUnique({
        where: { id: payload.id },
        include: { batch: true, adminRole: true },
      });

      if (!student || !student.adminRole) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: "admin",
          batchId: student.batchId,
          batchName: student.batch.name,
        },
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
