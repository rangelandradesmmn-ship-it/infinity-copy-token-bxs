'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TokenRewardSettings,
  UserTokenBalance,
  TokenWithdrawalRequest,
  VideoShareRecord,
} from '@/types';
import {
  getTokenRewardSettings,
  updateTokenRewardSettings,
  getAllUsersTokenBalances,
  getAllTokenWithdrawals,
  payTokenWithdrawal,
  getAllTokenShares,
} from '@/lib/dataService';
import {
  Coins,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Search,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Share2,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';

export function AdminTokenRewards() {
  const [settings, setSettings] = useState<TokenRewardSettings>({
    tokenStock: 5000,
    minWithdrawal: 100,
    rewardPerShare: 1,
    isSharingEnabled: true,
    totalDistributed: 0,
  });

  const [balances, setBalances] = useState<UserTokenBalance[]>([]);
  const [withdrawals, setWithdrawals] = useState<TokenWithdrawalRequest[]>([]);
  const [shares, setShares] = useState<VideoShareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'balances' | 'shares'>('withdrawals');

  // Input states for settings
  const [stockInput, setStockInput] = useState('5000');
  const [minWithdrawalInput, setMinWithdrawalInput] = useState('100');
  const [rewardPerShareInput, setRewardPerShareInput] = useState('1');
  const [sharingEnabledInput, setSharingEnabledInput] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'paid'>('pending');

  // Tx Hash inputs for each pending withdrawal
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [payingId, setPayingId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [currentSettings, userBalances, allWithdrawals, allShares] = await Promise.all([
        getTokenRewardSettings(),
        getAllUsersTokenBalances(),
        getAllTokenWithdrawals(),
        getAllTokenShares(),
      ]);

      setSettings(currentSettings);
      setStockInput(String(currentSettings.tokenStock));
      setMinWithdrawalInput(String(currentSettings.minWithdrawal));
      setRewardPerShareInput(String(currentSettings.rewardPerShare));
      setSharingEnabledInput(currentSettings.isSharingEnabled);

      setBalances(userBalances);
      setWithdrawals(allWithdrawals);
      setShares(allShares);
    } catch (err) {
      console.error('Erro ao carregar dados de recompensas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);

    const newStock = Math.max(0, parseInt(stockInput, 10) || 0);
    const newMin = Math.max(1, parseInt(minWithdrawalInput, 10) || 100);
    const newReward = Math.max(1, parseInt(rewardPerShareInput, 10) || 1);

    const updated = await updateTokenRewardSettings({
      tokenStock: newStock,
      minWithdrawal: newMin,
      rewardPerShare: newReward,
      isSharingEnabled: newStock > 0 ? sharingEnabledInput : false,
    });

    setSettings(updated);
    setStockInput(String(updated.tokenStock));
    setMinWithdrawalInput(String(updated.minWithdrawal));
    setRewardPerShareInput(String(updated.rewardPerShare));
    setSharingEnabledInput(updated.isSharingEnabled);

    setSavingSettings(false);
    setFeedback({
      type: 'success',
      message: 'Configurações de Token BXS salvas com sucesso!',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePayWithdrawal = async (withdrawalId: string) => {
    const txHash = txHashes[withdrawalId]?.trim();
    if (!txHash) {
      alert('Por favor, insira a Hash da transação (TxID) antes de confirmar o pagamento.');
      return;
    }

    if (!confirm('Deseja confirmar o pagamento deste saque? O valor será descontado do estoque de tokens BXS e a Hash ficará visível ao usuário.')) {
      return;
    }

    setPayingId(withdrawalId);
    setFeedback(null);

    try {
      const result = await payTokenWithdrawal(withdrawalId, txHash, 'Super Admin');
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Saque pago com sucesso! ${result.stockDepleted ? 'ATENÇÃO: O estoque zerou e os compartilhamentos foram travados automaticamente.' : ''}`,
        });
        // Clear input for this withdrawal
        setTxHashes((prev) => {
          const next = { ...prev };
          delete next[withdrawalId];
          return next;
        });
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Erro ao processar pagamento.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro inesperado ao pagar.',
      });
    } finally {
      setPayingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2500);
  };

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesFilter =
      withdrawalFilter === 'all'
        ? true
        : withdrawalFilter === 'pending'
        ? w.status === 'pending'
        : w.status === 'paid';

    const matchesSearch =
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.txHash && w.txHash.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Filtered balances
  const filteredBalances = balances.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered shares
  const filteredShares = shares.filter(
    (s) =>
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
  const isStockEmpty = settings.tokenStock <= 0;

  return (
    <div className="space-y-8">
      {/* Top Banner Alert if stock is empty */}
      {isStockEmpty && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-300">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div className="text-sm">
            <strong className="font-bold text-red-200">Estoque de Tokens BXS Zerado!</strong> Os
            compartilhamentos de vídeos foram <strong>travados automaticamente</strong> na landing
            page e no painel para não exceder o saldo disponível. Recarregue o estoque abaixo para
            reativar.
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Global Config Card: Stock, Min Withdrawal, Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Gestão do Programa de Tokens BXS
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  BEP-20
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure estoque disponível, limite de retirada mínima e gerencie pagamentos com
                Hash BSC.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </button>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Campo 1: Estoque de Tokens Disponíveis */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Estoque de Tokens BXS
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-lg font-black text-amber-400 focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
                  BXS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isStockEmpty ? (
                  <span className="text-red-400 font-semibold">Travado (zerado)</span>
                ) : (
                  <span>Descontado a cada pagamento realizado.</span>
                )}
              </p>
            </div>

            {/* Campo 2: Retirada Mínima */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Retirada Mínima
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minWithdrawalInput}
                  onChange={(e) => setMinWithdrawalInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-lg font-black text-white focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
                  BXS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Padrão 100 BXS. Editável a qualquer momento.
              </p>
            </div>

            {/* Campo 3: Recompensa por Compartilhamento */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Recompensa / Vídeo
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rewardPerShareInput}
                  onChange={(e) => setRewardPerShareInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-lg font-black text-emerald-400 focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
                  BXS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Creditado por compartilhamento público verificado.
              </p>
            </div>

            {/* Campo 4: Status do Sistema & Salvar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Status do Programa
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sharingEnabledInput && !isStockEmpty}
                    disabled={isStockEmpty}
                    onChange={(e) => setSharingEnabledInput(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {isStockEmpty ? 'Travado (Sem Estoque)' : sharingEnabledInput ? 'Ativo na Landing' : 'Pausado'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'withdrawals'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Solicitações de Saque</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'balances'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Saldos dos Usuários ({balances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shares')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'shares'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhamentos ({shares.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, e-mail, carteira..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs text-slate-400 font-semibold">Filtrar status:</span>
            <div className="flex items-center gap-1">
              {(['pending', 'paid', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setWithdrawalFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    withdrawalFilter === filter
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {filter === 'pending' ? 'Pendentes' : filter === 'paid' ? 'Pagos' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Carteira BSC (BEP-20)</th>
                    <th className="p-4">Data</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Hash da Transação (BSC)</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Nenhuma solicitação de retirada encontrada para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((item) => {
                      const isPending = item.status === 'pending';
                      const currentTxInput = txHashes[item.id] || '';

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4">
                            <div className="font-bold text-white">{item.userName}</div>
                            <div className="text-[11px] text-slate-400">{item.userEmail}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-black text-amber-400 text-sm">
                              {item.amount} BXS
                            </div>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                                {item.walletAddress}
                              </span>
                              <button
                                type="button"
                                title="Copiar carteira"
                                onClick={() => copyToClipboard(item.walletAddress)}
                                className="p-1 text-slate-400 hover:text-white transition"
                              >
                                {copiedAddress === item.walletAddress ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-slate-400 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Pendente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Pago
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isPending ? (
                              <div className="min-w-[200px]">
                                <input
                                  type="text"
                                  placeholder="Cole a Hash da BSC (0x...)"
                                  value={currentTxInput}
                                  onChange={(e) =>
                                    setTxHashes((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                                />
                              </div>
                            ) : item.txHash ? (
                              <a
                                href={`https://bscscan.com/tx/${item.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 underline"
                              >
                                <span>
                                  {item.txHash.slice(0, 10)}...{item.txHash.slice(-8)}
                                </span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">N/A</span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handlePayWithdrawal(item.id)}
                                disabled={payingId === item.id || !currentTxInput.trim()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {payingId === item.id ? 'Gravando...' : 'Confirmar Pgto'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                Pago em {item.paidAt ? new Date(item.paidAt).toLocaleDateString('pt-BR') : '-'}
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
        </div>
      )}

      {/* Tab 2: User Balances */}
      {activeTab === 'balances' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Saldos dos Usuários e Totais de Compartilhamentos
            </h3>
            <span className="text-xs text-slate-400">
              Total de Usuários com Movimentação: {balances.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Saldo Disponível</th>
                  <th className="p-4">Compartilhamentos</th>
                  <th className="p-4">Total Ganho</th>
                  <th className="p-4">Total Sacado</th>
                  <th className="p-4">Saques Pendentes</th>
                  <th className="p-4 text-right">Atingiu Mínimo?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum usuário com saldo ou compartilhamento registrado.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((u) => {
                    const reachesMin = u.currentBalance >= settings.minWithdrawal;

                    return (
                      <tr key={u.userId} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <div className="font-bold text-white">{u.userName}</div>
                          <div className="text-[11px] text-slate-400">{u.userEmail}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-black text-amber-400 text-sm">
                            {u.currentBalance} BXS
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                            <Share2 className="w-3.5 h-3.5 text-blue-400" />
                            {u.totalShares}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">
                          +{u.totalShares} BXS
                        </td>
                        <td className="p-4 text-emerald-400 font-semibold">
                          {u.totalWithdrawn} BXS
                        </td>
                        <td className="p-4">
                          {u.pendingWithdrawal > 0 ? (
                            <span className="text-amber-400 font-bold">
                              {u.pendingWithdrawal} BXS (pendente)
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {reachesMin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Apto a Sacar
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              {u.currentBalance}/{settings.minWithdrawal} BXS
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
      )}

      {/* Tab 3: Shares Feed */}
      {activeTab === 'shares' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              Feed de Vídeos Compartilhados em Modo Público
            </h3>
            <span className="text-xs text-slate-400">
              Total de Compartilhamentos: {shares.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Vídeo</th>
                  <th className="p-4">Rede Social</th>
                  <th className="p-4">Link da Publicação</th>
                  <th className="p-4">Recompensa</th>
                  <th className="p-4 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredShares.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum compartilhamento registrado ainda.
                    </td>
                  </tr>
                ) : (
                  filteredShares.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{s.userName}</div>
                        <div className="text-[11px] text-slate-400">{s.userEmail}</div>
                      </td>
                      <td className="p-4 text-slate-200 font-medium max-w-[200px] truncate">
                        {s.videoTitle}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                          {s.platform}
                        </span>
                      </td>
                      <td className="p-4">
                        <a
                          href={s.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono text-[11px] underline max-w-[220px] truncate"
                        >
                          <span>{s.postUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="p-4 font-bold text-amber-400">
                        +{s.tokensAwarded} BXS
                      </td>
                      <td className="p-4 text-right text-slate-400 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
