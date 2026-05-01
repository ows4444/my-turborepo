import { redirect } from "next/navigation";

import { getUser } from "@/shared/server/auth/get-user";

export default async function PublicLayout({ children }: { readonly children: React.ReactNode }) {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
