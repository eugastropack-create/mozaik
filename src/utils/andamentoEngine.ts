import { MosaicConfig, TileData, ColorPaletteItem } from '../types';
import { colorDistance, hexToRgb, rgbToHex, getRowLabel } from './mosaicEngine';

export interface GradientPoint {
  r: number;
  g: number;
  b: number;
  gray: number;
  magnitude: number;
  flowAngleRad: number; // Tangent angle (parallel to edge) in radians
  flowAngleDeg: number; // Tangent angle in degrees
  isEdge: boolean;
  distanceToEdge: number;
}

/**
 * Perform Sobel Edge Detection and compute Gradient Flow Vectors
 */
export function computeSobelGradients(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sensitivity: number = 5
): GradientPoint[][] {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // 1. Create Grayscale Map
  const grayMap: number[][] = Array.from({ length: height }, () => new Float64Array(width) as any);
  const rgbMap: { r: number; g: number; b: number }[][] = Array.from({ length: height }, () => new Array(width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      grayMap[y][x] = gray;
      rgbMap[y][x] = { r, g, b };
    }
  }

  // 2. Apply Sobel Filters
  // Sobel X: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
  // Sobel Y: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
  const grid: GradientPoint[][] = Array.from({ length: height }, () => new Array(width));
  const edgeThreshold = Math.max(10, 120 - sensitivity * 10);

  const edgePixels: { x: number; y: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0;
      let gy = 0;

      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        gx =
          -1 * grayMap[y - 1][x - 1] + 1 * grayMap[y - 1][x + 1] +
          -2 * grayMap[y][x - 1]     + 2 * grayMap[y][x + 1] +
          -1 * grayMap[y + 1][x - 1] + 1 * grayMap[y + 1][x + 1];

        gy =
          -1 * grayMap[y - 1][x - 1] - 2 * grayMap[y - 1][x] - 1 * grayMap[y - 1][x + 1] +
           1 * grayMap[y + 1][x - 1] + 2 * grayMap[y + 1][x] + 1 * grayMap[y + 1][x + 1];
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      // Gradient direction perpendicular to edge
      const gradAngle = Math.atan2(gy, gx);
      // Flow direction is tangent to edge (perpendicular to gradient)
      let flowAngleRad = gradAngle + Math.PI / 2;
      let flowAngleDeg = (flowAngleRad * 180) / Math.PI;

      // Normalize angle to [0, 360)
      if (flowAngleDeg < 0) flowAngleDeg += 360;

      const isEdge = magnitude >= edgeThreshold;
      if (isEdge) {
        edgePixels.push({ x, y });
      }

      grid[y][x] = {
        r: rgbMap[y][x].r,
        g: rgbMap[y][x].g,
        b: rgbMap[y][x].b,
        gray: grayMap[y][x],
        magnitude,
        flowAngleRad,
        flowAngleDeg,
        isEdge,
        distanceToEdge: Infinity
      };
    }
  }

  // 3. Distance Field Map (Distance to nearest edge seed)
  if (edgePixels.length > 0) {
    const step = Math.max(1, Math.floor(edgePixels.length / 500)); // Sample edge seeds for performance
    const sampledEdges = edgePixels.filter((_, i) => i % step === 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minDistSq = Infinity;
        for (const ep of sampledEdges) {
          const dx = x - ep.x;
          const dy = y - ep.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            if (minDistSq < 4) break; // Close enough
          }
        }
        grid[y][x].distanceToEdge = Math.sqrt(minDistSq);
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x].distanceToEdge = 100;
      }
    }
  }

  return grid;
}

/**
 * Generate Tesserae using Andamento (Contour Flow Lines & Concentric Ring Placement)
 */
