import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://secondwind.app'),
  title:        'Second Wind — Where Real Connections Begin',
  description:  'A thoughtful dating and social platform for adults 39 and older. Real conversations. Real connections. No swiping.',
  keywords:     'dating over 40, mature dating, meaningful connections, second wind, dating 39+',
  openGraph: {
    title:       'Second Wind — Where Real Connections Begin',
    description: 'Dating for adults 39+ who want real conversations and genuine connections.',
    type:        'website',
  },
};

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#1E3A2F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
