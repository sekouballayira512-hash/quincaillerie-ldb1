import React, { useState } from 'react';
import {
  STORE_NAME,
  STORE_PHONE,
  STORE_ADDRESS,
  STORE_TAGLINE,
  STORE_MOTTO,
} from '../../utils/formatters';
import { seedHardwareCatalog, clearAllProducts } from '../../services/seedService';
import { Settings, Database, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminSettingsProps {
  onRefreshAll: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onRefreshAll }) => {
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedDemo = async () => {
    if (!confirm('Charger le catalogue de démonstration initial pour la Quincaillerie LDB ?')) return;
    setLoadingSeed(true);
    setMessage('');
    try {
      const res = await seedHardwareCatalog();
      setMessage(`${res.count} produits de quincaillerie et catégories ont été injectés avec succès.`);
      onRefreshAll();
    } catch (e) {
      console.error(e);
      setMessage('Erreur lors du chargement des données.');
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('ATTENTION : Voulez-vous vraiment supprimer TOUS les produits du catalogue ? Cette action est irréversible.')) return;
    setLoadingClear(true);
    setMessage('');
    try {
      await clearAllProducts();
      setMessage('Le catalogue a été entièrement vidé.');
      onRefreshAll();
    } catch (e) {
      console.error(e);
      setMessage('Erreur lors de la suppression.');
    } finally {
      setLoadingClear(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950">
          Paramètres & Données du Système
        </h1>
        <p className="text-xs text-slate-500">
          Configuration générale de la Quincaillerie LDB et gestion des données initiales
        </p>
      </div>

      {/* Identity information */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-700" />
          <span>Identité Officielle de la Quincaillerie</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Nom de l'entreprise</span>
            <span className="font-bold text-slate-900 text-sm">{STORE_NAME}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Localisation / Pays</span>
            <span className="font-bold text-slate-900 text-sm">Mali • Bamako</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Adresse Physique</span>
            <span className="font-bold text-slate-900">{STORE_ADDRESS}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Téléphone / WhatsApp Officiel</span>
            <span className="font-bold text-slate-900">{STORE_PHONE}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
          <span className="text-emerald-900 font-bold block mb-0.5">Devise & Monnaie de transaction</span>
          <span className="text-emerald-800 font-medium">Franc CFA (FCFA) • Paiement manuel via Wave et Orange Money</span>
        </div>
      </div>

      {/* Database Demonstration & Wipe Tools (Section 43) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-700" />
          <span>Gestion des Données de Test (Section 43)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Pour vous permettre de tester immédiatement l'affichage des produits, la recherche, le panier et la génération de devis PDF, vous pouvez charger le catalogue initial complet de la Quincaillerie LDB ou le réinitialiser avant la mise en production.
        </p>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={loadingSeed || loadingClear}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSeed ? 'animate-spin' : ''}`} />
            <span>{loadingSeed ? 'Injection en cours...' : 'Charger le catalogue de démonstration'}</span>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={loadingSeed || loadingClear}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loadingClear ? 'Suppression...' : 'Vider le catalogue de test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
