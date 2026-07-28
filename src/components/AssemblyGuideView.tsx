import React, { useState } from 'react';
import { AssemblyStep, ProductionReport } from '../types';
import { 
  FileText, Copy, Check, Printer, Layers, 
  CheckCircle2, ArrowRight, Sparkles, MapPin, Download
} from 'lucide-react';
import { generateAssemblyGuidePDF } from '../utils/pdfExporter';

interface AssemblyGuideViewProps {
  assemblySteps: AssemblyStep[];
  report: ProductionReport | null;
}

export const AssemblyGuideView: React.FC<AssemblyGuideViewProps> = ({
  assemblySteps,
  report
}) => {
  const [selectedSheetId, setSelectedSheetId] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  if (!report || assemblySteps.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
        Montaj rehberi adımları oluşturuluyor...
      </div>
    );
  }

  // Filter steps if a specific sheet is selected
  const activeSteps = selectedSheetId === 'ALL'
    ? assemblySteps
    : assemblySteps.filter(s => s.sheetId === selectedSheetId);

  // Generate plain-text assembly guide for copying or printing
  const generatePlainTextGuide = (): string => {
    let guide = `========================================================\n`;
    guide += ` SANATSAL MOZAİK MONTAJ REHBERİ - ADIM ADIM DİZİLİM HARİTASI\n`;
    guide += ` Ölçü: ${report.widthM}m x ${report.heightM}m (${report.totalTiles.toLocaleString('tr-TR')} Taş)\n`;
    guide += ` Modüler 30x30 cm File Pano Sayısı: ${report.totalSheets30x30}\n`;
    guide += `========================================================\n\n`;

    activeSteps.forEach((step, idx) => {
      guide += `--------------------------------------------------------\n`;
      guide += ` [ADIM ${idx + 1}] ${step.sheetTitle} (${step.positionLabel})\n`;
      guide += `--------------------------------------------------------\n`;

      step.ranges.forEach(r => {
        guide += ` - ${r.colorCode} (${r.colorName}): ${r.range}\n`;
      });

      guide += `\n Talimatlar:\n`;
      step.instructions.forEach((ins, i) => {
        guide += `   ${i + 1}. ${ins}\n`;
      });
      guide += `\n`;
    });

    return guide;
  };

  const handleCopyTextGuide = () => {
    navigator.clipboard.writeText(generatePlainTextGuide());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    generateAssemblyGuidePDF(activeSteps, report);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-slate-800 flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              3. Montaj Rehberi
            </span>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              MONTAJ REHBERİ (METİN TABANLI)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mozaik ustaları ve atölye dizilimi için adım adım mantıksal renk gruplandırmaları
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>PDF Rehber İndir</span>
          </button>
          <button
            onClick={handleCopyTextGuide}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Metin Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Metin Kopyala</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Yazdır</span>
          </button>
        </div>
      </div>

      {/* Sheet / Panel Filter Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          File Pano Seçimi:
        </span>

        <button
          onClick={() => setSelectedSheetId('ALL')}
          className={`px-3 py-1 rounded border font-mono text-xs whitespace-nowrap transition-colors ${
            selectedSheetId === 'ALL'
              ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Tüm Panolar ({assemblySteps.length} Modül)
        </button>

        {assemblySteps.map((step) => (
          <button
            key={step.sheetId}
            onClick={() => setSelectedSheetId(step.sheetId)}
            className={`px-2.5 py-1 rounded border font-mono text-xs whitespace-nowrap transition-colors ${
              selectedSheetId === step.sheetId
                ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {step.sheetId}
          </button>
        ))}
      </div>

      {/* Steps List - Border Left Accent Style */}
      <div className="grid gap-4">
        {activeSteps.map((step, idx) => (
          <div
            key={step.sheetId}
            className="border-l-4 border-indigo-600 bg-slate-50/50 border-y border-r border-slate-200 rounded-r-lg p-5 hover:bg-slate-50 transition-colors flex flex-col gap-4"
          >
            {/* Step Title & Badge */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{step.sheetTitle}</h4>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 font-medium mt-0.5">
                    <MapPin className="w-3 h-3 text-indigo-600" /> {step.positionLabel}
                  </span>
                </div>
              </div>

              <span className="bg-white border border-slate-200 text-slate-600 font-mono text-xs font-bold px-2.5 py-1 rounded">
                Pano Kodu: {step.sheetId}
              </span>
            </div>

            {/* Logical Color Ranges */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Mantıksal Renk Dizilim Haritası:
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {step.ranges.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded p-2.5 flex items-center gap-3 shadow-2xs"
                  >
                    <span
                      className="w-4 h-4 rounded-sm border border-slate-300 shrink-0 shadow-2xs"
                      style={{ backgroundColor: r.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {r.colorCode} - {r.colorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.count} Taş
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono font-bold mt-0.5 truncate">
                        {r.range}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-white border border-slate-200 rounded p-3 text-xs">
              <span className="font-bold text-slate-700 mb-1.5 block flex items-center gap-1 text-[10px] uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sırasıyla Uygulama Talimatları:
              </span>
              <ul className="space-y-1 text-slate-600 pl-1">
                {step.instructions.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]">
                    <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
