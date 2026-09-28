import React, { useEffect, useState } from 'react';
import { UserProfile, Quote, Order } from '../../types';
import { formatFCFA, formatDate, getWhatsAppUrl } from '../../utils/formatters';
import { Users, Phone, Mail, MessageCircle, ShoppingBag, FileText } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface AdminClientsProps {
  quotes: Quote[];
  orders: Order[];
}

export const AdminClients: React.FC<AdminClientsProps> = ({ quotes, orders }) => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
        setClients(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        console.error('Error fetching clients', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950">
          Répertoire Clients
        </h1>
        <p className="text-xs text-slate-500">
          Suivi des clients enregistrés, historique de commandes et volume d'achat
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Chargement des clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Aucun client inscrit pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-3">Téléphone (WhatsApp)</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Date Inscription</th>
                  <th className="py-3 px-3 text-center">Devis</th>
                  <th className="py-3 px-3 text-center">Commandes</th>
                  <th className="py-3 px-4 text-right">Volume d'Achat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map(cli => {
                  const clientQuotes = quotes.filter(q => q.userId === cli.uid || q.clientPhone === cli.phone);
                  const clientOrders = orders.filter(o => o.userId === cli.uid || o.clientPhone === cli.phone);
                  const totalSpent = clientOrders
                    .filter(o => o.status !== 'ANNULÉE')
                    .reduce((sum, o) => sum + o.total, 0);

                  return (
                    <tr key={cli.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {cli.fullName}
                      </td>

                      <td className="py-3.5 px-3">
                        <a
                          href={getWhatsAppUrl(`Bonjour ${cli.fullName}, l'équipe de la Quincaillerie LDB vous contacte concernant vos projets.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>{cli.phone || 'Non renseigné'}</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                        {cli.email || '-'}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {cli.createdAt ? formatDate(cli.createdAt) : '-'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {clientQuotes.length}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {clientOrders.length}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black font-mono text-slate-950">
                        {formatFCFA(totalSpent)}
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
