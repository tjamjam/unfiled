import { PDFDocument, degrees } from 'pdf-lib';

export async function loadPdf(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer();
  return PDFDocument.load(arrayBuffer);
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await loadPdf(file);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function splitPdf(
  file: File,
  ranges: { start: number; end: number }[]
): Promise<Uint8Array[]> {
  const sourcePdf = await loadPdf(file);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const indices = [];
    for (let i = range.start; i <= range.end && i < sourcePdf.getPageCount(); i++) {
      indices.push(i);
    }
    const pages = await newPdf.copyPages(sourcePdf, indices);
    pages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function extractPages(
  file: File,
  pageIndices: number[]
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(file);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));
  return newPdf.save();
}

export async function rotatePdf(
  file: File,
  pageRotations: Map<number, number>
): Promise<Uint8Array> {
  const pdf = await loadPdf(file);
  const pages = pdf.getPages();

  for (const [pageIndex, rotation] of pageRotations) {
    if (pageIndex < pages.length) {
      pages[pageIndex].setRotation(degrees(rotation));
    }
  }

  return pdf.save();
}

export async function rotateAllPages(
  file: File,
  rotationDegrees: number
): Promise<Uint8Array> {
  const pdf = await loadPdf(file);
  const pages = pdf.getPages();

  for (const page of pages) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotationDegrees));
  }

  return pdf.save();
}

export async function reorderPages(
  file: File,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(file);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, newOrder);
  pages.forEach((page) => newPdf.addPage(page));
  return newPdf.save();
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let image;
    if (file.type === 'image/png') {
      image = await pdf.embedPng(bytes);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdf.embedJpg(bytes);
    } else {
      continue;
    }

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return pdf.save();
}

export async function compressPdf(file: File): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(file);
  // pdf-lib can remove unused objects and compress during save
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page) => newPdf.addPage(page));

  // Copy metadata
  const sourceTitle = sourcePdf.getTitle();
  const sourceAuthor = sourcePdf.getAuthor();
  const sourceSubject = sourcePdf.getSubject();
  if (sourceTitle) newPdf.setTitle(sourceTitle);
  if (sourceAuthor) newPdf.setAuthor(sourceAuthor);
  if (sourceSubject) newPdf.setSubject(sourceSubject);

  return newPdf.save();
}

export function downloadFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function getPageCount(file: File): Promise<number> {
  const pdf = await loadPdf(file);
  return pdf.getPageCount();
}
