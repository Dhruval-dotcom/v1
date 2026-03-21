import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

export default async function FileRedirectPage({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;

  const fileLink = await prisma.fileLink.findUnique({
    where: { route },
  });

  if (!fileLink) {
    notFound();
  }

  redirect(fileLink.url);
}
