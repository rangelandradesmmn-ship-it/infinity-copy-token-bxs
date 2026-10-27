'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

interface TokenChartSectionProps {
  tokenSection?: {
    enabled: boolean;
    badge?: string;
    title: string;
    subtitle: string;
    tokenSymbol: string;
    tokenName: string;
    network: string;
    contractAddress: string;
    copyButtonText: string;
    chartProvider?: 'geckoterminal' | 'dexscreener' | 'custom';
    embedUrl: string;
    coinMarketCapUrl: string;
    bscScanUrl?: string;
  };
  primaryColor?: string;
}

export function TokenChartSection({
  tokenSection,
  primaryColor = '#2563eb',
}: TokenChartSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'geckoterminal' | 'dexscreener'>('geckoterminal');

  if (!tokenSection || tokenSection.enabled === false) {
    return null;
  }

  const contractAddress = tokenSection.contractAddress || '0xadcea94f46ce8a87b890d7da9a444b4a21811a76';
  const copyButtonText = tokenSection.copyButtonText || 'copie o contrato da BXS';
  const cmcUrl = tokenSection.coinMarketCapUrl || 'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/';
  const bscScanUrl = tokenSection.bscScanUrl || `https://bscscan.com/token/${contractAddress}`;

  // Embed URLs for BSC pair
  const geckoUrl = 'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0';
  const dexscreenerUrl = 'https://dexscreener.com/bsc/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&theme=dark&trades=0&info=0';

  const currentEmbedUrl = activeTab === 'geckoterminal' ? geckoUrl : dexscreenerUrl;

  const handleCopyContract = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(contractAddress);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = contractAddress;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar contrato:', err);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-slate-950 text-white border-t border-slate-900 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-15 pointer-events-none"
        style={{ background: primaryColor }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl sm:max-w-5xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-semibold mb-4 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              {tokenSection.badge
                ? tokenSection.badge.replace(/^🟢\s*/, '')
                : 'Gráfico em Tempo Real'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            {tokenSection.title || 'Acompanhe a Cotação do Token BXS'}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
            {tokenSection.subtitle ||
              'Monitoramento ao vivo de preço, volume e liquidez descentralizada na rede BNB Smart Chain (BSC).'}
          </p>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Par: <strong>BXS / USDT</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Rede: <strong>BNB Smart Chain (BSC)</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              DEX: <strong>PancakeSwap V3</strong>
            </span>
          </div>
        </div>

        {/* Real-Time Chart Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 backdrop-blur-sm">
          {/* Chart Controls Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Visualização:
              </span>
              <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('geckoterminal')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === 'geckoterminal'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GeckoTerminal (TradingView)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('dexscreener')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === 'dexscreener'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  DexScreener
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={cmcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-colors"
              >
                <span>Ver no CoinMarketCap DEX</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={bscScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <span>BSCScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Iframe Real-Time Chart */}
          <div className="relative w-full h-[540px] sm:h-[620px] bg-slate-950">
            <iframe
              src={currentEmbedUrl}
              title="Gráfico em Tempo Real Token BXS"
              className="w-full h-full border-0"
              allow="clipboard-write"
              loading="lazy"
            />
          </div>
        </div>

        {/* Action Area: Copy Contract Button */}
        <div className="mt-8 max-w-3xl mx-auto text-center space-y-4">
          {/* Main Requested Copy Button */}
          <div>
            <button
              type="button"
              onClick={handleCopyContract}
              className={`w-full sm:w-auto min-w-[320px] px-8 py-4 rounded-2xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                copied
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 ring-2 ring-blue-400/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>✓ Contrato BXS Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="uppercase">{copyButtonText}</span>
                </>
              )}
            </button>
          </div>

          {/* Contract Address Display Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden text-left w-full sm:w-auto">
              <span className="text-slate-400 shrink-0 font-medium">Contrato BSC:</span>
              <code className="text-emerald-400 font-mono font-semibold truncate select-all px-2 py-1 bg-slate-950 rounded-lg border border-slate-800/80">
                {contractAddress}
              </code>
            </div>

            <button
              type="button"
              onClick={handleCopyContract}
              className="w-full sm:w-auto shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Adicione o token BXS à sua carteira (MetaMask, Trust Wallet) ou negocie diretamente na PancakeSwap utilizando o contrato oficial acima.
          </p>
        </div>
      </div>
    </section>
  );
}
