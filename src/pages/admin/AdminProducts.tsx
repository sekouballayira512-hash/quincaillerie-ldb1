import React, { useState } from 'react';
import { ProductWithCost } from '../../types';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { formatFCFA } from '../../utils/formatters';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  repairAllExistingProductImages,
} from '../../services/productService';
import { ProductImagePicker } from '../../components/admin/ProductImagePicker';

interface AdminProductsProps {
  products: ProductWithCost[];
  categories: string[];
  onRefresh: () => void;
  onNavigateToImport: () => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  onRefresh,
  onNavigateToImport,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [editingProduct, setEditingProduct] = useState<ProductWithCost | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Outillage');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(10);
  const [formUnit, setFormUnit] = useState('Pièce');
  const [formActive, setFormActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [repairingPhotos, setRepairingPhotos] = useState(false);
  const [repairMsg, setRepairMsg] = useState('');

  const handleRepairPhotos = async () => {
    setRepairingPhotos(true);
    setRepairMsg('');
    try {
      const res = await repairAllExistingProductImages();
      setRepairMsg(`${res.fixed} photo(s) réparée(s) et mise(s) à jour.`);
      onRefresh();
    } catch {
      setRepairMsg('Erreur lors de la mise à jour des photos.');
    } finally {
      setRepairingPhotos(false);
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormName('');
    setFormRef(`REF-LDB-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDesc('');
    setFormCategory(categories[0] || 'Outillage');
    setFormImageUrl('');
    setFormSellingPrice(0);
    setFormPurchasePrice(0);
    setFormStock(10);
    setFormUnit('Pièce');
    setFormActive(true);
    setErrorMsg('');
  };

  const openEditModal = (p: ProductWithCost) => {
    setEditingProduct(p);
    setIsCreating(false);
    setFormName(p.name);
    setFormRef(p.reference);
    setFormDesc(p.description);
    setFormCategory(p.category);
    setFormImageUrl(p.image_url);
    setFormSellingPrice(p.selling_price);
    setFormPurchasePrice(p.purchase_price || 0);
    setFormStock(p.stock);
    setFormUnit(p.unit || 'Pièce');
    setFormActive(p.active);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Le nom du produit est obligatoire.');
      return;
    }
    if (formSellingPrice <= 0) {
      setErrorMsg('Le prix de vente doit être supérieur à 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        reference: formRef.trim(),
        description: formDesc.trim(),
        category: formCategory,
        image_url:
          formImageUrl.trim() ||
          'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
        selling_price: Number(formSellingPrice),
        stock: Number(formStock),
        unit: formUnit.trim() || 'Pièce',
        active: formActive,
      };

      if (isCreating) {
        await createProduct(payload, Number(formPurchasePrice));
      } else if (editingProduct) {
        await updateProduct(editingProduct.id, payload, Number(formPurchasePrice));
      }

      setEditingProduct(null);
      setIsCreating(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement "${name}" du catalogue ?`)) return;
    try {
      await deleteProduct(id);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (p: ProductWithCost) => {
    try {
      await updateProduct(p.id, { active: !p.active });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter(p => {
    const matchesCat = categoryFilter === 'Toutes' || p.category === categoryFilter;
    const matchesQuery =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950">
            Gestion du Catalogue & Prix
          </h1>
          <p className="text-xs text-slate-500">
            Gestion des stocks, prix d'achat confidentiels et marges unitaires
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRepairPhotos}
            disabled={repairingPhotos}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Nettoyer les URLs Google Drive, Dropbox ou HTTP des photos existantes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${repairingPhotos ? 'animate-spin' : ''}`} />
            <span>{repairingPhotos ? 'Réparation...' : 'Réparer les photos'}</span>
          </button>

          <button
            onClick={onNavigateToImport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Importer Excel</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      {repairMsg && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-700" />
          <span>{repairMsg}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600 cursor-pointer"
          >
            <option value="Toutes">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3 text-right">Prix d'Achat (Conf.)</th>
                <th className="py-3 px-3 text-right">Prix de Vente</th>
                <th className="py-3 px-3 text-right">Marge Unitaire</th>
                <th className="py-3 px-3 text-right">Marge Potentielle</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => {
                const purchasePrice = p.purchase_price || 0;
                const unitMargin = p.selling_price - purchasePrice;
                const potentialMargin = unitMargin * p.stock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <ImageWithFallback src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold">REF {p.reference}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.category}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          p.stock <= 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : p.stock <= 5
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.stock} {p.unit || 'pcs'}
                      </span>
                    </td>

                    {/* Purchase Price (Confidential) */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-500">
                      {formatFCFA(purchasePrice)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                      {formatFCFA(p.selling_price)}
                    </td>

                    {/* Unit Margin */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      +{formatFCFA(unitMargin)}
                    </td>

                    {/* Potential Margin */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-800">
                      {formatFCFA(potentialMargin)}
                    </td>

                    {/* Active toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.active
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={p.active ? 'Actif dans la boutique' : 'Masqué pour les clients'}
                      >
                        {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {(isCreating || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-black text-slate-900 text-base">
                {isCreating ? 'Ajouter un nouveau produit' : 'Modifier le produit'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Perceuse Bosch 650W"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Référence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MB001"
                    value={formRef}
                    onChange={e => setFormRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Photo Selector (From Device, Camera, Web URL, or Presets) */}
              <ProductImagePicker
                imageUrl={formImageUrl}
                onChange={setFormImageUrl}
                category={formCategory}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Courte description pour le catalogue et la fiche produit..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              {/* Pricing & Confidential Purchase Price */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                  Tarification & Rentabilité
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Prix d'achat FCFA (Confidentiel)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formPurchasePrice}
                      onChange={e => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs sm:text-sm font-bold text-slate-900 border border-amber-300 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Prix de vente public FCFA *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formSellingPrice}
                      onChange={e => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs sm:text-sm font-black text-emerald-800 border border-emerald-300 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-amber-200/60">
                  <span>Marge unitaire : <strong className="text-emerald-800 font-extrabold">{formatFCFA(formSellingPrice - formPurchasePrice)}</strong></span>
                  <span>Marge potentielle : <strong className="text-emerald-800 font-extrabold">{formatFCFA((formSellingPrice - formPurchasePrice) * formStock)}</strong></span>
                </div>
              </div>

              {/* Stock and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantité en stock *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={e => setFormStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unité de vente
                  </label>
                  <input
                    type="text"
                    placeholder="Pièce, Sac, Mètre, Pot 15L..."
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Rendre ce produit visible et actif dans le catalogue</span>
              </label>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
