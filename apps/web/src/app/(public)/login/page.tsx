"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useLoginHandler } from "@/features/auth/hooks/use-login";
import { resolvePostLoginRoute } from "@/features/auth/model/auth.routes";
import { emitNotification } from "@/shared/notifications/model/service";

const schema = z.object({
  identifier: z.union([z.email(), z.string().regex(/^9715\d{8}$/)], {
    error: () => ({ message: "Must be a valid email or UAE phone number starting with 9715" }),
  }),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useLoginHandler();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await login({
        ...values,
      });

      const route = resolvePostLoginRoute(result.flow);

      router.replace(route);
    } catch {
      emitNotification({ type: "AUTH_LOGIN_FAILED" });
    }
  }

  const loading = isLoading || isSubmitting;

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center px-4">
      <div className="border-base bg-base shadow-base w-full max-w-md rounded-2xl border p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Username</label>

            <input
              {...register("identifier")}
              className={`rounded-base border px-3 py-2 text-sm transition outline-none ${
                errors.identifier ? "border-danger" : "border-base focus:border-primary"
              }`}
              placeholder="Enter your email or UAE phone number"
            />

            {errors.identifier && <span className="text-danger text-xs">{errors.identifier.message}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`rounded-base bg-primary mt-2 w-full py-2 text-sm font-medium text-white transition ${
              loading ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
