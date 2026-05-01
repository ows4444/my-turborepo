import { apiClient } from "@/shared/api/client";

type LoginPayload = {
  identifier: string;
};

type LoginResponse = {
  data: {
    user: {
      id: string;
      full_name: string;
    };
  };
  meta?: {
    nextStep?: string;
  };
};

type MeResponse = {
  data: {
    user: {
      id: string;
      full_name: string;
    };
  };
};

export async function loginService(payload: LoginPayload) {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getMeService() {
  return apiClient<MeResponse>("/auth/me", {
    method: "GET",
  });
}
