import { useLogin } from "../api/auth.query";
import { resolveAuthFlow } from "../model/auth.flow";

export function useLoginHandler() {
  const mutation = useLogin();

  async function login(data: { identifier: string }) {
    const res = await mutation.mutateAsync(data);

    const flow = resolveAuthFlow(res.meta);

    return {
      flow,
      user: res.data.user,
    };
  }

  return {
    login,
    isLoading: mutation.isPending,
  };
}
