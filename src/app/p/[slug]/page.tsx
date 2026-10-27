'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LandingPageContent, UserWithSettings } from '@/types';
import { getPublishedLandingPage, getUserBySlug } from '@/lib/dataService';
import { LandingRenderer } from '@/components/landing/LandingRenderer';
import { Loader2, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';

function ClonedPageContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [user, setUser] = useState<UserWithSettings | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch published master template
        const { content: masterContent } = await getPublishedLandingPage();
        setContent(masterContent);

        // 2. Fetch user by unique slug
        const userData = await getUserBySlug(slug);

        if (!userData) {
          setNotFound(true);
          return;
        }

        if (userData.status === 'blocked') {
          setIsBlocked(true);
          setUser(userData);
          return;
        }

        setUser(userData);
      } catch (err) {
        console.error('Error loading cloned page:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium">Carregando página exclusiva do parceiro...</p>
      </div>
    );
  }

  // Friendly blocked screen (Requirement 6.9 & 12.7)
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Página Temporariamente Indisponível
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            A conta do parceiro associada ao link <strong>/p/{slug}</strong> está temporariamente inativa pelo administrador para verificação e manutenção de conformidade.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Acessar Página Oficial</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Friendly not found screen (Requirement 6.9)
  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Página Não Encontrada
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Não localizamos nenhum parceiro credenciado com o identificador <strong>/p/{slug}</strong>. Verifique se digitou o endereço corretamente ou acesse nossa página central.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir para a Página Principal</span>
            </Link>
            <Link
              href="/painel/cadastro"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-sm transition-colors border border-slate-700"
            >
              <span>Cadastre-se Gratuitamente no Painel</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return <LandingRenderer content={content} user={user} />;
}

export default function UserClonedLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-medium">Carregando...</p>
        </div>
      }
    >
      <ClonedPageContent />
    </Suspense>
  );
}
