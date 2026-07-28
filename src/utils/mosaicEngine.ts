import { ColorPaletteItem, MosaicConfig, ProductionReport, TileData, AssemblyStep } from '../types';
import { generateAndamentoTesserae } from './andamentoEngine';

// Palette reference with Turkish names
const COLOR_NAMES_MAP: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Kömür Siyahı' },
  { hex: '#1e293b', name: 'Koyu Gece Lacivert' },
  { hex: '#0f172a', name: 'Derin Siyah Mavi' },
  { hex: '#1e3a8a', name: 'Koyu Safir Mavi' },
  { hex: '#2563eb', name: 'Canlı Kobalt Mavi' },
  { hex: '#38bdf8', name: 'Açık Gök Mavi' },
  { hex: '#06b6d4', name: 'İznik Turkuazı' },
  { hex: '#047857', name: 'Zümrüt Yeşil' },
  { hex: '#16a34a', name: 'Çim Yeşili' },
  { hex: '#84cc16', name: 'Fıstık Yeşili' },
  { hex: '#facc15', name: 'Limon Sarısı' },
  { hex: '#eab308', name: 'Altın Kehribar' },
  { hex: '#d97706', name: 'Bakır Turuncusu' },
  { hex: '#ea580c', name: 'Sıcak Terracotta' },
  { hex: '#dc2626', name: 'Mercan Kırmızısı' },
  { hex: '#991b1b', name: 'Bordo Mermer' },
  { hex: '#701a75', name: 'Derin Patlıcan Mor' },
  { hex: '#c084fc', name: 'Lavant Mavi' },
  { hex: '#f43f5e', name: 'Gül Pembesi' },
  { hex: '#78350f', name: 'Kahve / Mermer Bej' },
  { hex: '#a16207', name: 'Toprak Sarısı' },
  { hex: '#d4d4d8', name: 'Gümüş Gri' },
  { hex: '#64748b', name: 'Füme Gri' },
  { hex: '#f8fafc', name: 'Saf Kristal Beyaz' },
  { hex: '#f5f5f4', name: 'Krem / Traverten Beyaz' },
  { hex: '#e7e5e4', name: 'Doğal Mermer Krem' }
];

// Helper: Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Helper: RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Distance between two RGB colors
export function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  // Weighted RGB euclidean distance for human eye sensitivity
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
}

// Find closest Turkish color name
export function getTurkishColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  let minDistance = Infinity;
  let bestName = 'Özel Renk Taş';

  for (const item of COLOR_NAMES_MAP) {
    const dist = colorDistance(rgb, hexToRgb(item.hex));
    if (dist < minDistance) {
      minDistance = dist;
      bestName = item.name;
    }
  }

  // If exact match isn't in predefined names, construct a logical descriptor
  if (minDistance > 50) {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    const tone = brightness > 180 ? 'Açık ' : brightness < 70 ? 'Koyu ' : 'Orta ';
    if (rgb.r > rgb.g && rgb.r > rgb.b) bestName = tone + 'Kırmızı / Taba';
    else if (rgb.g > rgb.r && rgb.g > rgb.b) bestName = tone + 'Yeşil Mozaik';
    else if (rgb.b > rgb.r && rgb.b > rgb.g) bestName = tone + 'Mavi Mozaik';
    else if (Math.abs(rgb.r - rgb.g) < 20 && Math.abs(rgb.g - rgb.b) < 20) bestName = tone + 'Gri / Taş Tonı';
    else bestName = tone + 'Sıcak Özel Ton';
  }

  return bestName;
}

// K-Means Color Quantization for extracting color palette from image pixels
export function extractPaletteKMeans(
  pixels: { r: number; g: number; b: number }[],
  k: number
): { hex: string; name: string }[] {
  if (pixels.length === 0) {
    return COLOR_NAMES_MAP.slice(0, k);
  }

  // Initialize centroids by choosing spread out pixels
  let centroids: { r: number; g: number; b: number }[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    const idx = Math.min(i * step, pixels.length - 1);
    centroids.push({ ...pixels[idx] });
  }

  // K-means iterations (5 iterations is fast and effective)
  for (let iter = 0; iter < 6; iter++) {
    const clusters: { r: number; g: number; b: number }[][] = Array.from({ length: k }, () => []);

    // Assign pixels to closest centroid
    for (const p of pixels) {
      let minDist = Infinity;
      let clusterIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = colorDistance(p, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = c;
        }
      }
      clusters[clusterIdx].push(p);
    }

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      if (clusters[c].length > 0) {
        let sumR = 0, sumG = 0, sumB = 0;
        for (const p of clusters[c]) {
          sumR += p.r;
          sumG += p.g;
          sumB += p.b;
        }
        centroids[c] = {
          r: Math.round(sumR / clusters[c].length),
          g: Math.round(sumG / clusters[c].length),
          b: Math.round(sumB / clusters[c].length)
        };
      }
    }
  }

  return centroids.map((c, i) => {
    const hex = rgbToHex(c.r, c.g, c.b);
    return {
      hex,
      name: getTurkishColorName(hex)
    };
  });
}

