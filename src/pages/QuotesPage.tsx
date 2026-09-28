import React, { useState, useEffect } from 'react';
import { Quote, PaymentRecord, Order } from '../types';
import {
  formatFCFA,
  formatDate,
  getQuoteStatusBadge,
  getQuoteWhatsAppUrl,
  getPaymentWhatsAppUrl,
  STORE_PHONE,
} from '../utils/formatters';
import {
  downloadQuotePDF,
  shareQuote,
} from '../utils/pdfGenerator';
import {
  FileText,
  Download,
  Share2,
  MessageCircle,
  CreditCard,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Truck,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { updateQuoteStatus } from '../services/quoteService';

interface QuotesPageProps {
  quotes: Quote[];
  payments?: PaymentRecord[];
  orders?: Order[];
  onOpenPaymentModal: (quote: Quote) => void;
  onRefreshQuotes: () => void;
  onNavigate: (tab: string) => void;
  selectedQuoteId?: string | null;
  initialTab?: 'quotes' | 'payments';
}

export const QuotesPage: React.FC<QuotesPageProps> = ({
  quotes,
  payments = [],
  orders = [],
  onOpenPaymentModal,
  onRefreshQuotes,
  onNavigate,
  selectedQuoteId,
  initialTab = 'quotes',
}) => {
  const [viewMode, setViewMode] = useState<'quotes' | 'payments'>(initialTab);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(() => {
    if (selectedQuoteId) {
      return quotes.find(q => q.id === selectedQuoteId) || null;
    }
    return quotes.length > 0 ? quotes[0] : null;
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync if selectedQuoteId changes
  useEffect(() => {
    if (selectedQuoteId) {
      const match = quotes.find(q => q.id === selectedQuoteId);
      if (match) {
        setActiveQuote(match);
        setViewMode('quotes');
      }
    } else if (!activeQuote && quotes.length > 0) {
      setActiveQuote(quotes[0]);
    }
  }, [selectedQuoteId, quotes]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshQuotes();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleClientAcceptQuote = async (quote: Quote) => {
    if (!confirm('Confirmez-vous l\'acceptation de ce devis pour procéder au paiement ?')) return;
    setIsUpdatingStatus(true);
    try {
      await updateQuoteStatus(quote.id, 'ACCEPTÉ', 'Devis validé par le client.');
      onRefreshQuotes();
      onOpenPaymentModal(quote);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClientRefuseQuote = async (quote: Quote) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;
    setIsUpdatingStatus(true);
    try {
      await updateQuoteStatus(quote.id, 'REFUSÉ', 'Devis décliné par le client.');
      onRefreshQuotes();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Find payment record matching active quote
  const activeQuotePayment = activeQuote
    ? payments.find(p => p.quoteId === activeQuote.id)
    : undefined;

  // Find confirmed order matching active quote
  const activeQuoteOrder = activeQuote
    ? orders.find(o => o.quoteId === activeQuote.id)
    : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Title and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span>Mes Devis & Règlements</span>
          </h1>
          <p className="text-xs text-slate-500">
            Suivi des proformas, statut en temps réel des règlements Wave / Orange Money et commandes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Actualiser les statuts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          {/* Toggle between Devis and Paiements */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('quotes')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'quotes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mes Devis ({quotes.length})</span>
            </button>

            <button
              onClick={() => setViewMode('payments')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'payments'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span>Statut Paiements ({payments.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: PAYMENTS HISTORY AND STATUS */}
      {viewMode === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Historique & Statut de vos Paiements
              </h2>
              <p className="text-xs text-slate-500">
                Vérification et validation de vos règlements manuels Wave Mali et Orange Money
              </p>
            </div>
            <a
              href={`https://wa.me/22392012334`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Support WhatsApp (+223 92012334)</span>
            </a>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Aucun paiement déclaré pour le moment</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Lorsque vous déclarez un règlement pour un devis via Wave ou Orange Money, vous pourrez suivre sa vérification en direct ici.
              </p>
              {quotes.length > 0 && (
                <button
                  onClick={() => setViewMode('quotes')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  Voir mes devis à régler
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(p => {
                const relatedQuote = quotes.find(q => q.id === p.quoteId);
                const relatedOrder = orders.find(o => o.quoteId === p.quoteId || (p as any).orderId === o.id);
                const isPaid = p.status === 'PAYÉ';
                const isPending = p.status === 'PAIEMENT EN ATTENTE';
                const isRefused = p.status === 'REFUSÉ';

                return (
                  <div
                    key={p.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isPaid
                        ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/10'
                        : isPending
                        ? 'bg-purple-50/40 border-purple-300 ring-1 ring-purple-500/10'
                        : 'bg-rose-50/40 border-rose-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            #{p.paymentNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isPending
                                ? 'bg-purple-100 text-purple-800 border border-purple-300 animate-pulse'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Déclaré le {formatDate(p.createdAt, true)}
                        </p>

                        {relatedQuote && (
                          <p className="text-xs font-semibold text-slate-700 mt-1">
                            Devis associé :{' '}
                            <span className="text-emerald-800 font-bold">
                              DEVIS #{relatedQuote.quoteNumber}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[11px] text-slate-400 font-medium block">MONTANT</span>
                        <span className="text-lg font-black text-slate-950 font-mono">
                          {formatFCFA(p.amount)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${
                            p.method === 'WAVE'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}
                        >
                          Via {p.method === 'WAVE' ? 'Wave Mali' : 'Orange Money / Max it'}
                        </span>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">
                          RÉFÉRENCE FOURNIE
                        </span>
                        <p className="font-mono text-slate-800 font-bold">
                          {p.refCode || 'Aucune référence saisie'}
                        </p>
                        {p.proofNote && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">{p.proofNote}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">
                          ÉTAT DE LA VÉRIFICATION
                        </span>
                        {isPaid ? (
                          <p className="text-emerald-800 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Paiement confirmé par Quincaillerie LDB
                              {p.verifiedAt ? ` le ${formatDate(p.verifiedAt)}` : ''}.
                            </span>
                          </p>
                        ) : isPending ? (
                          <p className="text-purple-800 font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>En cours de vérification par notre service comptable.</span>
                          </p>
                        ) : (
                          <p className="text-rose-800 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Paiement non validé : {p.adminReason || 'Motif non précisé.'}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      {isPending && (
                        <>
                          <a
                            href={getPaymentWhatsAppUrl(
                              relatedQuote?.quoteNumber || p.paymentNumber,
                              p.amount,
                              p.method === 'WAVE' ? 'Wave' : 'Orange Money'
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Envoyer justificatif WhatsApp</span>
                          </a>

                          <span className="text-[11px] text-purple-700 italic">
                            Un gestionnaire vérifie le transfert sur le {STORE_PHONE}.
                          </span>
                        </>
                      )}

                      {isPaid && (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Votre commande est en cours de préparation en magasin.</span>
                          </span>

                          <button
                            onClick={() => onNavigate('commandes')}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Voir le suivi de ma commande</span>
                          </button>
                        </div>
                      )}

                      {isRefused && relatedQuote && (
                        <button
                          onClick={() => {
                            setActiveQuote(relatedQuote);
                            setViewMode('quotes');
                            onOpenPaymentModal(relatedQuote);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                        >
                          Régulariser le paiement
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUOTES CATALOG AND DETAILS */}
      {viewMode === 'quotes' && (
        <>
          {quotes.length === 0 ? (
            <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Aucun devis enregistré</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Vous n'avez pas encore généré de devis. Remplissez votre panier avec les articles nécessaires et demandez un devis proforma en quelques clics.
              </p>
              <button
                onClick={() => onNavigate('catalogue')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Consulter les articles</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Quotes Cards Column (1 col on desktop) */}
              <div className="space-y-3">
                {quotes.map(q => {
                  const badge = getQuoteStatusBadge(q.status);
                  const isSelected = activeQuote?.id === q.id;

                  return (
                    <div
                      key={q.id}
                      onClick={() => setActiveQuote(q)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            DEVIS #{q.quoteNumber}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatDate(q.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{q.items.length} article(s)</span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">TOTAL</span>
                          <span className="font-black text-slate-950 text-sm">
                            {formatFCFA(q.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quote Detail View (2 cols on desktop) */}
              {activeQuote && (
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-6">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Facture Proforma
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                        DEVIS #{activeQuote.quoteNumber}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Émis le {formatDate(activeQuote.createdAt, true)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => downloadQuotePDF(activeQuote)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Télécharger PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger PDF</span>
                      </button>

                      <button
                        onClick={() => shareQuote(activeQuote)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Partager"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Partager</span>
                      </button>

                      <a
                        href={getQuoteWhatsAppUrl(activeQuote.quoteNumber, activeQuote.total)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Envoyer par WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Client & Status Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold mb-1">DESTINATAIRE</p>
                      <p className="font-bold text-slate-900">{activeQuote.clientName}</p>
                      <p className="text-slate-600">{activeQuote.clientPhone}</p>
                      {activeQuote.clientEmail && (
                        <p className="text-slate-500">{activeQuote.clientEmail}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold mb-1">STATUT DU DEVIS & PAIEMENT</p>
                      <div className="mt-1">
                        {(() => {
                          const badge = getQuoteStatusBadge(activeQuote.status);
                          return (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      {activeQuote.status === 'PAIEMENT EN ATTENTE' && (
                        <p className="text-[11px] text-purple-700 mt-1.5 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Paiement déclaré • En cours de vérification par Quincaillerie LDB</span>
                        </p>
                      )}
                      {activeQuote.status === 'PAYÉ' && (
                        <p className="text-[11px] text-emerald-700 mt-1.5 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paiement validé avec succès • Commande confirmée</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SPECIFIC PAYMENT STATUS HIGHLIGHT CARD (When PAIEMENT EN ATTENTE or PAYE) */}
                  {activeQuote.status === 'PAIEMENT EN ATTENTE' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-purple-950 text-sm">
                            Votre paiement est en cours de vérification
                          </h4>
                          <p className="text-purple-800 leading-relaxed">
                            Notre service comptable vérifie la réception des fonds sur le compte Wave / Orange Money (<strong>{STORE_PHONE}</strong>). Dès confirmation par l'administrateur, votre commande passera automatiquement en statut confirmé.
                          </p>
                        </div>
                      </div>

                      {activeQuotePayment && (
                        <div className="p-3 rounded-xl bg-white border border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Règlement déclaré</span>
                            <span className="font-mono font-bold text-slate-800">
                              #{activeQuotePayment.paymentNumber} • {activeQuotePayment.method}
                            </span>
                            {activeQuotePayment.refCode && (
                              <span className="text-slate-500 block text-[11px]">
                                Réf: {activeQuotePayment.refCode}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Montant</span>
                            <span className="font-black text-purple-900 font-mono text-sm">
                              {formatFCFA(activeQuotePayment.amount)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={getPaymentWhatsAppUrl(
                            activeQuote.quoteNumber,
                            activeQuote.total,
                            activeQuotePayment?.method === 'WAVE' ? 'Wave' : 'Orange Money'
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Envoyer le reçu par WhatsApp</span>
                        </a>

                        <button
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>Vérifier si le paiement a été validé</span>
                        </button>

                        <button
                          onClick={() => onOpenPaymentModal(activeQuote)}
                          className="px-3 py-2 rounded-xl text-purple-700 hover:bg-purple-100 font-semibold text-xs transition-colors"
                        >
                          Modifier la référence
                        </button>
                      </div>
                    </div>
                  )}

                  {activeQuote.status === 'PAYÉ' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-emerald-950 text-sm">
                              Paiement validé avec succès !
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                              RÈGLEMENT CONFIRMÉ
                            </span>
                          </div>
                          <p className="text-emerald-800 leading-relaxed">
                            Quincaillerie LDB a bien validé la réception effective de vos fonds. Votre commande a été créée et est prise en charge pour la préparation de vos matériaux.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200/80">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('commandes')}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Voir le suivi de ma commande</span>
                          </button>

                          <button
                            onClick={() => downloadQuotePDF(activeQuote)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Facture acquittée</span>
                          </button>
                        </div>

                        {activeQuoteOrder && (
                          <span className="text-emerald-800 font-bold font-mono text-xs">
                            Réf Commande : #{activeQuoteOrder.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin notes if modified */}
                  {activeQuote.adminNote && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                      <span className="font-bold block">Note de la Quincaillerie LDB :</span>
                      <p>{activeQuote.adminNote}</p>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                          <th className="pb-2">Produit</th>
                          <th className="pb-2">Référence</th>
                          <th className="pb-2 text-center">Quantité</th>
                          <th className="pb-2 text-right">Prix unitaire</th>
                          <th className="pb-2 text-right">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeQuote.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-semibold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                              {item.reference}
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-800">
                              {item.quantity} {item.unit || ''}
                            </td>
                            <td className="py-2.5 text-right text-slate-600">
                              {formatFCFA(item.selling_price)}
                            </td>
                            <td className="py-2.5 text-right font-extrabold text-slate-900">
                              {formatFCFA(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Summary */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-end">
                    <div className="w-full sm:w-64 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Sous-total HT :</span>
                        <span className="font-semibold text-slate-900">
                          {formatFCFA(activeQuote.subtotal)}
                        </span>
                      </div>
                      {activeQuote.discount > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Remise accordée :</span>
                          <span>- {formatFCFA(activeQuote.discount)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="font-black text-slate-900 text-sm">TOTAL :</span>
                        <span className="font-black text-emerald-800 text-lg sm:text-xl">
                          {formatFCFA(activeQuote.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Action Buttons (Accept, Pay, Refuse) */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {activeQuote.status !== 'PAYÉ' &&
                    activeQuote.status !== 'REFUSÉ' &&
                    activeQuote.status !== 'PAIEMENT EN ATTENTE' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenPaymentModal(activeQuote)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Payer par Wave / Orange Money</span>
                          </button>

                          {activeQuote.status === 'MODIFIÉ' && (
                            <button
                              onClick={() => handleClientAcceptQuote(activeQuote)}
                              disabled={isUpdatingStatus}
                              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Accepter les modifications</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => handleClientRefuseQuote(activeQuote)}
                          disabled={isUpdatingStatus}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Décliner ce devis</span>
                        </button>
                      </>
                    ) : activeQuote.status === 'PAIEMENT EN ATTENTE' ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-purple-900 font-semibold">
                          Votre règlement est en cours de validation par la Quincaillerie LDB.
                        </span>
                        <button
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          className="text-xs text-purple-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>Actualiser le statut</span>
                        </button>
                      </div>
                    ) : activeQuote.status === 'PAYÉ' ? (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">
                          Règlement validé • Commande en cours de traitement
                        </span>
                        <button
                          onClick={() => onNavigate('commandes')}
                          className="text-xs text-emerald-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Accéder à mes commandes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Ce devis a été refusé.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
