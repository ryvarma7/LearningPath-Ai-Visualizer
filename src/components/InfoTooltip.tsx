import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  size?: number;
}

export default function InfoTooltip({ text, size = 16 }: InfoTooltipProps) {
  return (
    <div className="relative inline-block group cursor-help">
      <Info size={size} className="text-indigo-400/60 hover:text-indigo-300 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 border border-indigo-500/40 rounded-lg px-3 py-2 whitespace-normal text-xs text-white shadow-xl z-50 w-48 pointer-events-none">
        {text}
      </div>
    </div>
  );
}
