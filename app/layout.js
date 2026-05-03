import './globals.css';

export const metadata = {
  title: 'Second Wind — Dating for the Rest of Your Life',
  description: 'A meaningful dating and social platform for adults 39 and older. Real conversations. Real connections.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
