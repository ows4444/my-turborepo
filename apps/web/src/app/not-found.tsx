import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">404 - Not Found</h1>

      <Link href="/" className="text-blue-600 underline">
        Go back home
      </Link>
    </div>
  );
}
