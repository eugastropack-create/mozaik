import React, { useState, useRef } from 'react';
import { TileData, MosaicConfig, ProductionReport } from '../types';
import { generateMosaicSVG } from '../utils/mosaicEngine';
import { 
  Code, Eye, Copy, Check, Download, ZoomIn, ZoomOut, 
  RotateCcw, Maximize2, Hash, Sparkles 
} from 'lucide-react';

interface SvgPreviewViewProps {
  tiles: TileData[];
  config: MosaicConfig;
  report: ProductionReport | null;
  selectedColorFilter: string | null;
}

export const SvgPreviewView: React.FC<SvgPreviewViewProps> = ({
  tiles,
  config,
  report,
  selectedColorFilter
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredTile, setHoveredTile] = useState<TileData | null>(null);

  if (!report || tiles.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
        SVG Görsel önizlemesi hazırlanıyor...
      </div>
    );
  }

  // Generate exact XML SVG Code string
  const svgCode = generateMosaicSVG(tiles, config, report);

  // Copy SVG Code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download SVG file
  const handleDownloadSVG = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mozaik_Plan_${report.widthM}x${report.heightM}m_${config.showNumbers ? 'Numbered' : 'Clean'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.5, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-slate-800 flex flex-col gap-6">
      {/* Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              2. SVG Görsel & XML Kodu
            </span>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              GÖRSEL ÖNİZLEME (SVG FORMATINDA)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tam renkli, ölçekli vektör mozaik görünümü ve üretilebilir XML SVG kodu
          </p>
        </div>

        {/* Tab & Download Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 p-1 border border-slate-200 rounded flex items-center gap-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Görsel Önizleme</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>XML Kod Alanı</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSVG}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>SVG İndir</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded px-4 py-2.5 text-slate-700 font-medium">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Hash className={`w-3.5 h-3.5 ${config.showNumbers ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Numaralandırma Modu:</span>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
              config.showNumbers
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {config.showNumbers ? 'AÇIK (ID Numarası)' : 'KAPALI'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Dizilim Tekniği:</span>
            <span className="font-bold font-mono text-indigo-700 text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {config.tileShape === 'andamento' ? 'Andamento (Sobel Kenar & Eş Merkezli Akış)' : config.tileShape.toUpperCase()}
            </span>
          </div>

          {selectedColorFilter && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Seçili Filtre:</span>
              <span
                className="w-3.5 h-3.5 rounded-sm inline-block border border-slate-300"
                style={{ backgroundColor: selectedColorFilter }}
              />
              <span className="font-mono text-indigo-700 font-bold">{selectedColorFilter}</span>
            </div>
          )}
        </div>

        {/* Tile Hover Inspector Badge */}
        {hoveredTile ? (
          <div className="flex items-center gap-2 text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded shadow-xs">
            <span className="font-bold text-slate-800 font-mono">Taş ID: {hoveredTile.id}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-medium">{hoveredTile.colorName} ({hoveredTile.colorCode})</span>
            {hoveredTile.angleDeg !== undefined && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-indigo-600 font-mono font-bold">Açı: {hoveredTile.angleDeg}°</span>
              </>
            )}
            <span
              className="w-3 h-3 rounded-sm inline-block border border-slate-300"
              style={{ backgroundColor: hoveredTile.hex }}
            />
          </div>
        ) : (
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            GRID: {report.gridColumns}x{report.gridRows} | SCALE: 1:10
          </span>
        )}
      </div>

      {/* Tab Content 1: Visual Interactive Preview */}
      {activeTab === 'preview' && (
        <div className="flex flex-col gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Yakınlaştırma: <strong className="text-slate-800 font-mono">{Math.round(zoomLevel * 100)}%</strong>
            </span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                title="Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Render Container - Matches Design HTML archetype */}
          <div className="bg-slate-100 border border-slate-200 rounded p-8 min-h-[450px] max-h-[650px] overflow-auto flex items-center justify-center relative shadow-inner">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="transition-transform duration-200"
            >
              <div className="bg-white p-4 shadow-2xl border border-slate-300 rounded-sm">
                <div
                  dangerouslySetInnerHTML={{ __html: svgCode }}
                  className="max-w-full h-auto cursor-crosshair"
                  onMouseMove={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'rect' && target.id) {
                      const foundTile = tiles.find((t) => t.id === target.id);
                      if (foundTile) setHoveredTile(foundTile);
                    }
                  }}
                  onMouseLeave={() => setHoveredTile(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Raw ```xml ... ``` Code Box */}
      {activeTab === 'code' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Üretilen Tam XML / SVG Vektör Kod Blokları:
            </span>
            <button
              onClick={handleCopyCode}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>XML Kodu Kopyala</span>
                </>
              )}
            </button>
          </div>

          {/* ```xml ... ``` Code Block required strictly by user prompt */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 overflow-x-auto max-h-[500px]">
            <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre font-normal">
              <code>{`\`\`\`xml\n${svgCode}\n\`\`\``}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
