import React from "react";

export const runtime = "nodejs";
export default function ProtectedLayout({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}
