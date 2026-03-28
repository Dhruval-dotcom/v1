import Navbar from "@/components/Navbar";
import { CardLoader } from "@/components/Loader";

export default function HomeLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-8">
          <div className="h-8 rounded bg-gray-200 animate-pulse w-48 mb-2" />
          <div className="h-4 rounded bg-gray-100 animate-pulse w-64" />
        </div>
        <CardLoader count={4} />
      </main>
    </>
  );
}
