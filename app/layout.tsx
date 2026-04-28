import type { ReactNode } from "react";

export const metadata = {
  title: "Vibematch",
  description: "Chat with the Vibematch community.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#0b0b0f", color: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
