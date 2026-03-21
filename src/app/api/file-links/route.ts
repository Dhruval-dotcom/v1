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
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");

    const where = grade ? { grade } : {};

    const fileLinks = await prisma.fileLink.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(fileLinks);
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

    const { title, description, route, url, grade } = await request.json();

    if (!title || !route || !url) {
      return Response.json(
        { error: "Title, route, and url are required" },
        { status: 400 }
      );
    }

    // Check route uniqueness
    const existing = await prisma.fileLink.findUnique({ where: { route } });
    if (existing) {
      return Response.json(
        { error: "A file link with this route already exists" },
        { status: 409 }
      );
    }

    const fileLink = await prisma.fileLink.create({
      data: {
        title,
        route,
        url,
        ...(description !== undefined && { description }),
        ...(grade !== undefined && { grade }),
      },
    });

    revalidatePath("/");
    if (grade) {
      revalidatePath(`/${grade}`);
    }

    return Response.json(fileLink, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
