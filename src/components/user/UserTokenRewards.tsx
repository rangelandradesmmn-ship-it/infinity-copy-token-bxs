'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserWithSettings,
  TokenRewardSettings,
  UserTokenBalance,
  TokenWithdrawalRequest,
  VideoShareRecord,
  LandingPageContent,
} from '@/types';
import {
  getUserTokenBalance,
  getUserTokenWithdrawals,
  getUserTokenShares,
  getTokenRewardSettings,
  requestTokenWithdrawal,
  getPublishedLandingPage,
} from '@/lib/dataService';
import { isValidBscWalletAddress } from '@/lib/security';
import { VideoShareModal } from '@/components/landing/VideoShareModal';
import {
  Coins,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Lock,
  Sparkles,
  ShieldCheck,
  Play,
  X,
  Clock,
} from 'lucide-react';

interface UserTokenRewardsProps {
  user: UserWithSettings;
  landingUrl: string;
}

export function UserTokenRewards({ user, landingUrl }: UserTokenRewardsProps) {
  const [balance, setBalance] = useState<UserTokenBalance>({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    currentBalance: 0,
    totalShares: 0,
    totalWithdrawn: 0,
    pendingWithdrawal: 0,
  });

  const [settings, setSettings] = useState<TokenRewardSettings>({
    tokenStock: 5000,
    minWithdrawal: 100,
    rewardPerShare: 1,
    isSharingEnabled: true,
    totalDistributed: 0,
  });

  const [withdrawals, setWithdrawals] = useState<TokenWithdrawalRequest[]>([]);
  const [shares, setShares] = useState<VideoShareRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal Modal state
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  // Video Share from Panel
  const [videos, setVideos] = useState<LandingPageContent['videosSection']['videos']>([]);
  const [selectedVideoToShare, setSelectedVideoToShare] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userBal, userWithdrawals, userShares, curSettings, publishedPage] =
        await Promise.all([
          getUserTokenBalance(user.id),
          getUserTokenWithdrawals(user.id),
          getUserTokenShares(user.id),
          getTokenRewardSettings(),
          getPublishedLandingPage(),
        ]);

      setBalance(userBal);
      setWithdrawals(userWithdrawals);
      setShares(userShares);
      setSettings(curSettings);
      if (publishedPage?.content?.videosSection?.videos) {
        setVideos(publishedPage.content.videosSection.videos);
      }
    } catch (err) {
      console.error('Erro ao carregar recompensas do usuário:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const minWithdrawal = settings.minWithdrawal || 100;
  const canWithdraw = balance.currentBalance >= minWithdrawal;
  const progressPercent = Math.min(100, Math.round((balance.currentBalance / minWithdrawal) * 100));

  const handleOpenWithdrawalModal = () => {
    setWithdrawalError('');
    setWithdrawalModalOpen(true);
  };

  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalError('');

    const trimmedWallet = walletAddress.trim();
    if (!isValidBscWalletAddress(trimmedWallet)) {
      setWithdrawalError('Endereço BEP-20 inválido. Deve começar com 0x e conter 42 caracteres hexadecimais.');
      return;
    }

    if (balance.currentBalance < minWithdrawal) {
      setWithdrawalError(`Saldo insuficiente. O valor mínimo para saque é de ${minWithdrawal} BXS.`);
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const result = await requestTokenWithdrawal({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: balance.currentBalance,
        walletAddress: trimmedWallet,
      });

      if (result.success) {
        setWithdrawalModalOpen(false);
        setWalletAddress('');
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (_) {}
        await loadData();
      } else {
        setWithdrawalError(result.error || result.message || 'Erro ao processar solicitação de saque.');
      }
    } catch (err: any) {
      setWithdrawalError(err.message || 'Erro inesperado.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2500);
  };

  const isStockDepleted = settings.tokenStock <= 0 || !settings.isSharingEnabled;

  return (
    <div className="space-y-6">
      {/* Top Banner if stock depleted */}
      {isStockDepleted && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-300 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            O estoque de novos tokens para compartilhamento está temporariamente esgotado ou em
            manutenção pela administração. Seus saldos acumulados continuam válidos e seguros para
            saque.
          </span>
        </div>
      )}

      {/* Main BXS Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Saldo de Tokens BXS
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  BNB Smart Chain
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ganhe 1 Token BXS a cada vídeo oficial compartilhado e comprovado publicamente.
              </p>
            </div>
          </div>

          {/* Action Button: Solicitar Retirada */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Atualizar saldo"
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenWithdrawalModal}
              disabled={!canWithdraw}
              className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg ${
                canWithdraw
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 cursor-pointer active:scale-95 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Solicitar Retirada</span>
              <span className="text-xs opacity-75">
                (Mín. {minWithdrawal} BXS)
              </span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {/* Card 1: Saldo Disponível */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Saldo Disponível
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-1">
              <span>{balance.currentBalance}</span>
              <span className="text-xs font-semibold text-slate-400">BXS</span>
            </div>
          </div>

          {/* Card 2: Total Ganho */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Ganho
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-baseline gap-1">
              <span>+{balance.totalShares}</span>
              <span className="text-xs font-semibold text-slate-400">BXS</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {balance.totalShares} vídeos compartilhados
            </span>
          </div>

          {/* Card 3: Total Sacado */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Sacado
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
              <span>{balance.totalWithdrawn}</span>
              <span className="text-xs font-semibold text-slate-400">BXS</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Pago na carteira BSC
            </span>
          </div>

          {/* Card 4: Saques Pendentes */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Saque em Análise
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 flex items-baseline gap-1">
              <span>{balance.pendingWithdrawal}</span>
              <span className="text-xs font-semibold text-slate-400">BXS</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Aguardando pagamento pelo Super Admin
            </span>
          </div>
        </div>

        {/* Progress Bar towards Min Withdrawal */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold">
              Progresso até o Saque Mínimo:
            </span>
            <span className="font-extrabold text-white">
              {balance.currentBalance} / {minWithdrawal} BXS ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                canWithdraw
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {!canWithdraw && (
            <p className="text-[11px] text-slate-400 mt-2">
              💡 Faltam <strong>{minWithdrawal - balance.currentBalance} tokens BXS</strong> para
              você poder solicitar sua primeira retirada. Compartilhe os vídeos abaixo para acumular!
            </p>
          )}
        </div>
      </div>

      {/* Videos available for sharing directly from Panel */}
      {videos.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Vídeos Disponíveis para Compartilhar (+1 BXS Cada)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Compartilhe nas suas redes sociais, informe a URL pública e ganhe tokens instantaneamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {vid.badge || 'Vídeo Oficial'}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      +1 BXS
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{vid.title}</h4>
                  {vid.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {vid.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVideoToShare(vid)}
                  disabled={isStockDepleted}
                  className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                    isStockDepleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isStockDepleted ? 'Esgotado' : 'Compartilhar & Ganhar'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History of Withdrawals & Hash BSC */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Histórico de Retiradas & Comprovantes BSC</span>
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe suas solicitações de saque e consulte a Hash oficial na rede BNB Smart Chain (BscScan).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Carteira BEP-20</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Hash da Transação (BSC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Você ainda não solicitou nenhuma retirada.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => {
                  const isPaid = w.status === 'paid';

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 font-black text-amber-400 text-sm">
                        {w.amount} BXS
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        <span className="truncate max-w-[150px] inline-block align-middle">
                          {w.walletAddress}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Em Análise
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isPaid && w.txHash ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://bscscan.com/tx/${w.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 underline font-semibold"
                            >
                              <span>
                                {w.txHash.slice(0, 10)}...{w.txHash.slice(-8)}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(w.txHash!)}
                              title="Copiar Hash"
                              className="p-1 text-slate-400 hover:text-white transition"
                            >
                              {copiedTx === w.txHash ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Aguardando confirmação do Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of Completed Shares */}
      {shares.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Seus Compartilhamentos Aprovados ({shares.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Vídeo</th>
                  <th className="p-3.5">Rede Social</th>
                  <th className="p-3.5">Link da Publicação</th>
                  <th className="p-3.5">Recompensa</th>
                  <th className="p-3.5 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shares.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-bold text-white max-w-[200px] truncate">
                      {s.videoTitle}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                        {s.platform}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <a
                        href={s.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 underline max-w-[220px] truncate"
                      >
                        <span>{s.postUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3.5 font-bold text-amber-400">
                      +{s.tokensAwarded} BXS
                    </td>
                    <td className="p-3.5 text-right text-slate-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Solicitar Retirada BXS</h3>
                  <p className="text-xs text-slate-400">BNB Smart Chain (BEP-20)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawalError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{withdrawalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Saldo a sacar:</span>
                  <span className="font-extrabold text-amber-400 text-sm">
                    {balance.currentBalance} BXS
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Mínimo exigido:</span>
                  <span className="font-semibold text-white">{minWithdrawal} BXS</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Rede de Envio:</span>
                  <span className="font-semibold text-emerald-400">BNB Smart Chain (BEP-20)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Endereço da sua Carteira BEP-20 (Metamask, TrustWallet, etc.)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  ⚠️ Certifique-se de informar um endereço compatível com a rede Binance Smart
                  Chain (BEP-20). O Super Admin processará o envio e anexará a Hash do BscScan.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdrawal}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {submittingWithdrawal ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Saque</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Share Modal if opened from Panel */}
      {selectedVideoToShare && (
        <VideoShareModal
          isOpen={!!selectedVideoToShare}
          onClose={() => setSelectedVideoToShare(null)}
          video={selectedVideoToShare}
          landingUrl={landingUrl}
          user={user}
          rewardSettings={settings}
          onShareCompleted={loadData}
        />
      )}
    </div>
  );
}
