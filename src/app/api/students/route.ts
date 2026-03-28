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

    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "0");
    const paginated = page > 0 && limit > 0;

    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumbers: { has: search } },
      ];
    }

    if (!paginated) {
      const students = await prisma.student.findMany({
        where,
        include: {
          batch: true,
          adminRole: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(students);
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          batch: true,
          adminRole: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return Response.json({
      students,
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
