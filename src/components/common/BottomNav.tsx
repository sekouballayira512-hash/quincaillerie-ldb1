import React from 'react';
import { Home, Grid, FileText, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const { totalItems } = useCart();

  const navItems = [
    { id: 'accueil', label: 'Accueil', icon: Home },
    { id: 'catalogue', label: 'Catalogue', icon: Grid },
    { id: 'devis', label: 'Devis', icon: FileText },
    { id: 'panier', label: 'Panier', icon: ShoppingBag, badge: totalItems },
    { id: 'commandes', label: 'Commandes', icon: Truck },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg px-2 pb- safe pt-1"
      aria-label="Navigation mobile"
    >
      <div className="flex items-center justify-around h-15 max-w-lg mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs animate-bounce">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-700 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
