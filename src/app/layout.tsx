import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextScale Pro — Plataforma de Landing Pages Personalizadas',
  description:
    'SaaS de criação, distribuição e sincronização de landing pages clonadas com personalização exclusiva para parceiros.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
