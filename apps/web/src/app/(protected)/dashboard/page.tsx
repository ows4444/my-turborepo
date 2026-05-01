import { redirect } from "next/navigation";

import { getUser } from "@/shared/server/auth/get-user";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return <p>dashboard page</p>;
}
