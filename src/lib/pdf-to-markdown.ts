import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface TextBlock {
  text: string;
  fontSize: number;
  fontName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Extract structured text from a PDF and convert to Markdown.
 *
 * Strategy:
 * 1. Extract all text items with font metadata from pdf.js
 * 2. Group items into lines by Y position
 * 3. Detect heading levels by comparing font sizes (largest = h1, etc.)
 * 4. Detect list items by leading bullets/dashes/numbers
 * 5. Output clean Markdown
 */
export async function pdfToMarkdown(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allBlocks: TextBlock[][] = []; // per page

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const blocks: TextBlock[] = [];

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;

      const tx = item.transform;
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      const fontName = item.fontName || '';
      const isBold =
        fontName.toLowerCase().includes('bold') ||
        fontName.toLowerCase().includes('black');
      const isItalic =
        fontName.toLowerCase().includes('italic') ||
        fontName.toLowerCase().includes('oblique');

      blocks.push({
        text: item.str,
        fontSize: Math.round(fontSize * 10) / 10,
        fontName,
        x: tx[4],
        y: tx[5],
        width: item.width,
        height: item.height,
        isBold,
        isItalic,
      });
    }

    allBlocks.push(blocks);
  }

  // Collect all font sizes to determine heading thresholds
  const fontSizes: number[] = [];
  for (const pageBlocks of allBlocks) {
    for (const block of pageBlocks) {
      fontSizes.push(block.fontSize);
    }
  }

  if (fontSizes.length === 0) return '';

  // Find the most common font size (body text)
  const sizeFrequency = new Map<number, number>();
  for (const size of fontSizes) {
    sizeFrequency.set(size, (sizeFrequency.get(size) || 0) + 1);
  }
  const bodyFontSize = [...sizeFrequency.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // Get unique sizes larger than body text, sorted descending
  const headingSizes = [...new Set(fontSizes)]
    .filter((s) => s > bodyFontSize * 1.15)
    .sort((a, b) => b - a);

  const markdownLines: string[] = [];

  for (let pageIdx = 0; pageIdx < allBlocks.length; pageIdx++) {
    const pageBlocks = allBlocks[pageIdx];
    if (pageBlocks.length === 0) continue;

    // Group blocks into lines by Y position (within tolerance)
    const lines = groupIntoLines(pageBlocks);

    for (const line of lines) {
      const lineText = line.map((b) => b.text).join(' ').trim();
      if (!lineText) continue;

      // Determine the dominant font size for this line
      const dominantSize = getDominantFontSize(line);
      const dominantBold = line.some((b) => b.isBold);

      // Check if it's a heading
      const headingLevel = getHeadingLevel(
        dominantSize,
        bodyFontSize,
        headingSizes,
        dominantBold,
        lineText
      );

      // Check if it's a list item
      const listMatch = lineText.match(
        /^[\s]*([•●○▪▸►\-–—\*]|\d+[\.\)]\s|[a-z][\.\)]\s)/i
      );

      if (headingLevel) {
        // Add blank line before headings
        if (markdownLines.length > 0 && markdownLines[markdownLines.length - 1] !== '') {
          markdownLines.push('');
        }
        const prefix = '#'.repeat(headingLevel);
        // Clean the heading text
        const cleanText = cleanLine(lineText);
        markdownLines.push(`${prefix} ${cleanText}`);
        markdownLines.push('');
      } else if (listMatch) {
        const bulletContent = lineText.slice(listMatch[0].length).trim();
        const isOrdered = /^\d+[\.\)]/.test(listMatch[0].trim());
        if (isOrdered) {
          markdownLines.push(`1. ${bulletContent || lineText}`);
        } else {
          markdownLines.push(`- ${bulletContent || lineText}`);
        }
      } else {
        // Regular paragraph text
        const cleanText = cleanLine(lineText);
        // Apply inline formatting
        let formatted = cleanText;
        if (dominantBold && formatted.length < 200) {
          formatted = `**${formatted}**`;
        }
        markdownLines.push(formatted);
      }
    }

    // Page separator (only between pages, not after the last)
    if (pageIdx < allBlocks.length - 1) {
      markdownLines.push('');
      markdownLines.push('---');
      markdownLines.push('');
    }
  }

  // Clean up: collapse multiple blank lines
  const result = collapseBlankLines(markdownLines.join('\n'));
  return result.trim();
}

function groupIntoLines(blocks: TextBlock[]): TextBlock[][] {
  if (blocks.length === 0) return [];

  // Sort by Y descending (PDF coordinates: bottom = 0), then X ascending
  const sorted = [...blocks].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.x - b.x;
  });

  const lines: TextBlock[][] = [];
  let currentLine: TextBlock[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    // If Y position is close enough, same line
    if (Math.abs(block.y - currentY) < block.fontSize * 0.5) {
      currentLine.push(block);
    } else {
      // Sort current line by X before adding
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
      currentLine = [block];
      currentY = block.y;
    }
  }
  currentLine.sort((a, b) => a.x - b.x);
  lines.push(currentLine);

  return lines;
}

function getDominantFontSize(line: TextBlock[]): number {
  const sizes = new Map<number, number>();
  for (const block of line) {
    const charCount = block.text.length;
    sizes.set(block.fontSize, (sizes.get(block.fontSize) || 0) + charCount);
  }
  return [...sizes.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function getHeadingLevel(
  fontSize: number,
  bodyFontSize: number,
  headingSizes: number[],
  isBold: boolean,
  text: string
): number | null {
  // Don't treat very long lines as headings
  if (text.length > 200) return null;

  // If font size is notably larger than body text
  if (fontSize > bodyFontSize * 1.15) {
    const idx = headingSizes.indexOf(fontSize);
    if (idx === 0) return 1;
    if (idx === 1) return 2;
    if (idx >= 2) return 3;
  }

  // Bold text that's the same size as body could be h3 if it's short
  if (isBold && fontSize >= bodyFontSize && text.length < 80) {
    // Only if it looks like a standalone heading (not mid-paragraph bold)
    if (!text.endsWith('.') && !text.endsWith(',') && !text.endsWith(';')) {
      return 3;
    }
  }

  return null;
}

function cleanLine(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\u00AD/g, '') // soft hyphens
    .replace(/\uFFFD/g, '') // replacement chars
    .trim();
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}
