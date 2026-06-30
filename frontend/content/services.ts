import type { Locale, ServiceCategory, ServiceGroup } from "@/lib/types";
import { getDictionary } from "@/content/i18n";

export interface ServicesData {
  wedding: {
    title: string;
    desc: string;
    note: string;
    groups: ServiceGroup[];
  };
  others: ServiceCategory[];
}

// BACKEND: replace the body to fetch the services catalogue for the locale.
export async function getServices(locale: Locale): Promise<ServicesData> {
  const { wedding, others } = getDictionary(locale).services;
  return { wedding, others };
  // LATER: return fetch(`/api/services?locale=${locale}`).then((r) => r.json());
}
