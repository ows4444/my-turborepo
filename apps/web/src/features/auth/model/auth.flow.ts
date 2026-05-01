import { type AuthFlow } from "@/shared/types/auth-flow";

export function resolveAuthFlow(meta?: { nextStep?: string }): AuthFlow {
  switch (meta?.nextStep) {
    case "2fa_required":
      return "2fa_required";
    case "onboarding_required":
      return "onboarding_required";
    case "authenticated":
      return "authenticated";
    default:
      return "unauthenticated";
  }
}
