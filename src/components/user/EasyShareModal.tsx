'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  Download,
  X,
  Sparkles,
  Send,
  ExternalLink,
} from 'lucide-react';

interface EasyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  landingUrl: string;
  userName: string;
}

export function EasyShareModal({
  isOpen,
  onClose,
  landingUrl,
  userName,
}: EasyShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const qrRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;

  const firstName = userName.split(' ')[0] || 'Parceiro';

  // 3 High-converting WhatsApp message templates
  const templates = [
    {
      title: 'Apresentação Rápida & Completa',
      description: 'Ideal para enviar para quem pediu informações gerais.',
      message: `Olá! Aqui é o(a) ${firstName}. Preparei um link oficial exclusivo com todos os vídeos demonstrativos e detalhes completos da nossa plataforma. Dá uma olhada aqui: ${landingUrl}`,
    },
    {
      title: 'Convite Direto para Cadastro',
      description: 'Perfeito para contatos prontos para dar o primeiro passo.',
      message: `Oi! Tudo bem? Estou liberando um acesso especial para você conhecer nossa oportunidade e realizar seu cadastro gratuito. Acesse minha página oficial agora: ${landingUrl}`,
    },
    {
      title: 'Tirar Dúvidas no WhatsApp',
      description: 'Focado em atendimento humanizado e suporte direto.',
      message: `Olá! Conheça nosso ecossistema oficial com treinamentos e estrutura validada: ${landingUrl}\n\nEstou disponível aqui no WhatsApp para esclarecer qualquer dúvida!`,
    },
  ];

  const currentTemplate = templates[selectedTemplateIndex];
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(currentTemplate.message)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentTemplate.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download QR Code as PNG
  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 20, 20, 260, 260);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `qrcode-${userName.toLowerCase().replace(/\s+/g, '-')}.png`;
        downloadLink.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  // Mobile Native Share
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Página Exclusiva de ${userName}`,
          text: currentTemplate.message,
          url: landingUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compartilhamento Fácil</h2>
              <p className="text-xs text-slate-400">
                Compartilhe seu link exclusivo com textos otimizados ou QR Code.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Copy Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Seu Link Exclusivo:
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-blue-400 truncate select-all">
                {landingUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: WhatsApp Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Mensagens Prontas para WhatsApp
              </span>
              <span className="text-[11px] text-slate-400">Escolha o modelo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedTemplateIndex(i)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplateIndex === i
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs block">{tpl.title}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>

            {/* Preview of chosen message */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed relative">
              <p className="whitespace-pre-wrap">{currentTemplate.message}</p>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar pelo WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Mensagem</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                title="Compartilhamento Nativo no Celular"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section: QR Code */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shrink-0 shadow-lg">
              <QRCodeSVG
                ref={qrRef}
                value={landingUrl}
                size={130}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <QrCode className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">QR Code da Sua Página</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mostre na tela do seu celular para contatos presenciais ou faça o download para usar em cartões de visita, panfletos e banners.
              </p>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Baixar Imagem do QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
