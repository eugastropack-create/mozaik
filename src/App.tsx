import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { MaterialReportView } from './components/MaterialReportView';
import { SvgPreviewView } from './components/SvgPreviewView';
import { AssemblyGuideView } from './components/AssemblyGuideView';

import { MosaicConfig, PresetArtwork, TileData, ProductionReport, AssemblyStep } from './types';
import { PRESET_ARTWORKS } from './data/presets';
import { processImageToTiles } from './utils/mosaicEngine';
import { generateFullWorkshopPackagePDF } from './utils/pdfExporter';

import { FileText, Eye, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Config state
  const [config, setConfig] = useState<MosaicConfig>({
    widthCm: 150,
    heightCm: 120,
    tileSizeMm: 15,
    groutSizeMm: 2,
    maxColors: 12,
    material: 'cam',
    showNumbers: true, // Default ON as required
    showGridLines: true,
    tileShape: 'andamento', // Default to contour-based Andamento flow placement
    groutColor: '#1e293b',
    wasteMarginPercent: 10,
    contrastEnhancement: 10,
    saturationEnhancement: 15,
    andamentoConfig: {
      edgeSensitivity: 6,
      concentricRings: true,
      adaptiveDensity: true,
      flowJitter: 5
    }
  });

  const [selectedPreset, setSelectedPreset] = useState<PresetArtwork | null>(PRESET_ARTWORKS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Calculated state
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [report, setReport] = useState<ProductionReport | null>(null);
  const [assemblySteps, setAssemblySteps] = useState<AssemblyStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);

  // Active view section tab
  const [activeViewSection, setActiveViewSection] = useState<'all' | 'report' | 'svg' | 'assembly'>('all');

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Download Full Workshop Package PDF
  const handleDownloadFullPackagePDF = () => {
    if (report && assemblySteps.length > 0) {
      generateFullWorkshopPackagePDF(report, assemblySteps, config);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetArtwork) => {
    setUploadedImage(null);
    setSelectedPreset(preset);
    setConfig(prev => ({
      ...prev,
      widthCm: preset.defaultWidthCm,
      heightCm: preset.defaultHeightCm,
      tileSizeMm: preset.defaultTileSizeMm,
      maxColors: preset.defaultColors
    }));
  };

  // Handle Image upload
  const handleImageUpload = (base64: string) => {
    setSelectedPreset(null);
    setUploadedImage(base64);
  };

  // Primary Processing Engine Function
  const generateMosaicPlan = async () => {
    setIsProcessing(true);

    try {
      const activeImageUrl = uploadedImage || selectedPreset?.imageUrl || PRESET_ARTWORKS[0].imageUrl;

      // Load image into canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        const canvas = hiddenCanvasRef.current || document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 1. Process client-side pixel matrix & exact SVG tile dataset
          const processed = processImageToTiles(canvas, config);

          setTiles(processed.tiles);
          setAssemblySteps(processed.assemblySteps);

          // 2. Call server-side Gemini AI for expert artistic analysis
          try {
            const aiRes = await fetch('/api/analyze-mosaic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: uploadedImage || null,
                mimeType: 'image/jpeg',
                widthCm: config.widthCm,
                heightCm: config.heightCm,
                tileSizeMm: config.tileSizeMm,
                material: config.material,
                maxColors: config.maxColors
              })
            });

            const aiData = await aiRes.json();
            if (aiData.success && aiData.geminiAnalysis) {
              processed.report.geminiAnalysis = aiData.geminiAnalysis;
            }
          } catch (e) {
            console.warn('Gemini server call fallback used', e);
          }

          setReport(processed.report);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setIsProcessing(false);
      };

      img.src = activeImageUrl;
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
    }
  };

  // Run initial plan on mount or when key selections shift
  useEffect(() => {
    generateMosaicPlan();
  }, [uploadedImage, selectedPreset?.id]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Hidden processing canvas */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Header */}
      <Header onDownloadFullPackagePDF={handleDownloadFullPackagePDF} />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Section View Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveViewSection('all')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeViewSection === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tüm Raporlar ve Çıktılar</span>
            </button>

            <button
              onClick={() => setActiveViewSection('report')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeViewSection === 'report'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Üretim & Materyal Raporu</span>
            </button>

            <button
              onClick={() => setActiveViewSection('svg')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeViewSection === 'svg'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. SVG Görsel & XML Kodu</span>
            </button>

            <button
              onClick={() => setActiveViewSection('assembly')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeViewSection === 'assembly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Adım Adım Montaj Rehberi</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 pr-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Teknik Standartlara Uygun Mozaik Şeması</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Control Panel (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              <ControlPanel
                config={config}
                onChangeConfig={setConfig}
                selectedPreset={selectedPreset}
                onSelectPreset={handleSelectPreset}
                uploadedImage={uploadedImage}
                onImageUpload={handleImageUpload}
                isProcessing={isProcessing}
                onGenerate={generateMosaicPlan}
              />
            </div>
          </div>

          {/* Right Column: Output Sections (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Section 1: ÜRETİM VE MATERYAL RAPORU */}
            {(activeViewSection === 'all' || activeViewSection === 'report') && (
              <MaterialReportView
                report={report}
                config={config}
                selectedColorFilter={selectedColorFilter}
                onSelectColorFilter={setSelectedColorFilter}
              />
            )}

            {/* Section 2: GÖRSEL ÖNİZLEME (SVG FORMATINDA & XML KODU) */}
            {(activeViewSection === 'all' || activeViewSection === 'svg') && (
              <SvgPreviewView
                tiles={tiles}
                config={config}
                report={report}
                selectedColorFilter={selectedColorFilter}
              />
            )}

            {/* Section 3: MONTAJ REHBERİ (METİN TABANLI) */}
            {(activeViewSection === 'all' || activeViewSection === 'assembly') && (
              <AssemblyGuideView
                assemblySteps={assemblySteps}
                report={report}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-700 font-medium">
            Sanatsal Mozaik Üretim Asistanı &bull; Cam, Seramik, Mermer ve Vitray Mozaik Planlama Sistemi
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Otomatik k-means renk quantizasyonu, modüler 30x30 cm file pano kırılımı ve ölçekli XML SVG üreticisi.
          </p>
        </div>
      </footer>
    </div>
  );
}
