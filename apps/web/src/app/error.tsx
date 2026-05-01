"use client";

import { useRouter } from "next/navigation";

import { useEffect } from "react";

import { normalizeError } from "@/shared/core/errors/normalize";
import { appLogger } from "@/shared/infra/logger/with-context.client";

export default function ErrorBoundary({ error }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const router = useRouter();

  useEffect(() => {
    appLogger.error("App Error", { error: normalizeError(error) });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>

      <button
        onClick={() => {
          router.refresh();
        }}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
