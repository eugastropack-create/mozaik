export type TileMaterial = 'cam' | 'seramik' | 'mermer' | 'vitray';
export type TileShape = 'grid' | 'staggered' | 'hex' | 'andamento';

export interface AndamentoConfig {
  edgeSensitivity: number; // 1 to 10 (Sobel thresholding)
  concentricRings: boolean; // Concentric rings around facial/feature edges (Opus Vermiculatum)
  adaptiveDensity: boolean; // Smaller tesserae on sharp edges, larger in flat areas
  flowJitter: number; // 0 to 15 degrees organic artisan variation
}

export interface MosaicConfig {
  widthCm: number;
  heightCm: number;
  tileSizeMm: number; // e.g. 10 = 1cm x 1cm, 20 = 2cm x 2cm
  groutSizeMm: number; // e.g. 1mm, 2mm, 3mm
  maxColors: number; // e.g. 6, 8, 12, 16, 24
  material: TileMaterial;
  showNumbers: boolean;
  showGridLines: boolean;
  tileShape: TileShape;
  groutColor: string; // e.g. '#1e293b', '#e2e8f0', '#78350f'
  wasteMarginPercent: number; // e.g. 10%
  contrastEnhancement: number; // -50 to +50
  saturationEnhancement: number; // -50 to +50
  andamentoConfig: AndamentoConfig;
}

export interface ColorPaletteItem {
  id: number;
  code: string; // e.g., "R1", "R2"
  name: string; // e.g., "Koyu Mavi", "Açık Yeşil"
  hex: string;
  count: number;
  percentage: number;
  estimatedWeightKg: number;
  fileSheetCount: number;
}

export interface TileData {
  id: string; // e.g., "A1", "B12" or "T102"
  col: number; // 0-indexed column or grid approximation
  row: number; // 0-indexed row or grid approximation
  colorIndex: number;
  hex: string;
  colorCode: string;
  colorName: string;
  sheetId: string; // e.g., "Pano-1.1"
  // Andamento spatial & orientation properties
  xPx?: number; // Exact center/origin X coordinate in SVG space
  yPx?: number; // Exact center/origin Y coordinate in SVG space
  angleDeg?: number; // Tessera rotation angle (0-360 degrees along edge tangent)
  widthPx?: number; // Adaptive width in SVG space
  heightPx?: number; // Adaptive height in SVG space
  isEdgeTile?: boolean; // True if tile lies on silhouette/edge contour
  flowRing?: number; // Concentric ring distance index
}

export interface ProductionReport {
  totalAreaM2: number;
  widthM: number;
  heightM: number;
  gridColumns: number;
  gridRows: number;
  totalTiles: number;
  tilesWithWaste: number;
  wasteMarginPercent: number;
  estimatedWeightKg: number;
  estimatedGroutKg: number;
  totalSheets30x30: number;
  palette: ColorPaletteItem[];
  geminiAnalysis?: {
    artisticStyle: string;
    colorNotes: string;
    groutRecommendation: string;
    mountingAdvice: string;
  };
}

export interface AssemblyStep {
  sheetId: string;
  sheetTitle: string;
  positionLabel: string;
  ranges: {
    range: string;
    colorName: string;
    colorCode: string;
    hex: string;
    count: number;
  }[];
  instructions: string[];
}

export interface PresetArtwork {
  id: string;
  title: string;
  artist: string;
  category: string;
  imageUrl: string;
  defaultWidthCm: number;
  defaultHeightCm: number;
  defaultTileSizeMm: number;
  defaultColors: number;
  description: string;
}
