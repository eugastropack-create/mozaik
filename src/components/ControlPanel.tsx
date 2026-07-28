import React, { useRef } from 'react';
import { MosaicConfig, PresetArtwork, TileMaterial } from '../types';
import { PRESET_ARTWORKS } from '../data/presets';
import { 
  Upload, Image as ImageIcon, Sliders, Hash, Layers, 
  Ruler, Palette, Sparkles, RefreshCw, Eye, EyeOff
} from 'lucide-react';

interface ControlPanelProps {
  config: MosaicConfig;
  onChangeConfig: (newConfig: MosaicConfig) => void;
  selectedPreset: PresetArtwork | null;
  onSelectPreset: (preset: PresetArtwork) => void;
  uploadedImage: string | null;
  onImageUpload: (base64: string) => void;
  isProcessing: boolean;
  onGenerate: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChangeConfig,
  selectedPreset,
  onSelectPreset,
  uploadedImage,
  onImageUpload,
  isProcessing,
  onGenerate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const areaM2 = ((config.widthCm / 100) * (config.heightCm / 100)).toFixed(2);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-800 flex flex-col gap-6">
      {/* 1. Referans Görsel Seçimi & Yükleme */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            1. Referans Sanat Eseri / Görsel
          </label>
          <span className="text-[10px] text-slate-400">Yükleyin veya Hazır Eser Seçin</span>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 transition-all rounded p-4 text-center cursor-pointer group mb-4 relative overflow-hidden"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {uploadedImage ? (
            <div className="flex items-center gap-4 text-left">
              <img
                src={uploadedImage}
                alt="Mozaik Referans"
                className="w-16 h-16 object-cover rounded border border-slate-200 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                  Resim Yüklendi
                </span>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  Özel Görsel Kullanılıyor
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Değiştirmek için tıklayın veya yeni dosya sürükleyin
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center">
              <div className="w-9 h-9 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Resim Yüklemek İçin Tıklayın veya Sürükleyin
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                JPG, PNG, WEBP veya SVG desteklenmektedir
              </p>
            </div>
          )}
        </div>

        {/* Preset Gallery Thumbnails */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
            Örnek Mozaik Sanat Eserleri:
          </span>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_ARTWORKS.map((preset) => {
              const isSelected = !uploadedImage && selectedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`group relative rounded overflow-hidden border transition-all text-left ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                  title={preset.title}
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.title}
                    className="w-full h-10 object-cover"
                  />
                  <div className="p-1 bg-white text-[9px] truncate text-slate-700 font-medium border-t border-slate-100">
                    {preset.title.split('(')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 2. Ölçü ve Taş Boyut Parametreleri */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <Ruler className="w-3.5 h-3.5 text-indigo-600" />
          2. Uygulama Alanı & Ölçü Kısıtlamaları
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Genişlik (En - cm)</span>
            <input
              type="number"
              min={20}
              max={1000}
              value={config.widthCm}
              onChange={(e) =>
                onChangeConfig({ ...config, widthCm: Math.max(10, Number(e.target.value)) })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Yükseklik (Boy - cm)</span>
            <input
              type="number"
              min={20}
              max={1000}
              value={config.heightCm}
              onChange={(e) =>
                onChangeConfig({ ...config, heightCm: Math.max(10, Number(e.target.value)) })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Area Badge & Quick Presets */}
        <div className="bg-slate-50 border border-slate-100 rounded p-3 flex items-center justify-between text-xs mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Toplam Mozaik Alanı:</span>
          <span className="font-mono font-bold text-slate-800 text-base">
            {areaM2} m²
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '100x100 cm (1 m²)', w: 100, h: 100 },
            { label: '150x120 cm (1.8 m²)', w: 150, h: 120 },
            { label: '200x150 cm (3 m²)', w: 200, h: 150 },
            { label: '300x200 cm (6 m²)', w: 300, h: 200 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChangeConfig({ ...config, widthCm: preset.w, heightCm: preset.h })}
              className="text-[10px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. Taş & Derz Teknik Detayları */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          3. Taş, Derz ve Materyal Seçimi
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Taş Boyutu (Tile Size) */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Taş Boyutu (mm)</span>
            <select
              value={config.tileSizeMm}
              onChange={(e) => onChangeConfig({ ...config, tileSizeMm: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value={10}>10 x 10 mm (1x1 cm)</option>
              <option value={15}>15 x 15 mm (1.5x1.5 cm)</option>
              <option value={20}>20 x 20 mm (2x2 cm)</option>
              <option value={25}>25 x 25 mm (2.5x2.5 cm)</option>
              <option value={50}>50 x 50 mm (5x5 cm)</option>
            </select>
          </div>

          {/* Derz Boşluğu (Grout Size) */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Derz Boşluğu (mm)</span>
            <select
              value={config.groutSizeMm}
              onChange={(e) => onChangeConfig({ ...config, groutSizeMm: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value={1}>1 mm (Mikro Derz)</option>
              <option value={2}>2 mm (Standart Derz)</option>
              <option value={3}>3 mm (Geniş Derz)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Materyal Tipi */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Materyal Tipi</span>
            <select
              value={config.material}
              onChange={(e) => onChangeConfig({ ...config, material: e.target.value as TileMaterial })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value="cam">Cam Mozaik (~10 kg/m²)</option>
              <option value="seramik">Seramik Mozaik (~14 kg/m²)</option>
              <option value="mermer">Doğal Taş / Mermer (~22 kg/m²)</option>
              <option value="vitray">Vitray Cam Mozaik (~11 kg/m²)</option>
            </select>
          </div>

          {/* Derz Rengi */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Derz Rengi</span>
            <select
              value={config.groutColor}
              onChange={(e) => onChangeConfig({ ...config, groutColor: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value="#1e293b">Koyu Füme / Antrasit</option>
              <option value="#0f172a">Antik Kömür Siyahı</option>
              <option value="#e2e8f0">Açık Gri / Kristal</option>
              <option value="#78350f">Kiremit / Terracotta</option>
              <option value="#f8fafc">Saf Beyaz</option>
            </select>
          </div>
        </div>

        {/* Dizilim Modu & Sanatsal Andamento Seçeneği */}
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Mozaik Dizilim & Akış Tekniği:
            </span>
            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
              {config.tileShape === 'andamento' ? 'Andamento Modu' : 'Klasik Geometrik'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => onChangeConfig({ ...config, tileShape: 'andamento' })}
              className={`p-2 rounded border text-left flex flex-col transition-all ${
                config.tileShape === 'andamento'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold flex items-center justify-between">
                Andamento
                {config.tileShape === 'andamento' && <span className="text-[8px] bg-amber-400 text-slate-900 font-black px-1 rounded">AKTİF</span>}
              </span>
              <span className={`text-[10px] mt-0.5 ${config.tileShape === 'andamento' ? 'text-indigo-100' : 'text-slate-400'}`}>
                Kenar Takip & Akış Çizgileri
              </span>
            </button>

            <button
              onClick={() => onChangeConfig({ ...config, tileShape: 'grid' })}
              className={`p-2 rounded border text-left flex flex-col transition-all ${
                config.tileShape === 'grid'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold">Izgara (Grid)</span>
              <span className={`text-[10px] mt-0.5 ${config.tileShape === 'grid' ? 'text-slate-300' : 'text-slate-400'}`}>
                Düz Dikdörtgen Matris
              </span>
            </button>

            <button
              onClick={() => onChangeConfig({ ...config, tileShape: 'staggered' })}
              className={`p-2 rounded border text-left flex flex-col transition-all ${
                config.tileShape === 'staggered'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold">Şaşırtmalı</span>
              <span className={`text-[10px] mt-0.5 ${config.tileShape === 'staggered' ? 'text-slate-300' : 'text-slate-400'}`}>
                Tuğla / Derz Kaydırmalı
              </span>
            </button>

            <button
              onClick={() => onChangeConfig({ ...config, tileShape: 'hex' })}
              className={`p-2 rounded border text-left flex flex-col transition-all ${
                config.tileShape === 'hex'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold">Altıgen</span>
              <span className={`text-[10px] mt-0.5 ${config.tileShape === 'hex' ? 'text-slate-300' : 'text-slate-400'}`}>
                Bal Peteği Dizilimi
              </span>
            </button>
          </div>

          {/* Andamento Özel Parametreleri */}
          {config.tileShape === 'andamento' && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2.5 bg-white p-2.5 rounded border border-indigo-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 text-[11px]">Sobel Kenar & Detay Algılama:</span>
                <span className="font-mono text-indigo-600 font-bold text-[11px]">
                  Seviye {config.andamentoConfig?.edgeSensitivity || 6} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={config.andamentoConfig?.edgeSensitivity || 6}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    andamentoConfig: {
                      ...(config.andamentoConfig || {
                        edgeSensitivity: 6,
                        concentricRings: true,
                        adaptiveDensity: true,
                        flowJitter: 5
                      }),
                      edgeSensitivity: Number(e.target.value)
                    }
                  })
                }
                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Eş Merkezli Dizilim Toggle */}
                <button
                  onClick={() =>
                    onChangeConfig({
                      ...config,
                      andamentoConfig: {
                        ...(config.andamentoConfig || {
                          edgeSensitivity: 6,
                          concentricRings: true,
                          adaptiveDensity: true,
                          flowJitter: 5
                        }),
                        concentricRings: !config.andamentoConfig?.concentricRings
                      }
                    })
                  }
                  className={`p-1.5 rounded border text-[10px] font-bold text-left transition-colors ${
                    config.andamentoConfig?.concentricRings
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Eş Merkezli (Concentric) Halkalar: {config.andamentoConfig?.concentricRings ? 'AÇIK' : 'KAPALI'}
                </button>

                {/* Adaptif Taş Yoğunluğu Toggle */}
                <button
                  onClick={() =>
                    onChangeConfig({
                      ...config,
                      andamentoConfig: {
                        ...(config.andamentoConfig || {
                          edgeSensitivity: 6,
                          concentricRings: true,
                          adaptiveDensity: true,
                          flowJitter: 5
                        }),
                        adaptiveDensity: !config.andamentoConfig?.adaptiveDensity
                      }
                    })
                  }
                  className={`p-1.5 rounded border text-[10px] font-bold text-left transition-colors ${
                    config.andamentoConfig?.adaptiveDensity
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Kenarda Küçük Taş: {config.andamentoConfig?.adaptiveDensity ? 'AÇIK' : 'KAPALI'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 4. Renk Paleti & Numaralandırma Ayarları */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <Palette className="w-3.5 h-3.5 text-indigo-600" />
          4. Renk Limiti & Görünüm Seçenekleri
        </label>

        {/* Renk Paleti Limiti */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Maksimum Renk Sayısı:</span>
            <span className="font-bold text-indigo-600 font-mono">{config.maxColors} Renk</span>
          </div>
          <div className="flex gap-1.5">
            {[4, 6, 8, 12, 16, 24].map((cnt) => (
              <button
                key={cnt}
                onClick={() => onChangeConfig({ ...config, maxColors: cnt })}
                className={`flex-1 py-1 text-xs font-mono font-medium rounded transition-all border ${
                  config.maxColors === cnt
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Numaralandırma & Grid Toggles */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Numaralandırma Toggle (AÇIK / KAPALI) */}
          <button
            onClick={() => onChangeConfig({ ...config, showNumbers: !config.showNumbers })}
            className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition-all ${
              config.showNumbers
                ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Hash className={`w-4 h-4 ${config.showNumbers ? 'text-amber-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-xs font-bold">Numaralandırma</div>
              <div className="text-[10px] opacity-80">
                {config.showNumbers ? 'AÇIK (ID Ekli)' : 'KAPALI'}
              </div>
            </div>
          </button>

          {/* Grid Çizgileri Toggle */}
          <button
            onClick={() => onChangeConfig({ ...config, showGridLines: !config.showGridLines })}
            className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition-all ${
              config.showGridLines
                ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {config.showGridLines ? (
              <Eye className="w-4 h-4 text-blue-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <div className="text-xs font-bold">Grid Çizgileri</div>
              <div className="text-[10px] opacity-80">
                {config.showGridLines ? 'GÖRÜNÜR' : 'GİZLİ'}
              </div>
            </div>
          </button>
        </div>

        {/* Waste Margin (Fire Payı) */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Üretim Fire Payı (Zayiat):</span>
          <div className="flex gap-1">
            {[5, 10, 15].map((w) => (
              <button
                key={w}
                onClick={() => onChangeConfig({ ...config, wasteMarginPercent: w })}
                className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                  config.wasteMarginPercent === w
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                %{w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Action Button */}
      <button
        onClick={onGenerate}
        disabled={isProcessing}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs uppercase tracking-widest py-3 px-4 rounded transition-colors shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Mozaik Planı İşleniyor...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Plan Dökümü Al / Yenile</span>
          </>
        )}
      </button>
    </div>
  );
};
