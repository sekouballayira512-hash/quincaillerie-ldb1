import React from 'react';
import { Hammer, Wrench } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 shrink-0 border border-emerald-500/30`}
      >
        <div className="relative flex items-center justify-center">
          <Wrench className="w-4 h-4 text-emerald-100 rotate-45 transform" />
          <Hammer className="w-4 h-4 text-amber-300 -rotate-45 transform -ml-1.5" />
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight leading-none text-slate-900 ${textSizes[size]}`}
        >
          QUINCAILLERIE <span className="text-emerald-700">LDB</span>
        </span>
        {showTagline && (
          <span className="text-[11px] font-medium text-emerald-800/80 tracking-normal mt-0.5">
            Tout pour vos projets au Mali
          </span>
        )}
      </div>
    </div>
  );
};
