import type { Metadata } from "next";

// Keep the admin route out of search engines.
export const metadata: Metadata = {
  title: "Admin · Balloons Breeze",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
