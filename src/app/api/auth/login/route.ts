import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { comparePassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check SuperAdmin first
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const valid = await comparePassword(password, superAdmin.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = await signToken({ id: superAdmin.id, role: "super_admin" });

      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return NextResponse.json({
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
      });
    }

    // Check Student with adminRole
    const student = await prisma.student.findUnique({
      where: { email },
      include: { adminRole: true },
    });

    if (student && student.adminRole) {
      const valid = await comparePassword(password, student.adminRole.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = await signToken({
        id: student.id,
        role: "admin",
        batchId: student.batchId,
      });

      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return NextResponse.json({
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: "admin",
          batchId: student.batchId,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
