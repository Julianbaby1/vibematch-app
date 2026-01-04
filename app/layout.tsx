import type { ReactNode } from "react";

export const metadata = {
  title: "VibeMatch",
  description: "Find your vibe, meet your match.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