// Process Image & Calculate Grid Matrix
export function processImageToTiles(
  canvas: HTMLCanvasElement,
  config: MosaicConfig
): {
  tiles: TileData[];
  palette: ColorPaletteItem[];
  report: ProductionReport;
  assemblySteps: AssemblyStep[];
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context initialization failed.');

  // Calculate Grid dimensions
  const widthMm = config.widthCm * 10;
  const heightMm = config.heightCm * 10;
  const totalUnitMm = config.tileSizeMm + config.groutSizeMm;

  const cols = Math.max(2, Math.floor((widthMm + config.groutSizeMm) / totalUnitMm));
  const rows = Math.max(2, Math.floor((heightMm + config.groutSizeMm) / totalUnitMm));
  const totalTiles = cols * rows;

  // Sample image down to cols x rows resolution for palette extraction
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  const tempCtx = tempCanvas.getContext('2d')!;

  // Optional image enhancements (contrast, saturation)
  tempCtx.filter = `contrast(${100 + config.contrastEnhancement}%) saturate(${100 + config.saturationEnhancement}%)`;
  tempCtx.drawImage(canvas, 0, 0, cols, rows);

  const imgData = tempCtx.getImageData(0, 0, cols, rows).data;
  const sampledPixels: { r: number; g: number; b: number }[] = [];

  for (let i = 0; i < imgData.length; i += 4) {
    sampledPixels.push({
      r: imgData[i],
      g: imgData[i + 1],
      b: imgData[i + 2]
    });
  }

  // Extract color palette
  const rawPalette = extractPaletteKMeans(sampledPixels, Math.min(config.maxColors, 32));

  // Sheet calculations (30x30 cm file sheets)
  const colsPerSheet = Math.max(1, Math.floor(300 / totalUnitMm));
  const rowsPerSheet = Math.max(1, Math.floor(300 / totalUnitMm));

  let tileList: TileData[] = [];
  let colorCounts: number[] = new Array(rawPalette.length).fill(0);

  if (config.tileShape === 'andamento') {
    // Generate Tesserae using Contour-Based Andamento Engine
    const andamentoRes = generateAndamentoTesserae(canvas, config, rawPalette);
    tileList = andamentoRes.tiles;
    colorCounts = andamentoRes.colorCounts;
  } else {
    // Standard Grid / Staggered / Hex Placement
    for (let r = 0; r < rows; r++) {
      const rowLetter = getRowLabel(r);

      for (let c = 0; c < cols; c++) {
        const pixelIdx = r * cols + c;
        const pixelRgb = sampledPixels[pixelIdx];

        // Match pixel to nearest color in palette
        let minD = Infinity;
        let matchedColorIdx = 0;
        for (let p = 0; p < rawPalette.length; p++) {
          const pRgb = hexToRgb(rawPalette[p].hex);
          const dist = colorDistance(pixelRgb, pRgb);
          if (dist < minD) {
            minD = dist;
            matchedColorIdx = p;
          }
        }

        colorCounts[matchedColorIdx]++;

        const tileId = `${rowLetter}${c + 1}`;
        const sheetCol = Math.floor(c / colsPerSheet) + 1;
        const sheetRow = Math.floor(r / rowsPerSheet) + 1;
        const sheetId = `Pano-${sheetRow}.${sheetCol}`;

        const matchedColor = rawPalette[matchedColorIdx];
        const colorCode = `R${matchedColorIdx + 1}`;

        tileList.push({
          id: tileId,
          col: c,
          row: r,
          colorIndex: matchedColorIdx,
          hex: matchedColor.hex,
          colorCode,
          colorName: matchedColor.name,
          sheetId
        });
      }
    }
  }

  // Calculate area & weight estimations
  const totalAreaM2 = (config.widthCm / 100) * (config.heightCm / 100);

  // Material weight multipliers (kg/m²)
  const weightPerM2Map: Record<string, number> = {
    cam: 10,
    seramik: 14,
    mermer: 22,
    vitray: 11
  };
  const unitWeightM2 = weightPerM2Map[config.material] || 12;
  const estimatedWeightKg = Number((totalAreaM2 * unitWeightM2).toFixed(1));

  // Grout estimation (approx kg per m² based on grout width)
  const estimatedGroutKg = Number((totalAreaM2 * (config.groutSizeMm * 0.75 + 0.5)).toFixed(1));

  // Waste margin calculation
  const wasteMultiplier = 1 + config.wasteMarginPercent / 100;
  const actualTotalTiles = tileList.length || totalTiles;
  const tilesWithWaste = Math.ceil(actualTotalTiles * wasteMultiplier);

  // Construct ColorPaletteItem array
  const paletteItems: ColorPaletteItem[] = rawPalette.map((item, i) => {
    const count = colorCounts[i];
    const percentage = actualTotalTiles > 0 ? Number(((count / actualTotalTiles) * 100).toFixed(1)) : 0;
    const itemWeightKg = Number(((count / actualTotalTiles) * estimatedWeightKg).toFixed(2));
    const fileSheetCount = Math.ceil((count * wasteMultiplier) / (colsPerSheet * rowsPerSheet));

    return {
      id: i + 1,
      code: `R${i + 1}`,
      name: item.name,
      hex: item.hex,
      count,
      percentage,
      estimatedWeightKg: itemWeightKg,
      fileSheetCount
    };
  });

  // Total 30x30 cm mesh sheets required
  const sheetsX = Math.ceil(cols / colsPerSheet);
  const sheetsY = Math.ceil(rows / rowsPerSheet);
  const totalSheets30x30 = sheetsX * sheetsY;

  const report: ProductionReport = {
    totalAreaM2: Number(totalAreaM2.toFixed(2)),
    widthM: Number((config.widthCm / 100).toFixed(2)),
    heightM: Number((config.heightCm / 100).toFixed(2)),
    gridColumns: cols,
    gridRows: rows,
    totalTiles: actualTotalTiles,
    tilesWithWaste,
    wasteMarginPercent: config.wasteMarginPercent,
    estimatedWeightKg,
    estimatedGroutKg,
    totalSheets30x30,
    palette: paletteItems
  };

  // Generate Step-by-step Assembly Steps (Montaj Rehberi)
  const assemblySteps = generateAssemblySteps(tileList, report, sheetsX, sheetsY, colsPerSheet, rowsPerSheet);

  return {
    tiles: tileList,
    palette: paletteItems,
    report,
    assemblySteps
  };
}

