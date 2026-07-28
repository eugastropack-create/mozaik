import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionReport, AssemblyStep, MosaicConfig } from '../types';

// Helper to sanitize Turkish characters for jsPDF default Helvetica font compatibility
function pdfText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  const s = String(str);
  return s
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

/**
 * Generates and downloads the Material & Production Report PDF
 */
export function generateMaterialReportPDF(report: ProductionReport, config: MosaicConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(pdfText('MOZAIK URETIM VE MATERYAL RAPORU'), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(pdfText('Sanatsal Mozaik Atolye Dokumu & Malzeme Metraj Cetveli'), 14, 18);
  doc.text(pdfText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), pageWidth - 14, 18, { align: 'right' });

  let y = 34;

  // 1. Technical Specs Summary Grid
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(pdfText('1. Duzen & Teknik Metraj Bilgileri'), 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const col1X = 18;
  const col2X = 80;
  const col3X = 142;

  doc.text(pdfText(`Toplam Alan: ${report.totalAreaM2} m2 (${report.widthM}m x ${report.heightM}m)`), col1X, y + 15);
  doc.text(pdfText(`Izgara Olcusu: ${report.gridColumns} Sutun x ${report.gridRows} Satir`), col1X, y + 21);
  doc.text(pdfText(`Materyal / Dizilim: ${config.material.toUpperCase()} (${config.tileShape === 'andamento' ? 'Andamento Akis' : config.tileShape.toUpperCase()})`), col1X, y + 27);

  doc.text(pdfText(`Tas Boyutu: ${config.tileSizeMm}x${config.tileSizeMm} mm`), col2X, y + 15);
  doc.text(pdfText(`Derz Boslugu: ${config.groutSizeMm} mm`), col2X, y + 21);
  doc.text(pdfText(`Derz Rengi: ${config.groutColor}`), col2X, y + 27);

  doc.text(pdfText(`Net Tas Sayisi: ${report.totalTiles.toLocaleString('en-US')} Adet`), col3X, y + 15);
  doc.text(pdfText(`Fire Payli (+%${report.wasteMarginPercent}): ${report.tilesWithWaste.toLocaleString('en-US')} Adet`), col3X, y + 21);
  doc.text(pdfText(`Tahmini Agirlik: ~${report.estimatedWeightKg} kg (Derz: ~${report.estimatedGroutKg} kg)`), col3X, y + 27);
  doc.text(pdfText(`Moduler 30x30 cm Pano: ${report.totalSheets30x30} Pano`), col3X, y + 33);

  y += 44;

  // 2. Color Palette Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(pdfText('2. Gerekli Tas Envanteri & Renk Dagilimi'), 14, y);

  y += 4;

  const tableData = report.palette.map((item) => {
    const wasteCount = Math.ceil(item.count * (1 + report.wasteMarginPercent / 100));
    return [
      pdfText(item.code),
      pdfText(item.name),
      pdfText(item.hex),
      pdfText(item.count.toLocaleString('en-US')),
      pdfText(wasteCount.toLocaleString('en-US')),
      pdfText(`%${item.percentage}`),
      pdfText(`${item.estimatedWeightKg} kg`)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [[
      pdfText('KOD'),
      pdfText('RENK ADI'),
      pdfText('HEX KOD'),
      pdfText('NET ADET'),
      pdfText('FIRELI ADET'),
      pdfText('ORAN'),
      pdfText('AGIRLIK')
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 16 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      5: { halign: 'center' },
      6: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 10;

  // 3. AI Artist Master Notes (If present)
  if (report.geminiAnalysis) {
    if (y + 35 > pageHeight) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 27, 75); // indigo-950
    doc.text(pdfText('3. Atolye Usta Tavsiyeleri & Montaj Uyarilari'), 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const styleNote = pdfText(`Sanatsal Stil: ${report.geminiAnalysis.artisticStyle}`);
    const groutNote = pdfText(`Derz Tavsiyesi: ${report.geminiAnalysis.groutRecommendation}`);
    const mountNote = pdfText(`Montaj Uyarisi: ${report.geminiAnalysis.mountingAdvice}`);

    doc.text(doc.splitTextToSize(styleNote, pageWidth - 36), 18, y + 12);
    doc.text(doc.splitTextToSize(groutNote, pageWidth - 36), 18, y + 18);
    doc.text(doc.splitTextToSize(mountNote, pageWidth - 36), 18, y + 24);
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      pdfText('Sanatsal Mozaik Uretim Asistani - Atolye Kopyasi'),
      14,
      pageHeight - 8
    );
    doc.text(
      pdfText(`Sayfa ${i} / ${pageCount}`),
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  doc.save(`Mozaik_Uretim_Raporu_${report.widthM}x${report.heightM}m.pdf`);
}

/**
 * Generates and downloads the Assembly Guide PDF
 */
export function generateAssemblyGuidePDF(assemblySteps: AssemblyStep[], report: ProductionReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(pdfText('ADIM ADIM MOZAIK MONTAJ REHBERI'), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(pdfText('File Pano Modulleri & Mantiksal Renk Dizilim Haritasi'), 14, 18);
  doc.text(pdfText(`Toplam Pano: ${assemblySteps.length} Modul`), pageWidth - 14, 18, { align: 'right' });

  let y = 35;

  assemblySteps.forEach((step, idx) => {
    // Check space remaining on page
    if (y + 45 > pageHeight) {
      doc.addPage();
      y = 15;
    }

    // Sheet Card Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 10, 1, 1, 'FD');

    // Left Accent Bar
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(14, y, 3, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(pdfText(`PANO ${idx + 1}: ${step.sheetTitle} (${step.positionLabel})`), 20, y + 6.5);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfText(`Pano Kodu: ${step.sheetId}`), pageWidth - 18, y + 6.5, { align: 'right' });

    y += 13;

    // Table of color ranges for this sheet
    const rangesData = step.ranges.map((r) => [
      pdfText(`${r.colorCode} - ${r.colorName}`),
      pdfText(r.range),
      pdfText(`${r.count} Adet`)
    ]);

    autoTable(doc, {
      startY: y,
      head: [[pdfText('RENK / KOD'), pdfText('KOORDINAT ARALIGI'), pdfText('ADET')]],
      body: rangesData,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { fontStyle: 'normal', cellWidth: 90 },
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
      },
      margin: { left: 14, right: 14 }
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    y = doc.lastAutoTable.finalY + 4;

    // Instructions list
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(pdfText('Uygulama Adimlari:'), 16, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    step.instructions.forEach((ins) => {
      if (y + 5 > pageHeight) {
        doc.addPage();
        y = 15;
      }
      doc.text(pdfText(`- ${ins}`), 18, y);
      y += 4;
    });

    y += 6;
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      pdfText('Sanatsal Mozaik Montaj Rehberi - Atolye Kopyasi'),
      14,
      pageHeight - 8
    );
    doc.text(
      pdfText(`Sayfa ${i} / ${pageCount}`),
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  doc.save(`Mozaik_Montaj_Rehberi_${report.totalSheets30x30}_Pano.pdf`);
}

/**
 * Generates and downloads the Complete Master Workshop Package PDF (Report + Assembly)
 */
export function generateFullWorkshopPackagePDF(
  report: ProductionReport,
  assemblySteps: AssemblyStep[],
  config: MosaicConfig
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cover / Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(pdfText('TAM ATOLYE URETIM DOKUMAN PAKETI'), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(pdfText('Sanatsal Mozaik Metraj, Envanter Listesi ve Adim Adim Montaj Kilavuzu'), 14, 24);
  doc.text(pdfText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), pageWidth - 14, 24, { align: 'right' });

  let y = 48;

  // 1. Overview Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(pdfText('1. Proje Genel Ozet Bilgileri'), 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(pdfText(`Proje Alani: ${report.totalAreaM2} m2 (${report.widthM}m x ${report.heightM}m)`), 18, y + 16);
  doc.text(pdfText(`Toplam Net Tas: ${report.totalTiles.toLocaleString('en-US')} Adet`), 18, y + 22);
  doc.text(pdfText(`Fireli Tas (+%${report.wasteMarginPercent}): ${report.tilesWithWaste.toLocaleString('en-US')} Adet`), 18, y + 28);

  doc.text(pdfText(`Materyal: ${config.material.toUpperCase()}`), 85, y + 16);
  doc.text(pdfText(`Tas Ebad: ${config.tileSizeMm}x${config.tileSizeMm} mm`), 85, y + 22);
  doc.text(pdfText(`Derz: ${config.groutSizeMm} mm (${config.groutColor})`), 85, y + 28);

  doc.text(pdfText(`Pano Sayisi: ${report.totalSheets30x30} Adet (30x30cm)`), 148, y + 16);
  doc.text(pdfText(`Toplam Agirlik: ~${report.estimatedWeightKg} kg`), 148, y + 22);
  doc.text(pdfText(`Derz Harci: ~${report.estimatedGroutKg} kg`), 148, y + 28);

  y += 44;

  // 2. Color Palette Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(pdfText('2. Malzeme & Renk Siparis Listesi'), 14, y);

  y += 4;

  const tableData = report.palette.map((item) => {
    const wasteCount = Math.ceil(item.count * (1 + report.wasteMarginPercent / 100));
    return [
      pdfText(item.code),
      pdfText(item.name),
      pdfText(item.hex),
      pdfText(item.count.toLocaleString('en-US')),
      pdfText(wasteCount.toLocaleString('en-US')),
      pdfText(`%${item.percentage}`),
      pdfText(`${item.estimatedWeightKg} kg`)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [[
      pdfText('KOD'),
      pdfText('RENK ADI'),
      pdfText('HEX KOD'),
      pdfText('NET ADET'),
      pdfText('FIRELI ADET'),
      pdfText('ORAN'),
      pdfText('AGIRLIK')
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 16 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      5: { halign: 'center' },
      6: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 12;

  // 3. Assembly Steps Section (Starts on fresh section or page if needed)
  if (y + 40 > pageHeight) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(pdfText('3. Moduler File Pano Montaj Talimatlari'), 14, y);
  y += 6;

  assemblySteps.forEach((step, idx) => {
    if (y + 45 > pageHeight) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 9, 1, 1, 'FD');

    doc.setFillColor(79, 70, 229);
    doc.rect(14, y, 3, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(pdfText(`PANO ${idx + 1}: ${step.sheetTitle} (${step.positionLabel}) - KOD: ${step.sheetId}`), 20, y + 6);

    y += 11;

    const rangesData = step.ranges.map((r) => [
      pdfText(`${r.colorCode} - ${r.colorName}`),
      pdfText(r.range),
      pdfText(`${r.count} Adet`)
    ]);

    autoTable(doc, {
      startY: y,
      head: [[pdfText('RENK / KOD'), pdfText('KOORDINAT ARALIGI'), pdfText('ADET')]],
      body: rangesData,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { fontStyle: 'normal', cellWidth: 90 },
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
      },
      margin: { left: 14, right: 14 }
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    y = doc.lastAutoTable.finalY + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(pdfText('Talimatlar:'), 16, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    step.instructions.forEach((ins) => {
      if (y + 4 > pageHeight) {
        doc.addPage();
        y = 15;
      }
      doc.text(pdfText(`- ${ins}`), 18, y);
      y += 3.5;
    });

    y += 6;
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      pdfText('Sanatsal Mozaik Atolye Uretim Dokuman Paketi'),
      14,
      pageHeight - 8
    );
    doc.text(
      pdfText(`Sayfa ${i} / ${pageCount}`),
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  doc.save(`Mozaik_Atolye_Tam_Paket_${report.widthM}x${report.heightM}m.pdf`);
}
