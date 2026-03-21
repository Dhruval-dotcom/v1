"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json();
  });

interface NavbarLink {
  id: string;
  label: string;
  href: string;
  isGradePage: boolean;
  order: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  batchId?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const { data: links } = useSWR<NavbarLink[]>("/api/navbar-links", fetcher);
  const { data: meData, mutate: mutateUser } = useSWR<{ user: User }>("/api/auth/me", fetcher, {
    onError: () => {},
  });
  const user = meData?.user;

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setAdminMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "DELETE" });
    mutateUser(undefined);
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href;

  const adminLinks = [
    { label: "Notifications", href: "/manage/notifications" },
    { label: "Navbar Links", href: "/manage/navbar-links" },
    { label: "File Links", href: "/manage/file-links" },
    { label: "Batches", href: "/manage/batches" },
    { label: "Students", href: "/manage/students" },
    { label: "Add Student", href: "/manage/students/add" },
    { label: "Warning Types", href: "/manage/warning-types" },
    { label: "Issue Warning", href: "/manage/warnings/new" },
    { label: "Warnings", href: "/manage/warnings" },
  ];

  return (
    <nav className="neu-raised sticky top-0 z-50 mb-6" style={{ borderRadius: 0, borderBottom: "1px solid #e1e5ee" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] text-sm font-bold text-white">
              SP
            </div>
            <span className="text-lg font-semibold text-gray-700 hidden sm:block">Student Portal</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/") ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              }`}
            >
              Home
            </Link>

            {links?.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin dropdown */}
            {user && user.role === "super_admin" && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  Manage
                  <svg className={`w-4 h-4 transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 neu-raised p-2 z-50">
                    {adminLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(link.href) ? "bg-primary text-gray-700" : "text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin batch admin links */}
            {user && user.role === "admin" && (
              <>
                <Link
                  href="/students"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/students") ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Students
                </Link>
                <Link
                  href="/manage/warning-types"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/manage/warning-types") ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Warning Types
                </Link>
                <Link
                  href="/manage/warnings/new"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/manage/warnings/new") ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Issue Warning
                </Link>
                <Link
                  href="/manage/warnings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/manage/warnings") ? "bg-primary text-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Warnings
                </Link>
              </>
            )}
          </div>

          {/* Right side: auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{user.name}</span>
                <button onClick={handleLogout} className="neu-btn px-4 py-2 text-sm font-medium text-gray-600">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="neu-btn-gradient px-5 py-2 text-sm font-medium">
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <Link href="/" className={`block px-3 py-2 rounded-lg text-sm ${isActive("/") ? "bg-primary" : "hover:bg-gray-200"}`}>
              Home
            </Link>
            {links?.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm ${isActive(link.href) ? "bg-primary" : "hover:bg-gray-200"}`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "super_admin" && adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm ${isActive(link.href) ? "bg-primary" : "hover:bg-gray-200"}`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <>
                <Link href="/students" className={`block px-3 py-2 rounded-lg text-sm ${isActive("/students") ? "bg-primary" : "hover:bg-gray-200"}`}>
                  Students
                </Link>
                <Link href="/manage/warning-types" className={`block px-3 py-2 rounded-lg text-sm ${isActive("/manage/warning-types") ? "bg-primary" : "hover:bg-gray-200"}`}>
                  Warning Types
                </Link>
                <Link href="/manage/warnings/new" className={`block px-3 py-2 rounded-lg text-sm ${isActive("/manage/warnings/new") ? "bg-primary" : "hover:bg-gray-200"}`}>
                  Issue Warning
                </Link>
                <Link href="/manage/warnings" className={`block px-3 py-2 rounded-lg text-sm ${isActive("/manage/warnings") ? "bg-primary" : "hover:bg-gray-200"}`}>
                  Warnings
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-gray-300">
              {user ? (
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-gray-200">
                  Logout ({user.name})
                </button>
              ) : (
                <Link href="/login" className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
