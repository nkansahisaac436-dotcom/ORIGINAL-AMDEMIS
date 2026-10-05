import type { Metadata, Viewport } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AMDEMIS - Atwima Mponua District Education MIS',
  description:
    'Atwima Mponua District Education Directorate, Planning & Statistics Unit, Ghana. Annual School Data Collection System.',
  icons: {
    icon: '/branding/coat_of_arms.png',
    apple: '/branding/coat_of_arms.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0A2A66',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={publicSans.variable}>
      <head>
        <link rel="icon" href="/branding/coat_of_arms.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
