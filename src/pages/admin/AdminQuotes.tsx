import React, { useState } from 'react';
import { Quote, QuoteItem, QuoteStatus } from '../../types';
import { formatFCFA, formatDate, getQuoteStatusBadge } from '../../utils/formatters';
import { downloadQuotePDF } from '../../utils/pdfGenerator';
import {
  Search,
  FileText,
  Edit3,
  CheckCircle,
  XCircle,
  Download,
  Plus,
  Minus,
  Trash2,
  Save,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminModifyQuote, updateQuoteStatus } from '../../services/quoteService';

interface AdminQuotesProps {
  quotes: Quote[];
  onRefresh: () => void;
}

export const AdminQuotes: React.FC<AdminQuotesProps> = ({ quotes, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Edit modal states
  const [isEditing, setIsEditing] = useState(false);
  const [editingItems, setEditingItems] = useState<QuoteItem[]>([]);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [adminNoteVal, setAdminNoteVal] = useState('');
  const [saving, setSaving] = useState(false);

  const openEditModal = (q: Quote) => {
    setSelectedQuote(q);
    setEditingItems(JSON.parse(JSON.stringify(q.items)));
    setDiscountVal(q.discount || 0);
    setAdminNoteVal(q.adminNote || '');
    setIsEditing(true);
  };

  const handleUpdateItemQty = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    setEditingItems(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: newQty,
        subtotal: newQty * next[idx].selling_price,
      };
      return next;
    });
  };

  const handleUpdateItemPrice = (idx: number, newPrice: number) => {
    setEditingItems(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        selling_price: Math.max(0, newPrice),
        subtotal: next[idx].quantity * Math.max(0, newPrice),
      };
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (editingItems.length <= 1) {
      alert('Un devis doit contenir au moins 1 article.');
      return;
    }
    setEditingItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAndSendModified = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    setSaving(true);
    try {
      await adminModifyQuote(
        selectedQuote.id,
        editingItems,
        Number(discountVal),
        adminNoteVal.trim()
      );
      setIsEditing(false);
      setSelectedQuote(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la modification du devis.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      await updateQuoteStatus(quoteId, status);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const qStr = search.toLowerCase().trim();
    const matchesSearch =
      !qStr ||
      q.quoteNumber.toLowerCase().includes(qStr) ||
      q.clientName.toLowerCase().includes(qStr) ||
      q.clientPhone.toLowerCase().includes(qStr);
    return matchesStatus && matchesSearch;
  });

  const calculatedSubtotal = editingItems.reduce((sum, it) => sum + (it.quantity * it.selling_price), 0);
  const calculatedTotal = Math.max(0, calculatedSubtotal - discountVal);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950">
            Administration des Devis
          </h1>
          <p className="text-xs text-slate-500">
            Révision des proformas, application de remises et notifications client
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Rechercher par #devis, client, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="EN ATTENTE">EN ATTENTE</option>
            <option value="MODIFIÉ">MODIFIÉ</option>
            <option value="ACCEPTÉ">ACCEPTÉ</option>
            <option value="PAIEMENT EN ATTENTE">PAIEMENT EN ATTENTE</option>
            <option value="PAYÉ">PAYÉ</option>
            <option value="REFUSÉ">REFUSÉ</option>
          </select>
        </div>
      </div>

      {/* Quotes List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Articles</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map(q => {
                const badge = getQuoteStatusBadge(q.status);
                return (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {q.quoteNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(q.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{q.clientName}</p>
                      <p className="text-[10px] text-slate-500">{q.clientPhone}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {q.items.length} article(s)
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-950 font-mono">
                      {formatFCFA(q.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(q)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1"
                          title="Modifier prix/quantités"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Réviser</span>
                        </button>

                        <button
                          onClick={() => downloadQuotePDF(q)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                          title="Télécharger PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quote Modal */}
      {isEditing && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="font-black text-slate-900 text-base">
                  Révision du Devis #{selectedQuote.quoteNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Client : {selectedQuote.clientName} ({selectedQuote.clientPhone})
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAndSendModified} className="p-5 overflow-y-auto space-y-5">
              {/* Items editing table */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Lignes du devis (Modifier prix et quantités)
                </span>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="py-2.5 px-3">Produit</th>
                        <th className="py-2.5 px-2 text-center">Quantité</th>
                        <th className="py-2.5 px-2 text-right">Prix Unitaire FCFA</th>
                        <th className="py-2.5 px-3 text-right">Sous-total</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-500">REF {item.reference}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                                className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center shadow-2xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                                className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.selling_price}
                              onChange={e => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-right font-bold text-xs focus:outline-hidden focus:border-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-950 font-mono">
                            {formatFCFA(item.quantity * item.selling_price)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discount and Admin Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remise commerciale FCFA
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountVal}
                    onChange={e => setDiscountVal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm font-bold text-rose-700 border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Note administrateur pour le client
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Remise fidélité accordée, produits disponibles immédiatement en magasin."
                    value={adminNoteVal}
                    onChange={e => setAdminNoteVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Totals Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Sous-total : {formatFCFA(calculatedSubtotal)}</span>
                  {discountVal > 0 && (
                    <span className="text-xs text-rose-600 font-semibold block">
                      Remise : -{formatFCFA(discountVal)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">TOTAL RÉVISÉ</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-900">
                    {formatFCFA(calculatedTotal)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStatus(selectedQuote.id, 'ACCEPTÉ')}
                    className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Valider le devis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatus(selectedQuote.id, 'REFUSÉ')}
                    className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Refuser le devis</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{saving ? 'Envoi...' : 'Envoyer devis révisé au client'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
