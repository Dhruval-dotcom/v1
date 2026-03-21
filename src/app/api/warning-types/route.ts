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

const SEVERITY_ORDER = ["green", "yellow", "orange", "red", "black"];

export async function GET() {
  try {
    const user = await getUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const warningTypes = await prisma.warningType.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Sort by severity order
    warningTypes.sort((a, b) => {
      const aIdx = SEVERITY_ORDER.indexOf(a.severity);
      const bIdx = SEVERITY_ORDER.indexOf(b.severity);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.title.localeCompare(b.title);
    });

    return Response.json(warningTypes);
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

    const { title, severity, details } = await request.json();

    if (!title || !severity || !details) {
      return Response.json(
        { error: "Title, severity, and details are required" },
        { status: 400 }
      );
    }

    if (!SEVERITY_ORDER.includes(severity)) {
      return Response.json({ error: "Invalid severity" }, { status: 400 });
    }

    const warningType = await prisma.warningType.create({
      data: { title, severity, details },
    });

    revalidatePath("/manage/warning-types");
    return Response.json(warningType, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return Response.json(
        { error: "Warning type with this title already exists" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