// Generate Row Labels: A, B, C ... Z, AA, AB ...
export function getRowLabel(rowIndex: number): string {
  let label = '';
  let n = rowIndex;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

// Generate Modular Assembly Guide Steps
function generateAssemblySteps(
  tiles: TileData[],
  report: ProductionReport,
  sheetsX: number,
  sheetsY: number,
  colsPerSheet: number,
  rowsPerSheet: number
): AssemblyStep[] {
  const steps: AssemblyStep[] = [];

  for (let sy = 0; sy < sheetsY; sy++) {
    for (let sx = 0; sx < sheetsX; sx++) {
      const sheetId = `Pano-${sy + 1}.${sx + 1}`;
      const minCol = sx * colsPerSheet;
      const maxCol = Math.min(report.gridColumns - 1, (sx + 1) * colsPerSheet - 1);
      const minRow = sy * rowsPerSheet;
      const maxRow = Math.min(report.gridRows - 1, (sy + 1) * rowsPerSheet - 1);

      const sheetTiles = tiles.filter(
        t => t.col >= minCol && t.col <= maxCol && t.row >= minRow && t.row <= maxRow
      );

      if (sheetTiles.length === 0) continue;

      const minRowLabel = getRowLabel(minRow);
      const maxRowLabel = getRowLabel(maxRow);
      const startTileId = `${minRowLabel}${minCol + 1}`;
      const endTileId = `${maxRowLabel}${maxCol + 1}`;

      // Group by color inside this sheet
      const colorGroups: Record<string, { colorName: string; colorCode: string; hex: string; count: number; tiles: TileData[] }> = {};

      sheetTiles.forEach(t => {
        if (!colorGroups[t.colorCode]) {
          colorGroups[t.colorCode] = {
            colorName: t.colorName,
            colorCode: t.colorCode,
            hex: t.hex,
            count: 0,
            tiles: []
          };
        }
        colorGroups[t.colorCode].count++;
        colorGroups[t.colorCode].tiles.push(t);
      });

      const ranges = Object.values(colorGroups).map(g => {
        const firstT = g.tiles[0].id;
        const lastT = g.tiles[g.tiles.length - 1].id;
        const rangeStr = g.tiles.length === 1 ? firstT : `${firstT} - ${lastT} (Toplam ${g.count} Adet)`;
        return {
          range: rangeStr,
          colorName: g.colorName,
          colorCode: g.colorCode,
          hex: g.hex,
          count: g.count
        };
      });

      const instructions = [
        `File Panoyu zemin/file hazırlık masasına serin.`,
        `Sol üst köşe (${startTileId}) başlangıç noktasıdır.`,
        ...ranges.map(r => `[${r.colorCode} - ${r.colorName} (${r.hex})]: ${r.range} aralığına ${r.count} adet taş yerleştirin.`),
        `Sağ alt köşe (${endTileId}) ile panoyu tamamlayıp derz boşluklarını kontrol edin.`
      ];

      steps.push({
        sheetId,
        sheetTitle: `30x30 cm File Pano [Sıra ${sy + 1}, Kolon ${sx + 1}]`,
        positionLabel: `${startTileId} - ${endTileId} Aralığı (${sheetTiles.length} Taş)`,
        ranges,
        instructions
      });
    }
  }

  return steps;
}

// Generate SVG string strictly following user requirements
export function generateMosaicSVG(
  tiles: TileData[],
  config: MosaicConfig,
  report: ProductionReport
): string {
  const { gridColumns, gridRows } = report;
  const tilePx = 24; // Scaled representation unit in SVG
  const groutPx = Math.max(1, Math.round(config.groutSizeMm * 1.2));
  const totalUnitPx = tilePx + groutPx;

  const widthPx = gridColumns * totalUnitPx + groutPx;
  const heightPx = gridRows * totalUnitPx + groutPx;

  // Determine font size for numbering
  const fontSize = Math.max(7, Math.min(10, Math.floor(tilePx * 0.38)));

  let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svgContent += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${heightPx}" width="100%" height="100%" shape-rendering="geometricPrecision">\n`;

  // Background (Grout color)
  svgContent += `  <rect width="${widthPx}" height="${heightPx}" fill="${config.groutColor}" />\n`;

  // Filter & styles if numbering is on
  if (config.showNumbers) {
    svgContent += `  <style>\n`;
    svgContent += `    .t-lbl { font-family: 'Courier New', monospace, sans-serif; font-weight: bold; font-size: ${fontSize}px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }\n`;
    svgContent += `  </style>\n`;
  }

  // Tile group
  svgContent += `  <g id="mosaic-tiles">\n`;

  const isAndamento = config.tileShape === 'andamento';

  for (const t of tiles) {
    let x = groutPx + t.col * totalUnitPx;
    let y = groutPx + t.row * totalUnitPx;
    let w = tilePx;
    let h = tilePx;
    let angle = t.angleDeg || 0;

    if (isAndamento && t.xPx !== undefined && t.yPx !== undefined) {
      x = t.xPx - (t.widthPx || tilePx) / 2;
      y = t.yPx - (t.heightPx || tilePx) / 2;
      w = t.widthPx || tilePx;
      h = t.heightPx || tilePx;
    } else if (config.tileShape === 'staggered' && t.row % 2 === 1) {
      x += totalUnitPx / 2;
    }

    const rx = config.tileSizeMm >= 15 ? 2 : 1;

    if (isAndamento && t.xPx !== undefined && t.yPx !== undefined) {
      svgContent += `    <rect id="${t.id}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" transform="rotate(${angle}, ${t.xPx.toFixed(1)}, ${t.yPx.toFixed(1)})" fill="${t.hex}" stroke="${config.groutColor}" stroke-width="0.5" data-color-code="${t.colorCode}" data-color-name="${t.colorName}" />\n`;
    } else if (config.tileShape === 'hex') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = w / 2;
      const points = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        points.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
      }
      svgContent += `    <polygon id="${t.id}" points="${points.join(' ')}" fill="${t.hex}" stroke="${config.groutColor}" stroke-width="0.5" data-color-code="${t.colorCode}" data-color-name="${t.colorName}" />\n`;
    } else {
      svgContent += `    <rect id="${t.id}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="${t.hex}" stroke="none" data-color-code="${t.colorCode}" data-color-name="${t.colorName}" />\n`;
    }

    if (config.showNumbers) {
      const rgb = hexToRgb(t.hex);
      const lum = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      const fontColor = lum > 140 ? '#000000' : '#ffffff';

      const cx = isAndamento && t.xPx !== undefined ? t.xPx : x + w / 2;
      const cy = isAndamento && t.yPx !== undefined ? t.yPx : y + h / 2;
      const labelText = t.id;

      if (isAndamento && t.xPx !== undefined && t.yPx !== undefined) {
        svgContent += `    <text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" fill="${fontColor}" class="t-lbl" transform="rotate(${angle}, ${cx.toFixed(1)}, ${cy.toFixed(1)})">${labelText}</text>\n`;
      } else {
        svgContent += `    <text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" fill="${fontColor}" class="t-lbl">${labelText}</text>\n`;
      }
    }
  }

  svgContent += `  </g>\n`;
  svgContent += `</svg>`;

  return svgContent;
}

