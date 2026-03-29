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

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== "super_admin") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { content, sectionId, order } = await request.json();

    if (!content || typeof content !== "string") {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    if (!sectionId || typeof sectionId !== "string") {
      return Response.json(
        { error: "Section is required" },
        { status: 400 }
      );
    }

    const rule = await prisma.rule.create({
      data: {
        content,
        sectionId,
        order: order ?? 0,
      },
    });

    revalidatePath("/rules");
    revalidatePath("/manage/rules");

    return Response.json(rule, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
