import { redirect } from "next/navigation";

import type { PropsWithChildren } from "react";

import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return <>{children}</>;
}
