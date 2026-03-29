import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export const revalidate = 60;

export default async function RulesPage() {
  const sections = await prisma.ruleSection.findMany({
    orderBy: { order: "asc" },
    include: {
      rules: {
        orderBy: { order: "asc" },
      },
    },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700">Rules</h1>
          <p className="text-gray-400 mt-1">
            Guidelines and regulations for everyone
          </p>
        </div>

        {sections.length === 0 ? (
          <div className="neu-raised p-12 text-center">
            <p className="text-gray-400 text-lg">No rules posted yet</p>
          </div>
        ) : (
          <>
            {/* Section quick links */}
            <div className="neu-raised p-5 mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Sections
              </h2>
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="neu-btn px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Rules by section */}
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    {section.title}
                  </h2>
                  {section.rules.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">
                      No rules in this section yet.
                    </p>
                  ) : (
                    <ol className="space-y-3">
                      {section.rules.map((rule, index) => (
                        <li key={rule.id} className="neu-raised p-4">
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <div
                              className="prose prose-sm max-w-none text-gray-600 flex-1"
                              dangerouslySetInnerHTML={{ __html: rule.content }}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
