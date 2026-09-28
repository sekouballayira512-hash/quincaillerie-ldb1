import React, { useState } from 'react';
import { Quote, PaymentMethod } from '../types';
import {
  formatFCFA,
  STORE_PHONE,
  STORE_WHATSAPP,
  getPaymentWhatsAppUrl,
} from '../utils/formatters';
import {
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { submitManualPayment } from '../services/paymentService';

interface PaymentModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  quote,
  isOpen,
  onClose,
  onPaymentSubmitted,
}) => {
  if (!isOpen || !quote) return null;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('WAVE');
  const [refCode, setRefCode] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(false);

  const cleanPhone = STORE_PHONE.replace(/\s+/g, '');

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(cleanPhone);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleConfirmPaid = async () => {
    setIsSubmitting(true);
    try {
      await submitManualPayment(
        quote,
        selectedMethod,
        refCode.trim(),
        `Paiement manuel déclaré par le client via ${selectedMethod}`
      );
      setSubmittedStatus(true);
      onPaymentSubmitted();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la déclaration du paiement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodNameDisplay =
    selectedMethod === 'WAVE'
      ? 'Wave'
      : selectedMethod === 'ORANGE_MONEY'
      ? 'Orange Money'
      : 'Max it';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-black text-slate-900 text-base sm:text-lg">
              Paiement Sécurisé au Mali
            </h2>
            <p className="text-xs text-slate-500">
              Devis #{quote.quoteNumber} • {formatFCFA(quote.total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {!submittedStatus ? (
            <>
              {/* Step 1: Mode de paiement */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Choisissez votre mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Wave Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('WAVE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      selectedMethod === 'WAVE'
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-sky-800">Wave</span>
                      {selectedMethod === 'WAVE' && (
                        <span className="w-2 h-2 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Zéro frais ou transfert direct Wave Mali
                    </p>
                  </button>

                  {/* Orange Money / Max it Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('ORANGE_MONEY')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      selectedMethod === 'ORANGE_MONEY' || selectedMethod === 'MAX_IT'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-orange-800">Orange Money / Max it</span>
                      {(selectedMethod === 'ORANGE_MONEY' || selectedMethod === 'MAX_IT') && (
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Via code #144# ou application Max it
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 2: Payment Details & Official Number */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-medium">Montant exact à transférer :</span>
                  <span className="text-lg font-black text-emerald-800">
                    {formatFCFA(quote.total)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                      Numéro officiel Quincaillerie LDB
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-base sm:text-lg">
                      {STORE_PHONE}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyNumber}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le numéro</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions */}
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <p className="font-bold text-slate-800">Instructions pour {methodNameDisplay} :</p>
                  {selectedMethod === 'WAVE' ? (
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Ouvrez votre application Wave sur votre téléphone.</li>
                      <li>Effectuez un transfert de <strong>{formatFCFA(quote.total)}</strong> vers le <strong>{STORE_PHONE}</strong>.</li>
                      <li>Indiquez en motif : <strong>{quote.quoteNumber}</strong>.</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Composez le <strong>#144#</strong> ou ouvrez l'application <strong>Max it</strong>.</li>
                      <li>Transférez le montant de <strong>{formatFCFA(quote.total)}</strong> vers le <strong>{STORE_PHONE}</strong>.</li>
                      <li>Conservez le SMS ou la capture de confirmation.</li>
                    </ol>
                  )}
                </div>
              </div>

              {/* Optional reference input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID de transaction ou référence SMS (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ref TXN-73921 ou numéro de téléphone émetteur"
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Buttons: J'ai effectué le paiement & Justificatif WhatsApp */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 active:scale-98 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enregistrement...' : 'J\'ai effectué le paiement'}</span>
                </button>

                <a
                  href={getPaymentWhatsAppUrl(quote.quoteNumber, quote.total, methodNameDisplay)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Envoyer le justificatif par WhatsApp</span>
                </a>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Important : Le bouton « J'ai effectué le paiement » enregistre votre déclaration. Quincaillerie LDB validera la réception avant expédition.
                </p>
              </div>
            </>
          ) : (
            /* Post-Click Confirmation Screen (Section 22) */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center animate-pulse">
                <Clock className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase">
                  PAIEMENT EN ATTENTE
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Votre paiement est en attente de vérification par Quincaillerie LDB.
                </h3>
              </div>

              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Notre comptabilité vérifie la transaction sur le <strong>{STORE_PHONE}</strong>. Pour accélérer le traitement, envoyez dès maintenant votre capture ou votre reçu par WhatsApp.
              </p>

              <div className="pt-2 space-y-2">
                <a
                  href={getPaymentWhatsAppUrl(quote.quoteNumber, quote.total, methodNameDisplay)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer ma capture / reçu par WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
