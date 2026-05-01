import { type Route } from "next";

import { type AuthFlow } from "@/shared/types/auth-flow";

export function resolvePostLoginRoute(flow: AuthFlow): Route {
  switch (flow) {
    case "2fa_required":
      return "/2fa";

    case "onboarding_required":
      return "/onboarding";

    case "authenticated":
      return "/dashboard";

    default:
      return "/login";
  }
}
