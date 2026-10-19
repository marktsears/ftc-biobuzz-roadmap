"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AppProvider } from "./AppProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>{children}</AppProvider>
    </SessionProvider>
  );
}
