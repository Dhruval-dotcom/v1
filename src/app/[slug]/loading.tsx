import Navbar from "@/components/Navbar";

export default function GradeLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-8">
          <div className="h-8 rounded bg-gray-200 animate-pulse w-36 mb-2" />
          <div className="h-4 rounded bg-gray-100 animate-pulse w-52" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-raised px-5 py-4">
              <div className="h-5 rounded bg-gray-200 animate-pulse w-3/4 mb-2" />
              <div className="h-3 rounded bg-gray-100 animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
