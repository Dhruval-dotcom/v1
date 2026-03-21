import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="neu-raised p-12 text-center max-w-md">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-6">The page you are looking for does not exist.</p>
        <Link href="/" className="neu-btn-gradient px-6 py-2.5 text-sm font-medium inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
