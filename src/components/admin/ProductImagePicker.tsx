import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { compressImageFile, formatBytes, CompressedImageResult } from '../../utils/imageUtils';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ProductImagePickerProps {
  imageUrl: string;
  onChange: (url: string) => void;
  category?: string;
}

// Sample fallback photos tailored for Quincaillerie LDB categories
const PRESET_HARDWARE_IMAGES: { label: string; url: string; category: string }[] = [
  {
    label: 'Perceuse / Électroportatif',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    category: 'Outillage',
  },
  {
    label: 'Boîte à outils & clés',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    category: 'Outillage',
  },
  {
    label: 'Plomberie & Vannes',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    category: 'Plomberie',
  },
  {
    label: 'Électricité & Câblage',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    category: 'Électricité',
  },
  {
    label: 'Peinture & Rouleau',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    category: 'Peinture',
  },
  {
    label: 'Matériaux & Ciment',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
    category: 'Matériaux',
  },
];

export const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  imageUrl,
  onChange,
  category,
}) => {
  const [mode, setMode] = useState<'device' | 'url'>('device');
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressedImageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isDataUrl = imageUrl.startsWith('data:image/');

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, etc.).');
      return;
    }

    // Safety: check max original file size (e.g. max 25MB before compression)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('L\'image d\'origine est trop volumineuse (max 25 Mo).');
      return;
    }

    setErrorMsg('');
    setCompressing(true);

    try {
      const result = await compressImageFile(file, 1000, 1000, 0.82);
      setCompressionStats(result);
      onChange(result.dataUrl);
    } catch (err: unknown) {
      console.error('Erreur compression image:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors du traitement de l\'image.'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset input value to allow re-selecting the same file if needed
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClearImage = () => {
    onChange('');
    setCompressionStats(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-3">
      {/* Label and mode switchers */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
          <span>Photo du produit</span>
        </label>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('device')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'device'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Depuis l'appareil</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'url'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Lien Web</span>
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/jpg,image/gif,image/heic,image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Image State / Display */}
      {imageUrl ? (
        /* Image Preview Box */
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-3 overflow-hidden">
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs shrink-0 group">
              <ImageWithFallback
                src={imageUrl}
                alt="Aperçu du produit"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setShowFullPreview(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="Agrandir l'aperçu"
              >
                <Eye className="w-5 h-5 drop-shadow" />
              </button>
            </div>

            {/* Image Information & Actions */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {isDataUrl ? 'Photo de l\'appareil' : 'Image Web configurée'}
                    </span>

                    {compressionStats && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Optimisée : {formatBytes(compressionStats.sizeBytes)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-mono">
                    {isDataUrl
                      ? compressionStats
                        ? `${compressionStats.width}×${compressionStats.height} px • Gain de ${formatBytes(
                            compressionStats.originalSizeBytes - compressionStats.sizeBytes
                          )}`
                        : 'Image intégrée et prête pour le catalogue'
                      : imageUrl}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClearImage}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
                  title="Supprimer la photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons to Replace */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Changer depuis l'appareil</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prendre une photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : mode === 'device' ? (
        /* Device Selector Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
          }`}
        >
          {compressing ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-emerald-800">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold">Optimisation et compression de la photo...</p>
              <p className="text-[11px] text-slate-500">
                Adaptation automatique pour affichage rapide et stockage
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">
                  Sélectionnez une photo du produit dans votre appareil
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Glissez-déposez une image ici ou utilisez l'un des boutons ci-dessous
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choisir un fichier</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-all cursor-pointer"
                  title="Ouvrir la caméra de votre smartphone ou tablette"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Prendre une photo</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                Formats acceptés : JPG, PNG, WebP, GIF, HEIC • Compression automatique intégrée
              </p>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Mode */
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... ou lien Google Drive / Dropbox"
              value={imageUrl}
              onChange={e => onChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-base sm:text-xs text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden font-mono"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Supporte les liens directs HTTPS, photos Google Drive partagées, et liens Dropbox.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Suggested Hardware Presets button */}
      <div>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {showPresets
              ? 'Masquer les photos de démonstration'
              : 'Pas de photo sous la main ? Choisir parmi les suggestions'}
          </span>
        </button>

        {showPresets && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {PRESET_HARDWARE_IMAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setShowPresets(false);
                }}
                className="group p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs text-left transition-all cursor-pointer flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{preset.label}</p>
                  <p className="text-[9px] text-slate-400">{preset.category}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Full Preview */}
      {showFullPreview && imageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 px-2">
              <span className="text-xs font-black text-slate-800">Aperçu grand format</span>
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 max-h-[70vh] overflow-hidden flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Aperçu grand format"
                className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
