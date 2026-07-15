"use client";

import { LocaleProvider } from "@/lib/i18n";
import { UIProvider } from "@/lib/ui";
import { ConsentProvider } from "@/lib/consent";
import Toaster from "@/components/ui/Toaster";
import ConsentBanner from "@/components/ui/ConsentBanner";
import PolicyModal from "@/components/ui/PolicyModal";

/** Client provider tree wrapping the whole app (mounted from the root layout). */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <UIProvider>
        <ConsentProvider>
          {children}
          {/* Global transient notifications (needs the locale context above). */}
          <Toaster />
          {/* GDPR-style consent banner + shared privacy/cookie policy modal. */}
          <ConsentBanner />
          <PolicyModal />
        </ConsentProvider>
      </UIProvider>
    </LocaleProvider>
  );
}
