import React, { useState } from 'react';
import { Product } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatFCFA, getQuoteWhatsAppUrl, getWhatsAppUrl } from '../../utils/formatters';
import { X, Plus, Minus, ShoppingBag, Send, Check, MessageCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  allProducts,
  onSelectProduct,
  onNavigate,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState<number>(1);
  const { addToCart } = useCart();
  const [addedNotice, setAddedNotice] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const similarProducts = allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleInstantQuote = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    onClose();
    onNavigate('panier');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Product Info (Image + Details) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Large Photo */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <ImageWithFallback
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-xs uppercase">
                {product.category}
              </span>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                  REF : {product.reference}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 leading-snug">
                  {product.name}
                </h2>

                {/* Availability Badge */}
                <div className="mt-3">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      Rupture de stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Stock limité ({product.stock} {product.unit} disponibles)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      En stock ({product.stock} {product.unit})
                    </span>
                  )}
                </div>

                {/* Selling Price */}
                <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-xs text-slate-500 font-medium">Prix unitaire TTC</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                      {formatFCFA(product.selling_price)}
                    </span>
                    {product.unit && (
                      <span className="text-sm font-semibold text-slate-600">/ {product.unit}</span>
                    )}
                  </div>
                </div>

                {/* Quantity selector */}
                {!isOutOfStock && (
                  <div className="mt-5 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Quantité :</span>
                    <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center font-extrabold text-sm text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Sous-total : <strong className="text-slate-900 font-bold">{formatFCFA(product.selling_price * quantity)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : addedNotice
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 active:scale-98'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" /> Ajouté au panier !
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Ajouter au panier
                    </>
                  )}
                </button>

                <button
                  onClick={handleInstantQuote}
                  disabled={isOutOfStock}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-98"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  Acheter / Demander un devis
                </button>

                <a
                  href={getWhatsAppUrl(`Bonjour Quincaillerie LDB, je souhaite commander : ${product.name} (REF ${product.reference}) au prix de ${formatFCFA(product.selling_price)}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Commander directement via WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Description du produit</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || 'Produit sélectionné par la Quincaillerie LDB pour répondre aux plus hautes exigences des professionnels et particuliers au Mali.'}
            </p>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Produits similaires</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {similarProducts.map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => {
                      setQuantity(1);
                      onSelectProduct(sim);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                      <ImageWithFallback src={sim.image_url} alt={sim.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{sim.name}</p>
                      <p className="text-[11px] font-extrabold text-emerald-700">{formatFCFA(sim.selling_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
