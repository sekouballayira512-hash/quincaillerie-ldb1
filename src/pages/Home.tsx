import React from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/products/ProductCard';
import {
  ArrowRight,
  Shield,
  Truck,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Clock,
  MessageCircle,
} from 'lucide-react';
import {
  STORE_NAME,
  STORE_TAGLINE,
  STORE_MOTTO,
  STORE_PHONE,
  STORE_ADDRESS,
  getWhatsAppUrl,
} from '../utils/formatters';

interface HomeProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (p: Product) => void;
  onNavigate: (tab: string) => void;
  loading: boolean;
}

export const Home: React.FC<HomeProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onNavigate,
  loading,
}) => {
  const displayedProducts = products
    .filter(p => selectedCategory === 'Toutes' || p.category === selectedCategory)
    .slice(0, 8);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Promotional Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-lg p-6 sm:p-10">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute right-12 top-4 w-32 h-32 rounded-full bg-amber-400/10 blur-xl" />

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <span>QUINCAILLERIE LDB • MALI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Des outils fiables pour vos grands projets
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base font-medium">
            {STORE_MOTTO} • Matériaux, outillage et plomberie livrés sur vos chantiers à Bamako.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                onSelectCategory('Toutes');
                onNavigate('catalogue');
              }}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Voir la sélection</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={getWhatsAppUrl('Bonjour Quincaillerie LDB, j\'aimerais avoir des informations sur vos matériaux et disponibilités.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all border border-emerald-500/40 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>Devis WhatsApp direct</span>
            </a>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Badges */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Qualité Certifiée</h4>
            <p className="text-[11px] text-slate-500">Marques d'origine</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Devis Rapide</h4>
            <p className="text-[11px] text-slate-500">Réponse sous 2h</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Livraison Chantier</h4>
            <p className="text-[11px] text-slate-500">Partout à Bamako</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Wave & OM</h4>
            <p className="text-[11px] text-slate-500">Paiement manuel direct</p>
          </div>
        </div>
      </section>

      {/* Bloc Demande de Matériel Hors Catalogue (Recherche & Devis WhatsApp) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-800/40 p-5 sm:p-7 shadow-md text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-2.5">
            <h3 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🔧 VOUS AVEZ BESOIN D'UN MATÉRIEL QUI N'EST PAS SUR LE SITE ?</span>
            </h3>

            <p className="text-emerald-400 font-extrabold text-sm sm:text-base">
              Nous pouvons vous le trouver !
            </p>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Qu'il s'agisse de matériel électrique, plomberie, tuyauterie, raccords, robinetterie, appareillage ou autres fournitures, envoyez-nous simplement votre devis ou votre liste de matériel par WhatsApp.
            </p>

            <p className="text-emerald-200 text-xs sm:text-sm font-semibold flex items-start sm:items-center gap-1.5 pt-1">
              <span className="text-emerald-400">✓</span>
              <span>Notre équipe vérifie la disponibilité, vous communique les prix et peut organiser la livraison à Bamako.</span>
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto pt-1 sm:pt-0">
            <a
              href={getWhatsAppUrl("Bonjour Quincaillerie LDB,\n\nJ'ai besoin d'un matériel qui n'est pas affiché sur le site. Voici mon devis / ma liste de matériel :\n- ")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>📲 Envoyer mon devis sur WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Category Horizontal Scrolling Bar */}
      <section className="-mb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Available Products Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
              Produits disponibles
            </h2>
            <p className="text-xs text-slate-500">
              {selectedCategory === 'Toutes'
                ? 'Sélection des articles les plus demandés'
                : `Articles de la catégorie ${selectedCategory}`}
            </p>
          </div>

          <button
            onClick={() => onNavigate('catalogue')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Aucun produit disponible dans cette catégorie.</p>
            <p className="text-xs">Consultez l'ensemble du catalogue ou contactez notre équipe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Store Location & Contact Callout Banner */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Magasin physique à Bamako</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Passez directement à la Quincaillerie LDB
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg">
            {STORE_ADDRESS}. Ouvert du lundi au samedi pour vous approvisionner et obtenir les conseils de nos experts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <a
            href={`tel:${STORE_PHONE.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>{STORE_PHONE}</span>
          </a>

          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contacter Quincaillerie LDB</span>
          </a>
        </div>
      </section>
    </div>
  );
};
