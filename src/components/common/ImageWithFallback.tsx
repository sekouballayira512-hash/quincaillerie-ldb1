import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { cleanAndFormatImageUrl } from '../../utils/formatters';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Produit Quincaillerie LDB',
  className = '',
  fallbackSrc,
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clean and sanitize the URL (handles Google Drive, Dropbox, quotes, spaces, http/https)
  const cleanedSrc = cleanAndFormatImageUrl(src);

  const defaultHardwareFallback =
    fallbackSrc ||
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80';

  // Reset error state if the src prop changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse text-slate-300">
          <Wrench className="w-7 h-7 opacity-40 animate-spin" />
        </div>
      )}

      {error || !cleanedSrc ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50/50 p-2 text-center text-slate-400 select-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-1">
            <Wrench className="w-5 h-5 text-emerald-800" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 line-clamp-1 px-1">
            {alt && alt !== 'Produit Quincaillerie LDB' ? alt : 'Quincaillerie LDB'}
          </span>
          <span className="text-[9px] text-emerald-700/80 font-semibold uppercase">LDB Bamako</span>
        </div>
      ) : (
        <img
          src={cleanedSrc || defaultHardwareFallback}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
