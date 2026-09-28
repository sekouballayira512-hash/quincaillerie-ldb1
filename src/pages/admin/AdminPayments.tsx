import React, { useState, useMemo } from 'react';
import { PaymentRecord, Quote } from '../../types';
import { formatFCFA, formatDate, getWhatsAppUrl } from '../../utils/formatters';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Smartphone,
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  Check,
  ShieldCheck,
  Receipt,
  Truck,
} from 'lucide-react';
import { confirmPaymentAdmin, refusePaymentAdmin } from '../../services/paymentService';
import { getQuoteById } from '../../services/quoteService';
import { useAuth } from '../../firebase/authContext';

interface AdminPaymentsProps {
  payments: PaymentRecord[];
  quotes: Quote[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({
  payments,
  quotes,
  onRefresh,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationModalPayment, setValidationModalPayment] = useState<PaymentRecord | null>(null);
  const [refusalModalPayment, setRefusalModalPayment] = useState<PaymentRecord | null>(null);
  const [refusalReason, setRefusalReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleOpenConfirmModal = (payment: PaymentRecord) => {
    setErrorBanner('');
    setValidationModalPayment(payment);
  };

  const handleExecuteConfirm = async () => {
    if (!validationModalPayment) return;
    const payment = validationModalPayment;

    // Try finding quote in props or fetch from Firestore
    let relatedQuote = quotes.find(q => q.id === payment.quoteId);
    if (!relatedQuote && payment.quoteId) {
      try {
        relatedQuote = (await getQuoteById(payment.quoteId)) || undefined;
      } catch (err) {
        console.warn('Could not fetch quote by ID:', err);
      }
    }

    setProcessingId(payment.id);
    setErrorBanner('');
    try {
      const res = await confirmPaymentAdmin(payment.id, relatedQuote, user?.uid || 'admin', payment);
      setValidationModalPayment(null);
      setSuccessBanner(
        `Paiement #${payment.paymentNumber} validé avec succès ! Statut mis à jour sur PAYÉ et commande client ${res?.orderNumber ? `#${res.orderNumber}` : ''} créée.`
      );
      setTimeout(() => setSuccessBanner(''), 7000);
      onRefresh();
    } catch (e: unknown) {
      console.error('Error confirming payment:', e);
      setErrorBanner(
        'Erreur lors de la validation du paiement. Veuillez vérifier vos permissions administratives et votre connexion.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRefusal = (payment: PaymentRecord) => {
    setErrorBanner('');
    setRefusalModalPayment(payment);
    setRefusalReason('Montant non reçu sur le compte Wave / Orange Money (+223 92012334).');
  };

  const handleConfirmRefusal = async () => {
    if (!refusalModalPayment) return;
    setProcessingId(refusalModalPayment.id);
    setErrorBanner('');
    try {
      await refusePaymentAdmin(
        refusalModalPayment.id,
        refusalModalPayment.quoteId || '',
        refusalModalPayment.userId,
        refusalReason.trim()
      );
      setSuccessBanner(`Paiement #${refusalModalPayment.paymentNumber} refusé. Le client a été notifié du motif.`);
      setTimeout(() => setSuccessBanner(''), 7000);
      setRefusalModalPayment(null);
      onRefresh();
    } catch (e: unknown) {
      console.error('Error refusing payment:', e);
      setErrorBanner('Erreur lors du refus du paiement.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered payments
  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'PAIEMENT EN ATTENTE');
  }, [payments]);

  const displayedPayments = useMemo(() => {
    const list = activeTab === 'PENDING' ? pendingPayments : payments;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      p =>
        p.paymentNumber?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.clientPhone?.toLowerCase().includes(q) ||
        p.refCode?.toLowerCase().includes(q) ||
        p.proofNote?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q)
    );
  }, [activeTab, pendingPayments, payments, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Action controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span>Administration des Paiements</span>
            {pendingPayments.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                {pendingPayments.length} en attente
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Validation des règlements Wave, Orange Money et Max it pour déclencher les commandes clients
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Rafraîchir les paiements"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          {/* Tab selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>En attente ({pendingPayments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historique complet ({payments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{successBanner}</span>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-black px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{errorBanner}</span>
          <button
            onClick={() => setErrorBanner('')}
            className="text-rose-700 hover:text-rose-950 text-xs font-black px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher par numéro de paiement, nom de client, téléphone, référence..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {displayedPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">
              {searchQuery ? 'Aucun paiement ne correspond à votre recherche' : 'Aucun paiement en attente'}
            </p>
            <p className="text-xs text-slate-400">
              {searchQuery
                ? 'Essayez de rechercher avec un autre terme ou effacez la recherche.'
                : 'Tous les règlements clients déclarés ont été traités.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-4">Paiement #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Moyen</th>
                  <th className="py-3 px-3 text-right">Montant</th>
                  <th className="py-3 px-3">Réf / Justificatif</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Action Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPayments.map(p => {
                  const relatedQuote = quotes.find(q => q.id === p.quoteId);
                  const isPending = p.status === 'PAIEMENT EN ATTENTE';
                  const isProcessing = processingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{p.paymentNumber}</span>
                        {relatedQuote ? (
                          <span className="text-[10px] text-emerald-800 font-semibold block">
                            Devis #{relatedQuote.quoteNumber}
                          </span>
                        ) : p.quoteId ? (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Devis ID: {p.quoteId.substring(0, 8)}...
                          </span>
                        ) : null}
                        {(p as any).orderNumber && (
                          <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 mt-0.5">
                            <Truck className="w-2.5 h-2.5" />
                            <span>{(p as any).orderNumber}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(p.createdAt, true)}
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{p.clientName}</p>
                        <a
                          href={getWhatsAppUrl(`Bonjour ${p.clientName}, concernant votre paiement de ${formatFCFA(p.amount)} à la Quincaillerie LDB.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>{p.clientPhone}</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.method === 'WAVE'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {p.method}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-slate-950 font-mono text-sm">
                        {formatFCFA(p.amount)}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 max-w-xs">
                        <p className="font-mono text-[11px] truncate font-semibold text-slate-800">
                          {p.refCode || 'Aucune référence saisie'}
                        </p>
                        {p.proofNote && (
                          <p className="text-[10px] text-slate-500 truncate">{p.proofNote}</p>
                        )}
                        {p.adminReason && (
                          <p className="text-[10px] text-rose-600 italic">Motif refus : {p.adminReason}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            p.status === 'PAYÉ'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : p.status === 'REFUSÉ'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-purple-50 text-purple-800 border-purple-300 animate-pulse'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Validation button */}
                            <button
                              onClick={() => handleOpenConfirmModal(p)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                              title="Valider la réception effective des fonds et créer la commande client"
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Valider paiement</span>
                            </button>

                            {/* Refusal button */}
                            <button
                              onClick={() => handleOpenRefusal(p)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Refuser le paiement"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 font-medium block">
                              {p.status === 'PAYÉ' ? 'Validé' : 'Refusé'} {p.verifiedAt ? `le ${formatDate(p.verifiedAt)}` : ''}
                            </span>
                            {(p as any).orderNumber && onNavigateTab && (
                              <button
                                onClick={() => onNavigateTab('admin-commandes')}
                                className="text-[10px] text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5 mt-0.5"
                              >
                                <span>Voir commande</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal: Valider le Paiement */}
      {validationModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Valider la réception du paiement
                </h3>
                <p className="text-xs text-slate-500">
                  Paiement #{validationModalPayment.paymentNumber}
                </p>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Client :</span>
                <span className="font-bold text-slate-900">
                  {validationModalPayment.clientName} ({validationModalPayment.clientPhone})
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Moyen de paiement :</span>
                <span className="font-bold text-slate-900">
                  {validationModalPayment.method === 'WAVE' ? 'Wave Mali' : 'Orange Money / Max it'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Montant reçu :</span>
                <span className="font-black text-emerald-800 text-base font-mono">
                  {formatFCFA(validationModalPayment.amount)}
                </span>
              </div>

              {validationModalPayment.refCode && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Référence client :</span>
                  <span className="font-mono font-bold text-slate-800">
                    {validationModalPayment.refCode}
                  </span>
                </div>
              )}

              {validationModalPayment.proofNote && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-0.5">Note client :</span>
                  <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">
                    {validationModalPayment.proofNote}
                  </p>
                </div>
              )}
            </div>

            {/* Impact Explanation */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Actions automatiques à la validation :
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                <li>Le statut du paiement passera en <strong>PAYÉ</strong> chez le client.</li>
                <li>Le devis associé sera marqué comme <strong>PAYÉ</strong>.</li>
                <li>La commande client (CMD-LDB-...) sera automatiquement générée en statut <strong>CONFIRMÉE</strong>.</li>
                <li>Le client recevra une notification de confirmation.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setValidationModalPayment(null)}
                disabled={processingId !== null}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={processingId !== null}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98 cursor-pointer disabled:opacity-50 transition-all"
              >
                {processingId !== null ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validation en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmer la réception et Valider</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Refusal Reason */}
      {refusalModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Refuser le paiement #{refusalModalPayment.paymentNumber}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Indiquez la raison du refus. Le client sera immédiatement averti par notification et pourra soumettre un nouveau justificatif.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif du refus
              </label>
              <textarea
                rows={3}
                value={refusalReason}
                onChange={e => setRefusalReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-rose-600 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefusalModalPayment(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmRefusal}
                disabled={processingId !== null}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                {processingId !== null ? 'Traitement...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
