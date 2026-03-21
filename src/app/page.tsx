import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700">Notifications</h1>
          <p className="text-gray-400 mt-1">Latest updates and announcements</p>
        </div>

        {notifications.length === 0 ? (
          <div className="neu-raised p-12 text-center">
            <p className="text-gray-400 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="neu-raised p-5">
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: notification.content }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {notification.link && (
                    <a
                      href={notification.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-btn-gradient px-4 py-1.5 text-xs font-medium inline-block"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
