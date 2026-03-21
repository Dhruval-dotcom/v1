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
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let batchId = searchParams.get("batchId") || "";
    const studentId = searchParams.get("studentId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Admins can only see their own batch
    if (user.role === "admin" && user.batchId) {
      batchId = user.batchId;
    }

    if (!batchId) {
      return Response.json({ warnings: [], total: 0, page: 1, totalPages: 0 });
    }

    const where: Record<string, unknown> = {
      student: { batchId },
    };

    if (studentId) {
      where.studentId = studentId;
    }

    const [warnings, total] = await Promise.all([
      prisma.warning.findMany({
        where,
        include: {
          warningType: true,
          student: { include: { batch: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.warning.count({ where }),
    ]);

    return Response.json({
      warnings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { warningTypeId, studentId, details, actionPlan, date, message } =
      await request.json();

    if (!warningTypeId || !studentId || !details || !date) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify student exists and admin can access them
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    if (
      user.role === "admin" &&
      user.batchId &&
      student.batchId !== user.batchId
    ) {
      return Response.json(
        { error: "Cannot issue warning to student outside your batch" },
        { status: 403 }
      );
    }

    const warning = await prisma.warning.create({
      data: {
        warningTypeId,
        studentId,
        details,
        actionPlan,
        date: new Date(date),
        message: message || null,
        createdById: user.id,
        createdByRole: user.role,
      },
      include: {
        warningType: true,
        student: { include: { batch: true } },
      },
    });

    revalidatePath("/manage/warnings");
    return Response.json(warning, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
