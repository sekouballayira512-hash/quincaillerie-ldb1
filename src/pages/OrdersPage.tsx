import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { formatFCFA, formatDate, getOrderStatusBadge } from '../utils/formatters';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface OrdersPageProps {
  orders: Order[];
  onNavigate: (tab: string) => void;
  onRefreshOrders?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders, onNavigate, onRefreshOrders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders.length > 0 ? orders[0] : null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0]);
    } else if (selectedOrder) {
      // Keep selected order updated with latest data
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder]);

  const handleManualRefresh = async () => {
    if (!onRefreshOrders) return;
    setIsRefreshing(true);
    try {
      await onRefreshOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Aucune commande en cours</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Dès qu'un devis et son paiement sont validés par la Quincaillerie LDB, votre commande apparaît ici avec le suivi en direct de sa préparation et livraison.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('devis')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Consulter mes devis</span>
          </button>

          <button
            onClick={() => onNavigate('catalogue')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Faire des achats</span>
          </button>
        </div>
      </div>
    );
  }

  const getTimelineSteps = (currentStatus: string) => {
    const steps = [
      { id: 'CONFIRMÉE', label: 'Confirmée' },
      { id: 'EN PRÉPARATION', label: 'En préparation' },
      { id: 'PRÊTE', label: 'Prête en magasin' },
      { id: 'EN LIVRAISON', label: 'En livraison' },
      { id: 'LIVRÉE', label: 'Livrée' },
    ];

    const statusOrder = ['CONFIRMÉE', 'EN PRÉPARATION', 'PRÊTE', 'EN LIVRAISON', 'LIVRÉE'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, idx) => ({
      ...step,
      completed: currentIndex >= idx,
      current: currentIndex === idx,
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Mes Commandes
          </h1>
          <p className="text-xs text-slate-500">
            Suivi de l'acheminement et état d'avancement de vos matériaux
          </p>
        </div>

        {onRefreshOrders && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer self-start sm:self-auto active:scale-95 disabled:opacity-50"
            title="Actualiser les commandes"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Actualiser</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Order list */}
        <div className="space-y-3">
          {orders.map(ord => {
            const badge = getOrderStatusBadge(ord.status);
            const isSelected = selectedOrder?.id === ord.id;

            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {ord.orderNumber}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(ord.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{ord.items.length} article(s)</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">TOTAL PAYÉ</span>
                    <span className="font-black text-slate-950 text-sm">
                      {formatFCFA(ord.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order detail & timeline */}
        {selectedOrder && (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Commande validée & payée</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirmée le {formatDate(selectedOrder.createdAt, true)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Montant réglé</span>
                <span className="text-xl font-black text-emerald-800">
                  {formatFCFA(selectedOrder.total)}
                </span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  {selectedOrder.paymentMethod || 'Wave / Orange Money'} • PAYÉ
                </span>
              </div>
            </div>

            {/* Visual Timeline Tracking */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Progression de la commande
              </h3>

              <div className="relative flex items-center justify-between">
                <div className="absolute left-2 right-2 top-3 h-0.5 bg-slate-200 -z-0" />
                {getTimelineSteps(selectedOrder.status).map(step => (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        step.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border-2 border-slate-300 text-transparent'
                      }`}
                    >
                      {step.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-bold text-center whitespace-nowrap ${
                        step.current
                          ? 'text-emerald-800'
                          : step.completed
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Quote reference block */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-900 font-bold block">Statut du règlement</span>
                <p className="text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Règlement validé par Quincaillerie LDB</span>
                </p>
              </div>

              {selectedOrder.quoteId && (
                <div>
                  <span className="text-emerald-900 font-bold block">Devis d'origine</span>
                  <button
                    onClick={() => onNavigate('devis')}
                    className="text-emerald-700 hover:underline font-semibold mt-0.5 flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Consulter le devis associé</span>
                  </button>
                </div>
              )}
            </div>

            {/* Items list */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Articles commandés ({selectedOrder.items.length})
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        REF {item.reference} • {item.quantity} {item.unit || 'pièce'}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {formatFCFA(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Pickup / Delivery Information */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Point de retrait & Expédition</p>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Quincaillerie LDB • Torokorobougou, en face du tribunal, Bamako. Vous pouvez récupérer vos articles directement en magasin ou vous faire livrer par camion sur votre chantier.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
