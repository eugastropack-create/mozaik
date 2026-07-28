export type TileMaterial = 'cam' | 'seramik' | 'mermer' | 'vitray';
export type TileShape = 'grid' | 'staggered' | 'hex';

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
  id: string; // e.g., "A1", "B12"
  col: number; // 0-indexed
  row: number; // 0-indexed
  colorIndex: number;
  hex: string;
  colorCode: string;
  colorName: string;
  sheetId: string; // e.g., "File Pano A1"
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
