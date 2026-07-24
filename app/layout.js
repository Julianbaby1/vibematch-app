import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://justmytype.help'),
  title:        'VibeMatch — Dating That Matches Your Real Life',
  description:  'Dating that matches your real life, not just your photos. A thoughtful dating and social platform exclusively for adults 35 and older. No endless swiping.',
  keywords:     'dating over 35, mature dating, meaningful connections, vibematch, compatibility quiz, dating 35+',
  openGraph: {
    title:       'VibeMatch — Dating That Matches Your Real Life',
    description: 'Dating that matches your real life, not just your photos. For adults 35+.',
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
