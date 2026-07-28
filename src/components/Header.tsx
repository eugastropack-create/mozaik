import React from 'react';
import { Grid, Sparkles, Layers, Box, FileText, Download } from 'lucide-react';

interface HeaderProps {
  onDownloadFullPackagePDF?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDownloadFullPackagePDF }) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Grid className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase font-sans">
                Sanatsal Mozaik Üretim Asistanı <span className="text-slate-400 font-light italic lowercase">Pro</span>
              </h1>
              <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> AI Destekli
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Resim Analizi &bull; Renk Paleti &bull; Üretim Raporu &bull; SVG &bull; Montaj Rehberi
            </p>
          </div>
        </div>

        {/* Feature Highlights & Master PDF Export */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          {onDownloadFullPackagePDF && (
            <button
              onClick={onDownloadFullPackagePDF}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Plan Dökümü (PDF)</span>
            </button>
          )}

          <div className="hidden sm:flex bg-slate-50 border border-slate-200 px-2.5 py-1 rounded items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-indigo-600" />
            <span>30x30 File Panoları</span>
          </div>
          <div className="hidden sm:flex bg-slate-50 border border-slate-200 px-2.5 py-1 rounded items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ölçekli SVG Kodu</span>
          </div>
        </div>
      </div>
    </header>
  );
};


