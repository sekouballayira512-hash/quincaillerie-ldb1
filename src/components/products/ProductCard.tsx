import React from 'react';
import { Product } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatFCFA } from '../../utils/formatters';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, cart } = useCart();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const cartItem = cart.find(it => it.product.id === product.id);
  const currentInCart = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer hover:border-emerald-300"
    >
      <div>
        {/* Product Image Area */}
        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
          <ImageWithFallback
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Category Tag overlay */}
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-700 tracking-wide uppercase shadow-xs">
            {product.category}
          </span>

          {/* Cart Quantity Badge if already added */}
          {currentInCart > 0 && (
            <span className="absolute top-2.5 right-2.5 bg-emerald-700 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3" /> {currentInCart} dans le panier
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-4">
          {/* Reference */}
          <p className="text-[11px] font-semibold text-emerald-800/80 tracking-wider uppercase mb-0.5">
            REF {product.reference}
          </p>

          {/* Name */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description || 'Matériel professionnel de qualité pour vos travaux et chantiers.'}
          </p>

          {/* Availability Badge */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                Rupture de stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
                Stock limité ({product.stock} {product.unit})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Disponible
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="p-3 sm:p-4 pt-0 sm:pt-0 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Prix unitaire</span>
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-slate-950 text-base sm:text-lg tracking-tight">
              {formatFCFA(product.selling_price)}
            </span>
            {product.unit && (
              <span className="text-[11px] text-slate-500 font-normal">/ {product.unit}</span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Produit indisponible' : `Ajouter ${product.name} au panier`}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs shadow-emerald-700/20 hover:shadow-md'
          }`}
        >
          {isOutOfStock ? (
            'Épuisé'
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Ajouter</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
