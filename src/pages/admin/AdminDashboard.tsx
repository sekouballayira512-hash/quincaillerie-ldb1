import React from 'react';
import { ProductWithCost, Quote, Order, PaymentRecord } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  PackageX,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';

interface AdminDashboardProps {
  products: ProductWithCost[];
  quotes: Quote[];
  orders: Order[];
  payments: PaymentRecord[];
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  quotes,
  orders,
  payments,
  onNavigateTab,
}) => {
  // Financial calculations
  const totalRevenue = orders
    .filter(o => o.status !== 'ANNULÉE')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingPayments = payments.filter(p => p.status === 'PAIEMENT EN ATTENTE');
  const pendingQuotes = quotes.filter(q => q.status === 'EN ATTENTE' || q.status === 'MODIFIÉ');
  const activeOrders = orders.filter(o => o.status !== 'LIVRÉE' && o.status !== 'ANNULÉE');

  const outOfStockProducts = products.filter(p => p.stock <= 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);

  // Confidential margins calculations (Admin Only)
  const totalPotentialMargin = products.reduce((sum, p) => {
    const margin = p.margin ?? (p.selling_price - (p.purchase_price ?? 0));
    return sum + (margin * p.stock);
  }, 0);

  const totalCatalogInventoryValue = products.reduce((sum, p) => {
    return sum + (p.selling_price * p.stock);
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-5 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Tableau de bord de gestion</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Vue d'ensemble Quincaillerie LDB
          </h1>
          <p className="text-xs text-slate-300">
            Contrôle des ventes, devis, stocks et marges confidentielles
          </p>
        </div>

        {pendingPayments.length > 0 && (
          <button
            onClick={() => onNavigateTab('admin-paiements')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 animate-pulse shadow-md"
          >
            <Clock className="w-4 h-4" />
            <span>{pendingPayments.length} paiement(s) en attente</span>
          </button>
        )}
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chiffre d'affaires */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chiffre d'Affaires</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-950">
            {formatFCFA(totalRevenue)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Commandes confirmées
          </span>
        </div>

        {/* Commandes */}
        <div
          onClick={() => onNavigateTab('admin-commandes')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Commandes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-950">
            {orders.length}
          </p>
          <span className="text-[11px] text-blue-700 font-semibold">
            {activeOrders.length} en cours de traitement
          </span>
        </div>

        {/* Devis */}
        <div
          onClick={() => onNavigateTab('admin-devis')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Devis émis</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-950">
            {quotes.length}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold">
            {pendingQuotes.length} en attente client/admin
          </span>
        </div>

        {/* Paiements en attente */}
        <div
          onClick={() => onNavigateTab('admin-paiements')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 cursor-pointer hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Paiements Wave/OM</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-950">
            {pendingPayments.length}
          </p>
          <span className="text-[11px] text-purple-700 font-semibold">
            À vérifier et confirmer
          </span>
        </div>
      </div>

      {/* CONFIDENTIAL FINANCIAL SECTION: Margins & Inventory (Admin Eyes Only) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-emerald-950 via-slate-900 to-slate-900 text-white shadow-md space-y-4 border border-emerald-900/50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Marges et Rentabilité (Strictement Confidentiel)
              </h3>
              <p className="text-[11px] text-slate-400">
                Calculé d'après les prix d'achat fournisseurs et prix de vente
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            ADMIN ONLY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Marge brute potentielle en stock
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
              {formatFCFA(totalPotentialMargin)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              (Prix de vente - Prix d'achat) × Stock disponible
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Valeur marchande du stock
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {formatFCFA(totalCatalogInventoryValue)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Valeur totale des produits actifs en magasin
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Taux de marge moyen estimé
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block">
              {totalCatalogInventoryValue > 0
                ? `${Math.round((totalPotentialMargin / totalCatalogInventoryValue) * 100)} %`
                : '0 %'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Rentabilité moyenne sur le catalogue
            </span>
          </div>
        </div>
      </div>

      {/* Stock Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Out of stock */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700">
              <PackageX className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Produits en rupture ({outOfStockProducts.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('admin-produits')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Gérer
            </button>
          </div>

          {outOfStockProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Aucun produit en rupture de stock.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {outOfStockProducts.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                    <span className="text-[10px] text-slate-400">REF {p.reference} • {p.category}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                    Stock 0
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Stock limité ({lowStockProducts.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('admin-produits')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Gérer
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Aucun produit en stock critique.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {lowStockProducts.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                    <span className="text-[10px] text-slate-400">REF {p.reference} • {p.category}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200">
                    {p.stock} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
