import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../firebase/authContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatFCFA, getWhatsAppUrl } from '../utils/formatters';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Send, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { createQuote } from '../services/quoteService';
import { QuoteItem } from '../types';

interface CartPageProps {
  onNavigate: (tab: string) => void;
  onSelectQuoteId?: (id: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onSelectQuoteId }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, discount, total } = useCart();
  const { user, userProfile } = useAuth();

  const [clientName, setClientName] = useState(userProfile?.fullName || '');
  const [clientPhone, setClientPhone] = useState(userProfile?.phone || '');
  const [clientEmail, setClientEmail] = useState(userProfile?.email || user?.email || '');
  const [clientNote, setClientNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedQuoteNumber, setSubmittedQuoteNumber] = useState<string | null>(null);

  // Sync state with profile once loaded
  React.useEffect(() => {
    if (userProfile) {
      if (!clientName) setClientName(userProfile.fullName);
      if (!clientPhone) setClientPhone(userProfile.phone);
      if (!clientEmail) setClientEmail(userProfile.email);
    }
  }, [userProfile]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Votre panier est vide.');
      return;
    }

    if (!clientName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!clientPhone.trim()) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone (au Mali ou indicatif pays).');
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteItems: QuoteItem[] = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        reference: item.product.reference,
        category: item.product.category,
        image_url: item.product.image_url,
        quantity: item.quantity,
        unit: item.product.unit,
        selling_price: item.product.selling_price,
        subtotal: item.product.selling_price * item.quantity,
      }));

      const quote = await createQuote(
        user ? user.uid : `guest-${Date.now()}`,
        clientName.trim(),
        clientPhone.trim(),
        clientEmail.trim(),
        quoteItems,
        clientNote.trim()
      );

      setSubmittedQuoteNumber(quote.quoteNumber);
      clearCart();

      // Navigate to quotes tab or pass quote id
      if (onSelectQuoteId) {
        onSelectQuoteId(quote.id);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Une erreur est survenue lors de la création du devis. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (submittedQuoteNumber) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Demande de devis envoyée !</h2>
          <p className="text-sm font-semibold text-emerald-800">
            DEVIS #{submittedQuoteNumber}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Votre devis a bien été transmis à la <strong>Quincaillerie LDB</strong>. Notre équipe va examiner vos quantités et vous confirmer la disponibilité. Vous pouvez suivre l'état de votre devis et télécharger la facture proforma en PDF.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('devis')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            Voir mes devis
          </button>

          <a
            href={getWhatsAppUrl(`Bonjour Quincaillerie LDB, je viens de soumettre la demande de devis #${submittedQuoteNumber}. Merci de m'indiquer la disponibilité.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200 transition-colors"
          >
            Notifier la quincaillerie par WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Votre panier est vide</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Explorez notre vaste sélection d'outillage, plomberie, électricité et matériaux pour vos chantiers.
        </p>
        <button
          onClick={() => onNavigate('catalogue')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          <span>Découvrir le catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Mon Panier
          </h1>
          <p className="text-xs text-slate-500">
            {cart.length} article(s) sélectionné(s)
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Vider le panier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cart Item List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map(item => {
            const lineSubtotal = item.product.selling_price * item.quantity;
            return (
              <div
                key={item.product.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Photo & Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    <ImageWithFallback
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      REF {item.product.reference}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFCFA(item.product.selling_price)} / {item.product.unit || 'pièce'}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Selector */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-9 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-[10px] text-slate-400 block sm:hidden">Sous-total</span>
                    <span className="font-extrabold text-slate-950 text-sm sm:text-base">
                      {formatFCFA(lineSubtotal)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quote Form & Order Summary (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          <h2 className="font-extrabold text-slate-900 text-base">
            Demander un devis officiel
          </h2>

          <form onSubmit={handleSubmitQuote} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Sekou Traoré"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: +223 92012334"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse email (optionnel)
              </label>
              <input
                type="email"
                placeholder="client@gmail.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instructions / Chantier (optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Chantier situé à Kalaban Coro, livraison souhaitée ce weekend..."
                value={clientNote}
                onChange={e => setClientNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden resize-none"
              />
            </div>

            {/* Calculations Box */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-slate-900">{formatFCFA(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise accordée :</span>
                  <span>- {formatFCFA(discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-sm">TOTAL :</span>
                <span className="font-black text-emerald-800 text-lg sm:text-xl">
                  {formatFCFA(total)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 active:scale-98 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isSubmitting ? 'Génération du devis...' : 'Demander un devis'}</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            La soumission du devis génère automatiquement un PDF officiel avec référence #LDB-2026-XXXX et vous permet de finaliser votre commande.
          </p>
        </div>
      </div>
    </div>
  );
};
