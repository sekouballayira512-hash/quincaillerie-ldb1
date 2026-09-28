import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/products/ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, X, AlertCircle } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (p: Product) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
}

type SortOption = 'pertinence' | 'prix-asc' | 'prix-desc' | 'nouveautes' | 'disponibilite';

export const Catalog: React.FC<CatalogProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  searchQuery,
  setSearchQuery,
  loading,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('pertinence');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Category filter
      if (selectedCategory !== 'Toutes' && p.category !== selectedCategory) {
        return false;
      }

      // Stock filter
      if (inStockOnly && p.stock <= 0) {
        return false;
      }

      // Search query (nom, reference, categorie, description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRef = p.reference.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);

        if (!matchesName && !matchesRef && !matchesCat && !matchesDesc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'prix-asc':
        result.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case 'prix-desc':
        result.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case 'nouveautes':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'disponibilite':
        result.sort((a, b) => b.stock - a.stock);
        break;
      case 'pertinence':
      default:
        // Prioritize in-stock then by name
        result.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));
        break;
    }

    return result;
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un produit (nom, référence ex: MB001, CPVC...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls (Categories + Sorting) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Categories Pill list */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort & Stock quick toggles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* In stock only toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>En stock uniquement</span>
            </label>

            {/* Sort selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Trier les produits"
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 pl-3 pr-7 rounded-xl border-none focus:ring-2 focus:ring-emerald-600 cursor-pointer appearance-none"
              >
                <option value="pertinence">Tri: Pertinence</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
                <option value="nouveautes">Nouveautés</option>
                <option value="disponibilite">Disponibilité</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Affichage de <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> produit(s)
          {selectedCategory !== 'Toutes' && ` dans « ${selectedCategory} »`}
          {searchQuery && ` pour « ${searchQuery} »`}
        </span>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
              <div className="aspect-4/3 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Aucun produit trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nous n'avons trouvé aucun article correspondant à vos critères de recherche. Essayez d'autres mots-clés ou réinitialisez les filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('Toutes');
              setInStockOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
