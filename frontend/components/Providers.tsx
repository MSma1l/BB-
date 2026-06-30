"use client";

import { LocaleProvider } from "@/lib/i18n";
import { UIProvider } from "@/lib/ui";

/** Client provider tree wrapping the whole app (mounted from the root layout). */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <UIProvider>{children}</UIProvider>
    </LocaleProvider>
  );
}
