import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  Search,
  Bell,
  MessageCircle,
  ShoppingBag,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../firebase/authContext';
import { getWhatsAppUrl, STORE_PHONE } from '../../utils/formatters';

interface HeaderProps {
  onNavigate: (tab: string) => void;
  currentTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadCount?: number;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  currentTab,
  searchQuery,
  setSearchQuery,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalogue');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main top bar */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('accueil')}
            className="cursor-pointer transition-transform active:scale-98"
          >
            <Logo size="md" showTagline={true} />
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Rechercher un produit (outils, tuyaux, ciment, peinture...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100/90 text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-600 focus:bg-white focus:outline-hidden transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Recherche"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Direct WhatsApp Contact Button */}
            <a
              href={getWhatsAppUrl('Bonjour Quincaillerie LDB, je souhaite avoir des renseignements sur vos produits.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition-colors border border-emerald-200/60"
              title="Contacter sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Desktop Cart Button */}
            <button
              onClick={() => onNavigate('panier')}
              className={`relative hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'panier'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Panier</span>
              {totalItems > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-1.5 py-0.2 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User / Login Button */}
            <button
              onClick={() => onNavigate(user ? 'profil' : 'connexion')}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={user ? 'Mon Profil' : 'Se connecter'}
            >
              <User className="w-5 h-5" />
            </button>

            {/* Admin Switcher (ONLY VISIBLE TO VERIFIED ADMINS - never shown to clients) */}
            {isAdmin && (
              <button
                onClick={() => onNavigate(currentTab.startsWith('admin') ? 'accueil' : 'admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  currentTab.startsWith('admin')
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                title="Console Administrateur"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">
                  {currentTab.startsWith('admin') ? 'Vue Boutique' : 'Admin'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Expandable Input */}
        {isSearchActive && (
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                autoFocus
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-100 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
};
