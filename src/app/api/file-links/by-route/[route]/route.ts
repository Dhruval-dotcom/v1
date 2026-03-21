import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ route: string }> }
) {
  try {
    const { route } = await params;

    const fileLink = await prisma.fileLink.findUnique({
      where: { route },
    });

    if (!fileLink) {
      return Response.json(
        { error: "File link not found" },
        { status: 404 }
      );
    }

    return Response.json(fileLink);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