export function generateAndamentoTesserae(
  canvas: HTMLCanvasElement,
  config: MosaicConfig,
  rawPalette: { hex: string; name: string }[]
): {
  tiles: TileData[];
  colorCounts: number[];
  cols: number;
  rows: number;
} {
  const widthMm = config.widthCm * 10;
  const heightMm = config.heightCm * 10;
  const totalUnitMm = config.tileSizeMm + config.groutSizeMm;

  const cols = Math.max(4, Math.floor((widthMm + config.groutSizeMm) / totalUnitMm));
  const rows = Math.max(4, Math.floor((heightMm + config.groutSizeMm) / totalUnitMm));

  // High-res sampling canvas for Sobel & gradient analysis
  const resScale = 2; // 2x resolution grid for fine gradient sampling
  const sampleW = cols * resScale;
  const sampleH = rows * resScale;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sampleW;
  tempCanvas.height = sampleH;
  const tempCtx = tempCanvas.getContext('2d')!;

  tempCtx.filter = `contrast(${100 + config.contrastEnhancement}%) saturate(${100 + config.saturationEnhancement}%)`;
  tempCtx.drawImage(canvas, 0, 0, sampleW, sampleH);

  const andamentoCfg = config.andamentoConfig || {
    edgeSensitivity: 5,
    concentricRings: true,
    adaptiveDensity: true,
    flowJitter: 5
  };

  const grid = computeSobelGradients(tempCtx, sampleW, sampleH, andamentoCfg.edgeSensitivity);

  const tilePx = 24; // Standard unit SVG size
  const groutPx = Math.max(1, Math.round(config.groutSizeMm * 1.2));

  // 30x30 cm sheet dimensions
  const colsPerSheet = Math.max(1, Math.floor(300 / totalUnitMm));
  const rowsPerSheet = Math.max(1, Math.floor(300 / totalUnitMm));

  const tiles: TileData[] = [];
  const colorCounts = new Array(rawPalette.length).fill(0);

  // Generate Tessera placement following Flow Lines & Concentric Rings
  let tileCounter = 1;

  for (let r = 0; r < rows; r++) {
    const rowLetter = getRowLabel(r);

    for (let c = 0; c < cols; c++) {
      // Map grid cell to sample coordinates
      const sampleX = Math.min(sampleW - 1, Math.floor((c + 0.5) * resScale));
      const sampleY = Math.min(sampleH - 1, Math.floor((r + 0.5) * resScale));

      const point = grid[sampleY][sampleX];

      // Base spatial center position in SVG space
      const baseX = groutPx + c * (tilePx + groutPx) + tilePx / 2;
      const baseY = groutPx + r * (tilePx + groutPx) + tilePx / 2;

      // Local edge & distance attributes
      const isHighDetailEdge = point.isEdge || point.distanceToEdge < resScale * 2;
      const isConcentricZone = andamentoCfg.concentricRings && point.distanceToEdge < resScale * 6;

      // Determine rotation angle tangential to local contour (0-360 degrees)
      let angleDeg = point.flowAngleDeg;

      // Add organic artisan jitter if enabled
      if (andamentoCfg.flowJitter > 0) {
        const jitter = (Math.random() - 0.5) * 2 * andamentoCfg.flowJitter;
        angleDeg = (angleDeg + jitter + 360) % 360;
      }

      // Adaptive Density Sizing: Smaller tesserae on sharp edges, larger in flat background areas
      let widthPx = tilePx;
      let heightPx = tilePx;

      if (andamentoCfg.adaptiveDensity) {
        if (isHighDetailEdge) {
          // Smaller, higher resolution tesserae for fine edge details
          widthPx = Math.round(tilePx * 0.8);
          heightPx = Math.round(tilePx * 0.8);
        } else if (point.distanceToEdge > resScale * 8) {
          // Slightly broader tesserae for flat color regions
          widthPx = Math.round(tilePx * 1.1);
          heightPx = Math.round(tilePx * 1.05);
        }
      }

      // Sample color at tessera location
      const rgbPixel = { r: point.r, g: point.g, b: point.b };

      let minDist = Infinity;
      let matchedIdx = 0;
      for (let p = 0; p < rawPalette.length; p++) {
        const pRgb = hexToRgb(rawPalette[p].hex);
        const dist = colorDistance(rgbPixel, pRgb);
        if (dist < minDist) {
          minDist = dist;
          matchedIdx = p;
        }
      }

      colorCounts[matchedIdx]++;

      const tileId = `${rowLetter}${c + 1}`;
      const sheetCol = Math.floor(c / colsPerSheet) + 1;
      const sheetRow = Math.floor(r / rowsPerSheet) + 1;
      const sheetId = `Pano-${sheetRow}.${sheetCol}`;

      const matchedColor = rawPalette[matchedIdx];
      const colorCode = `R${matchedIdx + 1}`;

      tiles.push({
        id: tileId,
        col: c,
        row: r,
        colorIndex: matchedIdx,
        hex: matchedColor.hex,
        colorCode,
        colorName: matchedColor.name,
        sheetId,
        xPx: baseX,
        yPx: baseY,
        angleDeg: Math.round(angleDeg),
        widthPx,
        heightPx,
        isEdgeTile: isHighDetailEdge,
        flowRing: isConcentricZone ? Math.floor(point.distanceToEdge / resScale) : undefined
      });

      tileCounter++;
    }
  }

  return {
    tiles,
    colorCounts,
    cols,
    rows
  };
}
