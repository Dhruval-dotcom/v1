import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";

export const revalidate = 60;

export default async function GradePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if this slug matches a grade page navbar link
  const navLink = await prisma.navbarLink.findFirst({
    where: { href: `/${slug}`, isGradePage: true },
  });

  if (!navLink) {
    notFound();
  }

  // Fetch file links for this grade
  const fileLinks = await prisma.fileLink.findMany({
    where: { grade: navLink.label },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700">{navLink.label}</h1>
          <p className="text-gray-400 mt-1">Resources and materials</p>
        </div>

        {fileLinks.length === 0 ? (
          <div className="neu-raised p-12 text-center">
            <p className="text-gray-400 text-lg">No resources added yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fileLinks.map((link) => (
              <a
                key={link.id}
                href={`/file/${link.route}`}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-raised p-5 block hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 group-hover:text-[#667eea] transition-colors">
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-sm text-gray-400 mt-1">{link.description}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#667eea] mt-0.5 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
