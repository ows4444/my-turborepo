import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type AuthFlow } from "@/shared/types/auth-flow";

import { getMeService, loginService } from "../service/auth.service";

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginService,
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });

      return res;
    },
  });
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMeService,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const flow: AuthFlow = query.data?.data.user ? "authenticated" : "unauthenticated";

  return {
    user: query.data?.data.user ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.data.user,
    refetch: query.refetch,
    flow,
  };
}

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => fetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(["auth", "me"], null);
    },
  });
}
