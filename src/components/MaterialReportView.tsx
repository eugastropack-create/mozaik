import React from 'react';
import { ProductionReport, MosaicConfig } from '../types';
import { 
  Package, Scale, LayoutGrid, FileCheck, Layers, 
  Printer, Download, Sparkles, FileText
} from 'lucide-react';
import { generateMaterialReportPDF } from '../utils/pdfExporter';

interface MaterialReportViewProps {
  report: ProductionReport | null;
  config: MosaicConfig;
  selectedColorFilter: string | null;
  onSelectColorFilter: (hex: string | null) => void;
}

export const MaterialReportView: React.FC<MaterialReportViewProps> = ({
  report,
  config,
  selectedColorFilter,
  onSelectColorFilter
}) => {
  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
        Üretim raporu oluşturulmak üzere resim işleniyor...
      </div>
    );
  }

  // Export report to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Renk Kodu;Renk Adi;Hex Kodu;Tas Adedi;Fireli Adet (%10);Yuzde (%);Tahmini Agirlik (kg);File Pano Sayisi\n";

    report.palette.forEach(item => {
      const wasteCount = Math.ceil(item.count * (1 + report.wasteMarginPercent / 100));
      csvContent += `${item.code};${item.name};${item.hex};${item.count};${wasteCount};${item.percentage}%;${item.estimatedWeightKg};${item.fileSheetCount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mozaik_Uretim_Raporu_${report.widthM}x${report.heightM}m.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    generateMaterialReportPDF(report, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-slate-800 flex flex-col gap-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              1. Üretim & Materyal Raporu
            </span>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              ÜRETİM VE MATERYAL RAPORU
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Teknik metraj, malzeme ağırlığı ve renk bazlı sipariş adetleri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            PDF Raporu İndir
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV İndir
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            Yazdır
          </button>
        </div>
      </div>

      {/* 4 Core Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Toplam Alan */}
        <div className="bg-slate-50 border border-slate-100 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Toplam Alan</span>
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-slate-800">
              {report.totalAreaM2} m²
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {report.widthM}m x {report.heightM}m ({report.gridColumns}x{report.gridRows})
            </p>
          </div>
        </div>

        {/* Toplam Taş Sayısı */}
        <div className="bg-slate-50 border border-slate-100 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Toplam Taş Sayısı</span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-slate-800">
              {report.totalTiles.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">Adet</span>
            </span>
            <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
              +{report.wasteMarginPercent}% Fire: {report.tilesWithWaste.toLocaleString('tr-TR')} Adet
            </p>
          </div>
        </div>

        {/* Tahmini Ağırlık */}
        <div className="bg-slate-50 border border-slate-100 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Tahmini Ağırlık</span>
            <Scale className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-slate-800">
              {report.estimatedWeightKg} kg
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Derz Dolgusu: ~{report.estimatedGroutKg} kg
            </p>
          </div>
        </div>

        {/* 30x30 cm File Panolar */}
        <div className="bg-slate-50 border border-slate-100 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>30x30 File Pano</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-slate-800">
              {report.totalSheets30x30} Pano
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Modüler File Montaj
            </p>
          </div>
        </div>
      </div>

      {/* Gerekli Taş Envanteri Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-slate-600" />
            Gerekli Taş Envanteri & Renk Dağılımı
          </h3>
          {selectedColorFilter && (
            <button
              onClick={() => onSelectColorFilter(null)}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Filtreyi Temizle ({selectedColorFilter})
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-3">Kod</th>
                <th className="p-3">Renk Taş</th>
                <th className="p-3">Renk Adı</th>
                <th className="p-3 text-right">Net Adet</th>
                <th className="p-3 text-right">Fireli Adet (%{report.wasteMarginPercent})</th>
                <th className="p-3 text-center">Oran (%)</th>
                <th className="p-3 text-right">Ağırlık (kg)</th>
                <th className="p-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {report.palette.map((item) => {
                const wasteCount = Math.ceil(item.count * (1 + report.wasteMarginPercent / 100));
                const isSelected = selectedColorFilter === item.hex;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectColorFilter(isSelected ? null : item.hex)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 font-semibold text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="p-3 font-bold text-slate-800">{item.code}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-sm border border-slate-300 shadow-xs inline-block"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="text-[10px] text-slate-500 uppercase">{item.hex}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-800 font-sans font-medium">{item.name}</td>
                    <td className="p-3 text-right text-slate-800 font-bold">
                      {item.count.toLocaleString('tr-TR')}
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-bold">
                      {wasteCount.toLocaleString('tr-TR')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600">{item.percentage}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-600">{item.estimatedWeightKg} kg</td>
                    <td className="p-3 text-center">
                      <button className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded hover:bg-slate-200">
                        {isSelected ? 'Filtrelendi' : 'Grid\'de Göster'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gemini AI Expert Master Notes */}
      {report.geminiAnalysis && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded p-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-indigo-900 mb-2 uppercase tracking-wide text-[11px]">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Mozaik Sanatçısı & Usta Tavsiyeleri</span>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div>
              <span className="font-semibold text-slate-900 block">Sanatsal Stil & Renk Algısı:</span>
              <p className="text-slate-600 mt-0.5">{report.geminiAnalysis.artisticStyle}</p>
              <p className="text-slate-600 mt-1">{report.geminiAnalysis.colorNotes}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block">Derz Dolgusu & Montaj Uyarısı:</span>
              <p className="text-indigo-900 font-medium mt-0.5">{report.geminiAnalysis.groutRecommendation}</p>
              <p className="text-slate-600 mt-1">{report.geminiAnalysis.mountingAdvice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
