import React from 'react';
import { Order, OrderStatus } from '../../types';
import { formatFCFA, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { updateOrderStatus } from '../../services/orderService';

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onRefresh }) => {
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erreur lors du changement de statut de la commande.');
    }
  };

  const statusOptions: OrderStatus[] = [
    'CONFIRMÉE',
    'EN PRÉPARATION',
    'PRÊTE',
    'EN LIVRAISON',
    'LIVRÉE',
    'ANNULÉE',
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950">
          Suivi des Commandes
        </h1>
        <p className="text-xs text-slate-500">
          Préparation, mise à disposition en magasin et livraisons chantiers
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Aucune commande enregistrée</p>
            <p className="text-xs text-slate-400">Les commandes confirmées après paiement apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-4">Commande #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Articles</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-center">Statut Actuel</th>
                  <th className="py-3 px-4 text-right">Changer l'état</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(ord => {
                  const badge = getOrderStatusBadge(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(ord.createdAt, true)}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{ord.clientName}</p>
                        <p className="text-[10px] text-slate-500">{ord.clientPhone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {ord.items.length} article(s)
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-slate-950 font-mono">
                        {formatFCFA(ord.total)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={ord.status}
                          onChange={e => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                          aria-label={`Changer l'état de la commande ${ord.orderNumber}`}
                          className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-emerald-600"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
