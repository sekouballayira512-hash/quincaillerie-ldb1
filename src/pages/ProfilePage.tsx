import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  LogOut,
  FileText,
  Truck,
  CreditCard,
  Bell,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

interface ProfilePageProps {
  onNavigate: (tab: string) => void;
  quotesCount: number;
  ordersCount: number;
  paymentsCount: number;
  onNavigateToPayments?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  quotesCount,
  ordersCount,
  paymentsCount,
  onNavigateToPayments,
}) => {
  const { user, userProfile, updateUserProfile, signOutUser, isAdmin } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    onNavigate('accueil');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Connectez-vous à votre compte</h2>
        <p className="text-xs text-slate-500">
          Pour gérer vos informations personnelles, voir vos devis et suivre vos commandes.
        </p>
        <button
          onClick={() => onNavigate('connexion')}
          className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
        >
          Se connecter / S'inscrire
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-sm">
            {userProfile?.fullName?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950">
              {userProfile?.fullName || 'Client LDB'}
            </h1>
            <p className="text-xs text-slate-500">
              Membre depuis le {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'récemment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Tableau de bord Admin</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Quick Access Badges (Devis, Commandes, Paiements) */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('devis')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 text-center transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-slate-900 block">{quotesCount}</span>
          <span className="text-xs font-semibold text-slate-500">Mes Devis</span>
        </button>

        <button
          onClick={() => onNavigate('commandes')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 text-center transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-slate-900 block">{ordersCount}</span>
          <span className="text-xs font-semibold text-slate-500">Mes Commandes</span>
        </button>

        <button
          onClick={() => (onNavigateToPayments ? onNavigateToPayments() : onNavigate('paiements'))}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 text-center transition-all shadow-2xs group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-slate-900 block">{paymentsCount}</span>
          <span className="text-xs font-semibold text-slate-500">Mes Paiements</span>
        </button>
      </div>

      {/* Edit Profile Information Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5">
        <h2 className="font-extrabold text-slate-900 text-base">
          Informations personnelles
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro de téléphone (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || user.email || ''}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 text-xs sm:text-sm text-slate-500 border border-slate-200 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse de livraison ou chantier par défaut
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Torokorobougou, Bamako"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Modifications enregistrées !
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
