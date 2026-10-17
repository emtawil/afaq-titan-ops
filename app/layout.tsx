import './globals.css';
export const metadata = { title: 'منصة القيادة والمراقبة — آفاق تيتان' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="./fonts/fonts.css" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:" />
      </head>
      <body>{children}</body>
    </html>
  );
}
