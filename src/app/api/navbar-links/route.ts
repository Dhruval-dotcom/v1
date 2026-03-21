import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const RESERVED_SLUGS = ["/login", "/manage", "/students", "/file"];

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  try {
    const links = await prisma.navbarLink.findMany({
      orderBy: { order: "asc" },
    });
    return Response.json(links);
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

    const { label, href, isGradePage, order } = await request.json();

    if (!label || !href) {
      return Response.json(
        { error: "Label and href are required" },
        { status: 400 }
      );
    }

    if (RESERVED_SLUGS.includes(href)) {
      return Response.json(
        { error: `"${href}" is a reserved path and cannot be used` },
        { status: 400 }
      );
    }

    const existing = await prisma.navbarLink.findUnique({ where: { href } });
    if (existing) {
      return Response.json(
        { error: "A navbar link with this href already exists" },
        { status: 409 }
      );
    }

    const link = await prisma.navbarLink.create({
      data: {
        label,
        href,
        isGradePage: isGradePage ?? false,
        order: order ?? 0,
      },
    });

    revalidatePath("/");

    return Response.json(link, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
