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

export async function GET() {
  try {
    const sections = await prisma.ruleSection.findMany({
      orderBy: { order: "asc" },
      include: {
        rules: {
          orderBy: { order: "asc" },
        },
      },
    });
    return Response.json(sections);
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

    const { title, order } = await request.json();

    if (!title || typeof title !== "string") {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const section = await prisma.ruleSection.create({
      data: {
        title,
        order: order ?? 0,
      },
    });

    revalidatePath("/rules");
    revalidatePath("/manage/rules");

    return Response.json(section, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
