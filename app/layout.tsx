import type { ReactNode } from "react";

export const metadata = {
  title: "Vibematch",
  description: "Vibematch authentication flow",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
