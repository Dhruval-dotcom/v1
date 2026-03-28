"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import Loader, { TableLoader } from "@/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Student {
  id: string;
  name: string;
  email: string;
  phoneNumbers: string[];
  batch: { id: string; name: string };
}

export default function StudentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect super_admin to manage page
  useEffect(() => {
    if (!authLoading && user?.role === "super_admin") {
      router.replace("/manage/students");
    }
  }, [user, authLoading, router]);

  const { data: students, error, isLoading } = useSWR<Student[]>(
    user?.role === "admin" ? "/api/students" : null,
    fetcher
  );

  // Show nothing while auth is loading or redirecting
  if (authLoading || user?.role === "super_admin") {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Loader text="Loading..." />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-gray-500 text-sm">Not authorized.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Students</h1>
          {user.batchName && (
            <p className="text-sm text-gray-500 mt-1">Batch: {user.batchName}</p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">Failed to load students.</p>}

        {isLoading ? (
          <TableLoader columns={3} rows={5} />
        ) : (
        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone Numbers</th>
                </tr>
              </thead>
              <tbody>
                {students && students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      No students found.
                    </td>
                  </tr>
                )}
                {students?.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.phoneNumbers.length > 0 ? s.phoneNumbers.map((p, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <a href={`tel:${p}`} className="text-blue-600 hover:underline">{p}</a>
                        </span>
                      )) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
