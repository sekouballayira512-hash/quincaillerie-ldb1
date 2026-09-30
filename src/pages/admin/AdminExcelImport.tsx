import React, { useState } from 'react';
import {
  parseExcelOrCsvFile,
  generateSampleExcelFile,
  ParseExcelResult,
  ParsedProductRow,
} from '../../utils/excelParser';
import { formatFCFA, cleanAndFormatImageUrl } from '../../utils/formatters';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Check,
  ArrowRight,
  ShieldCheck,
  Edit2,
  RefreshCw,
  ImageIcon,
  Wrench,
} from 'lucide-react';
import { importBatchProducts, repairAllExistingProductImages } from '../../services/productService';
import { compressImageFile } from '../../utils/imageUtils';

interface AdminExcelImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminExcelImport: React.FC<AdminExcelImportProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [editableProducts, setEditableProducts] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Existing products image repair state
  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsParsing(true);
    setParseResult(null);

    try {
      const result = await parseExcelOrCsvFile(selected);
      setParseResult(result);
      setEditableProducts(result.products);
    } catch (err) {
      console.error(err);
      alert('Impossible de lire le fichier. Veuillez vous assurer qu\'il s\'agit d\'un fichier .xlsx ou .csv valide.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateField = (index: number, field: keyof ParsedProductRow, value: any) => {
    setEditableProducts(prev => {
      const next = [...prev];
      let val = value;
      if (field === 'image_url') {
        val = cleanAndFormatImageUrl(value);
      }
      const item = { ...next[index], [field]: val };

      // Re-validate row
      const errors: string[] = [];
      if (!item.name || item.name.trim().length === 0) {
        errors.push('Nom manquant');
      }
      if (item.selling_price <= 0) {
        errors.push('Prix de vente doit être supérieur à 0');
      }
      item.isValid = errors.length === 0;
      item.errors = errors;

      next[index] = item;
      return next;
    });
  };

  const handleRowImageUpload = async (index: number, file: File) => {
    if (!file) return;
    try {
      const res = await compressImageFile(file, 1000, 1000, 0.82);
      handleUpdateField(index, 'image_url', res.dataUrl);
    } catch (err: unknown) {
      console.error('Erreur compression image:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors du traitement de l\'image.');
    }
  };

  const handleRepairExisting = async () => {
    setRepairing(true);
    setRepairMsg('');
    try {
      const res = await repairAllExistingProductImages();
      setRepairMsg(`${res.fixed} produit(s) sur ${res.total} mis à jour avec des URLs d'images directes et nettoyées.`);
      onSuccess();
    } catch (e) {
      console.error(e);
      setRepairMsg('Erreur lors de la mise à jour des images.');
    } finally {
      setRepairing(false);
    }
  };

  const validProducts = editableProducts.filter(p => p.isValid);
  const invalidProducts = editableProducts.filter(p => !p.isValid);

  const handleConfirmImport = async () => {
    if (validProducts.length === 0) {
      alert('Aucun produit valide à importer. Veuillez renseigner le nom et le prix de vente pour les lignes en rouge.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await importBatchProducts(validProducts);
      setImportedCount(res.added);
      setImportCompleted(true);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Une erreur est survenue pendant l\'importation.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950">
            Importation Excel / CSV de Produits
          </h1>
          <p className="text-xs text-slate-500">
            Prise en charge directe des URLs de photos (Google Drive, Dropbox, liens web)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Repair existing products button */}
          <button
            onClick={handleRepairExisting}
            disabled={repairing}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-2 border border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Nettoyer et réparer les liens d'images des produits déjà enregistrés"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
            <span>{repairing ? 'Réparation en cours...' : 'Réparer les images déjà importées'}</span>
          </button>

          <button
            onClick={generateSampleExcelFile}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 border border-emerald-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Modèle Excel conforme</span>
          </button>
        </div>
      </div>

      {repairMsg && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-700" />
          <span>{repairMsg}</span>
        </div>
      )}

      {!importCompleted ? (
        <>
          {/* Upload Drop Zone */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-6 sm:p-8 text-center space-y-4 hover:border-emerald-500 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-sm text-slate-900">
                Glissez votre fichier Excel (.xlsx) ou CSV ici
              </p>
              <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
                Colonnes reconnues : <strong>Nom / Article</strong>, <strong>URL / Image / Photo</strong>, <strong>Prix de vente / PV</strong>, <strong>Stock</strong>, <strong>Prix d'achat / PA</strong>, <strong>Référence</strong>, <strong>Catégorie</strong>, <strong>Unité</strong>.
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                ✓ Les liens Google Drive et Dropbox sont automatiquement convertis en images affichables.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
              <Upload className="w-4 h-4" />
              <span>{file ? 'Changer de fichier' : 'Sélectionner mon document Excel'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <p className="text-xs font-semibold text-emerald-800">
                Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} Ko)
              </p>
            )}
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
              <p className="font-bold text-sm text-slate-800">Analyse de votre document et des URLs d'images...</p>
              <p className="text-xs text-slate-400">Détection des colonnes et optimisation des photos</p>
            </div>
          )}

          {parseResult && editableProducts.length > 0 && (
            <div className="space-y-4">
              {/* Detected Columns Banner */}
              {parseResult.detectedColumns.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 shrink-0">Colonnes identifiées :</span>
                  {parseResult.detectedColumns.map((col, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-emerald-800">
                      <strong>"{col.original}"</strong> → {col.mappedTo}
                    </span>
                  ))}
                </div>
              )}

              {/* Validation Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xl font-black block">{validProducts.length}</span>
                    <span className="text-xs font-semibold text-emerald-800">Prêts à être importés</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xl font-black block">{invalidProducts.length}</span>
                    <span className="text-xs font-semibold text-rose-800">Lignes à corriger</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xl font-black block">{parseResult.duplicateReferences.length}</span>
                    <span className="text-xs font-semibold text-amber-800">Doublons de référence</span>
                  </div>
                </div>
              </div>

              {/* Table Preview with Real Image Thumbnail */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                      Aperçu des articles et photos ({editableProducts.length} articles)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Vérifiez que la photo s'affiche correctement dans la colonne « Photo »
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-2 text-center">Photo</th>
                        <th className="py-2.5 px-3">Nom / Désignation</th>
                        <th className="py-2.5 px-2">Référence</th>
                        <th className="py-2.5 px-2">Catégorie</th>
                        <th className="py-2.5 px-2">URL Photo Détectée</th>
                        <th className="py-2.5 px-2 text-right">Prix Vente</th>
                        <th className="py-2.5 px-2 text-right">Prix Achat</th>
                        <th className="py-2.5 px-2 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editableProducts.map((p, idx) => (
                        <tr key={p.id} className={p.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          {/* Statut */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {p.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                                <Check className="w-3 h-3" /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md text-[10px]" title={p.errors.join(' • ')}>
                                {p.errors[0] || 'À corriger'}
                              </span>
                            )}
                          </td>

                          {/* Live Image Thumbnail Preview with device picker */}
                          <td className="py-2 px-2 text-center">
                            <label className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden mx-auto border border-slate-200 shrink-0 block cursor-pointer group" title="Cliquer pour choisir une photo depuis l'appareil">
                              <ImageWithFallback
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Upload className="w-3.5 h-3.5" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleRowImageUpload(idx, f);
                                  e.target.value = '';
                                }}
                                className="hidden"
                              />
                            </label>
                          </td>

                          {/* Editable Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={p.name}
                              placeholder="Nom du produit..."
                              onChange={e => handleUpdateField(idx, 'name', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg text-xs font-semibold focus:outline-hidden ${
                                !p.name ? 'border border-rose-400 bg-rose-50' : 'bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-600'
                              }`}
                            />
                          </td>

                          {/* Reference */}
                          <td className="py-2 px-2 font-mono text-[11px] text-slate-600">
                            <input
                              type="text"
                              value={p.reference}
                              onChange={e => handleUpdateField(idx, 'reference', e.target.value)}
                              className="w-20 px-1 py-1 rounded bg-transparent border border-transparent hover:border-slate-200 text-[11px] font-mono focus:bg-white focus:border-emerald-600"
                            />
                          </td>

                          {/* Category */}
                          <td className="py-2 px-2 text-slate-600">
                            <input
                              type="text"
                              value={p.category}
                              onChange={e => handleUpdateField(idx, 'category', e.target.value)}
                              className="w-20 px-1 py-1 rounded bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-600"
                            />
                          </td>

                          {/* Editable Image URL with device button */}
                          <td className="py-2 px-2 text-slate-500 font-mono text-[10px]">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={p.image_url.startsWith('data:image/') ? '[Photo appareil sélectionnée]' : p.image_url}
                                placeholder="https://..."
                                onChange={e => handleUpdateField(idx, 'image_url', e.target.value)}
                                className="w-32 px-1.5 py-1 rounded bg-transparent border border-transparent hover:border-slate-200 text-[10px] font-mono focus:bg-white focus:border-emerald-600 truncate"
                                title={p.image_url}
                              />
                              <label
                                className="p-1 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 transition-colors cursor-pointer shrink-0"
                                title="Choisir une image depuis l'appareil"
                              >
                                <Upload className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleRowImageUpload(idx, f);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </td>

                          {/* Editable Selling Price */}
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={p.selling_price || ''}
                              placeholder="Prix..."
                              onChange={e => handleUpdateField(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                              className={`w-20 px-1.5 py-1 rounded-lg text-right font-black text-xs focus:outline-hidden ${
                                p.selling_price <= 0
                                  ? 'border border-rose-400 bg-rose-50 text-rose-800'
                                  : 'bg-transparent border border-transparent hover:border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600'
                              }`}
                            />
                          </td>

                          {/* Purchase Price */}
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={p.purchase_price || ''}
                              placeholder="0"
                              onChange={e => handleUpdateField(idx, 'purchase_price', parseFloat(e.target.value) || 0)}
                              className="w-18 px-1.5 py-1 rounded-lg text-right font-mono text-slate-500 text-xs bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-600"
                            />
                          </td>

                          {/* Stock */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={p.stock}
                              onChange={e => handleUpdateField(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                              className="w-14 px-1 py-1 rounded-lg text-center font-bold text-xs bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  {validProducts.length} sur {editableProducts.length} produit(s) prêts à être importés.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isImporting || validProducts.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isImporting
                        ? 'Enregistrement dans la base...'
                        : `Importer ${validProducts.length} produit(s) dans le catalogue`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Success Screen */
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Importation réussie !</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            <strong>{importedCount}</strong> produits ont été enregistrés avec succès dans la base de données. Leurs photos, prix et stocks sont immédiatement visibles dans la boutique.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Retourner au catalogue admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
