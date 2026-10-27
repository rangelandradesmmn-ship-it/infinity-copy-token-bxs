import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://infinity-copy-token-bxs.vercel.app'),
  title: {
    default: 'Infinity Copy - Token BXS — Automação de Operações de Cripto',
    template: '%s | Infinity Copy - Token BXS',
  },
  description:
    'Descubra a melhor tecnologia de automação em operações de futuros de cripto e token BXS. Acesse sua página exclusiva e conheça nosso ecossistema oficial.',
  keywords: [
    'Infinity Copy',
    'Token BXS',
    'BXSignals',
    'Cripto',
    'Automação de Futuros',
    'Copy Trading',
    'Binance Smart Chain',
  ],
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
    shortcut: ['/icon.png'],
  },
  openGraph: {
    title: 'Infinity Copy - Token BXS — Automação de Operações de Cripto',
    description:
      'Descubra a melhor tecnologia de automação em operações de futuros de cripto e token BXS. Acesse sua página exclusiva e conheça nosso ecossistema oficial.',
    url: 'https://infinity-copy-token-bxs.vercel.app',
    siteName: 'Infinity Copy - Token BXS',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 800,
        height: 600,
        alt: 'Infinity Copy - Token BXS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinity Copy - Token BXS — Automação de Operações de Cripto',
    description:
      'Descubra a melhor tecnologia de automação em operações de futuros de cripto e token BXS. Acesse sua página exclusiva e conheça nosso ecossistema oficial.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-950 text-slate-100 antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
