import "./globals.css";

export const metadata = {
  title: "VibeMatch",
  description: "A playful dating app experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
