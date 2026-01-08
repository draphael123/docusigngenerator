"use client";

import { SessionProvider } from "next-auth/react";

export default function NewRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}





