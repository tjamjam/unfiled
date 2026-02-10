import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface TextItem {
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

interface Line {
  items: TextItem[];
  y: number;
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
}

interface Paragraph {
  lines: Line[];
  role: string | null; // from tagged PDF structure: H1, H2, P, L, LI, Table, etc.
}

/**
 * Extract structured text from a PDF and convert to Markdown.
 *
 * Two-pass strategy:
 *
 * Pass 1 (preferred): Try to use tagged PDF structure tree.
 *   Tagged PDFs (from Word, Google Docs, government sites) have semantic
 *   markup with roles like H1, H2, P, Table, L (list). If present, we use
 *   this for perfect heading/paragraph/list detection.
 *
 * Pass 2 (fallback): Heuristic analysis with spacing-based paragraph detection.
 *   1. Extract text items with font metadata
 *   2. Group into lines by Y position
 *   3. Merge lines into paragraphs by analyzing vertical gaps
 *      (large gap = new paragraph, small gap = continuation)
 *   4. Detect headings by font size relative to body text
 *   5. Detect lists by leading bullets/numbers
 */
export async function pdfToMarkdown(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Try tagged structure first
  const taggedResult = await tryTaggedExtraction(pdf);
  if (taggedResult) return taggedResult;

  // Fall back to heuristic extraction
  return heuristicExtraction(pdf);
}

// ---------------------------------------------------------------------------
// APPROACH 1: Tagged PDF structure tree
// ---------------------------------------------------------------------------

interface StructNode {
  role: string;
  children?: (StructNode | { type: string; id?: number })[];
}

async function tryTaggedExtraction(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<string | null> {
  // Check first page for structure tree
  const firstPage = await pdf.getPage(1);
  let structTree: StructNode | null = null;
  try {
    structTree = (await firstPage.getStructTree()) as StructNode | null;
  } catch {
    return null;
  }
  if (!structTree || !structTree.children?.length) return null;

  // Structure tree exists — extract text with semantic roles
  const markdownParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    let tree: StructNode | null = null;
    try {
      tree = (await page.getStructTree()) as StructNode | null;
    } catch {
      continue;
    }
    if (!tree) continue;

    // Build a map from content item index to text
    const textItems: string[] = [];
    for (const item of textContent.items) {
      if ('str' in item) {
        textItems.push(item.str);
      }
    }

    // Walk the structure tree and collect text by role
    const pageMarkdown = walkStructTree(tree, textItems);
    if (pageMarkdown.trim()) {
      markdownParts.push(pageMarkdown.trim());
    }
  }

  if (markdownParts.length === 0) return null;
  const result = markdownParts.join('\n\n---\n\n');
  return collapseBlankLines(result).trim();
}

function walkStructTree(
  node: StructNode,
  textItems: string[],
  itemIndex: { current: number } = { current: 0 }
): string {
  const role = node.role?.toUpperCase() || '';

  if (!node.children) return '';

  // Collect child text
  const childTexts: string[] = [];
  for (const child of node.children) {
    if ('role' in child) {
      childTexts.push(walkStructTree(child as StructNode, textItems, itemIndex));
    } else {
      // Leaf content node — consume next text item
      if (itemIndex.current < textItems.length) {
        childTexts.push(textItems[itemIndex.current]);
        itemIndex.current++;
      }
    }
  }

  const text = childTexts.join('').trim();
  if (!text) return '';

  // Map PDF structure roles to Markdown
  switch (role) {
    case 'H':
    case 'H1':
      return `\n# ${text}\n`;
    case 'H2':
      return `\n## ${text}\n`;
    case 'H3':
      return `\n### ${text}\n`;
    case 'H4':
      return `\n#### ${text}\n`;
    case 'H5':
      return `\n##### ${text}\n`;
    case 'H6':
      return `\n###### ${text}\n`;
    case 'P':
    case 'SPAN':
      return `\n${text}\n`;
    case 'L': // List container
      return `\n${childTexts.join('')}\n`;
    case 'LI': // List item
    case 'LBODY':
      return `- ${text}\n`;
    case 'TABLE':
      return `\n\`\`\`\n${text}\n\`\`\`\n`;
    case 'FIGURE':
    case 'CAPTION':
      return `\n*${text}*\n`;
    case 'BLOCKQUOTE':
      return `\n> ${text}\n`;
    case 'CODE':
      return `\`${text}\``;
    case 'LINK':
    case 'ANNOT':
      return text;
    case 'ROOT':
    case 'DOCUMENT':
    case 'PART':
    case 'SECT':
    case 'DIV':
    case 'ART':
    case 'NONSTRUCT':
      // Structural containers — just pass children through
      return childTexts.join('');
    default:
      return text;
  }
}

// ---------------------------------------------------------------------------
// APPROACH 2: Heuristic extraction with spacing-based paragraph detection
// ---------------------------------------------------------------------------

async function heuristicExtraction(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<string> {
  const allPages: Line[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items: TextItem[] = [];

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;

      const tx = item.transform;
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      const fontName = item.fontName || '';

      items.push({
        text: item.str,
        fontSize: Math.round(fontSize * 10) / 10,
        fontName,
        x: tx[4],
        y: tx[5],
        width: item.width,
        height: item.height,
        isBold:
          fontName.toLowerCase().includes('bold') ||
          fontName.toLowerCase().includes('black'),
        isItalic:
          fontName.toLowerCase().includes('italic') ||
          fontName.toLowerCase().includes('oblique'),
      });
    }

    const lines = groupIntoLines(items);
    allPages.push(lines);
  }

  // Find body font size (most common across all pages)
  const sizeFrequency = new Map<number, number>();
  for (const pageLines of allPages) {
    for (const line of pageLines) {
      sizeFrequency.set(
        line.fontSize,
        (sizeFrequency.get(line.fontSize) || 0) + line.text.length
      );
    }
  }
  if (sizeFrequency.size === 0) return '';

  const bodyFontSize = [...sizeFrequency.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // Get heading font sizes (larger than body, sorted descending)
  const headingSizes = [...new Set([...sizeFrequency.keys()])]
    .filter((s) => s > bodyFontSize * 1.1)
    .sort((a, b) => b - a);

  const markdownParts: string[] = [];

  for (let pageIdx = 0; pageIdx < allPages.length; pageIdx++) {
    const lines = allPages[pageIdx];
    if (lines.length === 0) continue;

    // Merge lines into paragraphs using vertical spacing analysis
    const paragraphs = mergeIntoParagraphs(lines, bodyFontSize);
    const pageMarkdown = paragraphsToMarkdown(
      paragraphs,
      bodyFontSize,
      headingSizes
    );

    if (pageMarkdown.trim()) {
      markdownParts.push(pageMarkdown.trim());
    }
  }

  const result = markdownParts.join('\n\n---\n\n');
  return collapseBlankLines(result).trim();
}

function groupIntoLines(items: TextItem[]): Line[] {
  if (items.length === 0) return [];

  // Sort by Y descending (PDF: 0 is bottom), then X ascending
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.x - b.x;
  });

  const lines: Line[] = [];
  let currentItems: TextItem[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentY) < item.fontSize * 0.5) {
      currentItems.push(item);
    } else {
      currentItems.sort((a, b) => a.x - b.x);
      lines.push(buildLine(currentItems, currentY));
      currentItems = [item];
      currentY = item.y;
    }
  }
  currentItems.sort((a, b) => a.x - b.x);
  lines.push(buildLine(currentItems, currentY));

  return lines;
}

function buildLine(items: TextItem[], y: number): Line {
  // Join text items, inserting spaces where there are gaps
  const textParts: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const prev = items[i - 1];
      const gap = item.x - (prev.x + prev.width);
      // If gap is larger than ~1 space width, add a space
      if (gap > item.fontSize * 0.2) {
        textParts.push(' ');
      }
    }
    textParts.push(item.text);
  }

  const fontSize = getDominantSize(items);
  return {
    items,
    y,
    text: textParts.join('').trim(),
    fontSize,
    isBold: items.some((i) => i.isBold),
    isItalic: items.every((i) => i.isItalic),
  };
}

function getDominantSize(items: TextItem[]): number {
  const sizes = new Map<number, number>();
  for (const item of items) {
    sizes.set(item.fontSize, (sizes.get(item.fontSize) || 0) + item.text.length);
  }
  return [...sizes.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Key improvement: merge lines into paragraphs by analyzing vertical gaps.
 *
 * Lines that are close together (gap ≈ line height) are part of the same paragraph.
 * Lines separated by a larger gap (> 1.5x line height) start a new paragraph.
 * Lines with different font sizes always start new paragraphs.
 */
function mergeIntoParagraphs(lines: Line[], bodyFontSize: number): Paragraph[] {
  if (lines.length === 0) return [];

  const paragraphs: Paragraph[] = [];
  let current: Paragraph = { lines: [lines[0]], role: null };

  for (let i = 1; i < lines.length; i++) {
    const prevLine = lines[i - 1];
    const line = lines[i];

    // Calculate vertical gap (Y is inverted in PDF — higher Y = higher on page)
    const gap = Math.abs(prevLine.y - line.y);
    const lineHeight = Math.max(prevLine.fontSize, line.fontSize);

    // Determine if this is a new paragraph
    const fontSizeChanged =
      Math.abs(line.fontSize - prevLine.fontSize) > 0.5;
    const largeGap = gap > lineHeight * 1.8;
    const isList = isListItem(line.text);
    const prevIsList = isListItem(prevLine.text);
    const isHeading =
      line.fontSize > bodyFontSize * 1.1 && line.text.length < 200;

    if (fontSizeChanged || largeGap || isList || prevIsList || isHeading) {
      paragraphs.push(current);
      current = { lines: [line], role: null };
    } else {
      current.lines.push(line);
    }
  }
  paragraphs.push(current);

  return paragraphs;
}

function isListItem(text: string): boolean {
  return /^[\s]*([•●○▪▸►\-–—\*]|\d+[\.\)]\s|[a-z][\.\)]\s)/i.test(text);
}

function paragraphsToMarkdown(
  paragraphs: Paragraph[],
  bodyFontSize: number,
  headingSizes: number[]
): string {
  const parts: string[] = [];

  for (const para of paragraphs) {
    const firstLine = para.lines[0];

    // Check for heading (font size-based)
    const headingLevel = getHeadingLevel(
      firstLine.fontSize,
      bodyFontSize,
      headingSizes,
      firstLine.isBold,
      firstLine.text
    );

    if (headingLevel && para.lines.length <= 2) {
      const text = para.lines.map((l) => l.text).join(' ');
      const prefix = '#'.repeat(headingLevel);
      parts.push('');
      parts.push(`${prefix} ${cleanText(text)}`);
      parts.push('');
      continue;
    }

    // Check for list items
    if (isListItem(firstLine.text)) {
      for (const line of para.lines) {
        const match = line.text.match(
          /^[\s]*([•●○▪▸►\-–—\*]|\d+[\.\)]\s|[a-z][\.\)]\s)/i
        );
        if (match) {
          const content = line.text.slice(match[0].length).trim();
          const isOrdered = /^\d+[\.\)]/.test(match[0].trim());
          parts.push(isOrdered ? `1. ${content}` : `- ${content}`);
        } else {
          // Continuation of previous list item
          parts.push(`  ${cleanText(line.text)}`);
        }
      }
      parts.push('');
      continue;
    }

    // Regular paragraph — join wrapped lines into a single paragraph
    const fullText = para.lines.map((l) => l.text).join(' ');
    let cleaned = cleanText(fullText);

    // Apply inline formatting for short bold/italic blocks
    if (firstLine.isBold && cleaned.length < 300 && para.lines.length === 1) {
      cleaned = `**${cleaned}**`;
    } else if (firstLine.isItalic && para.lines.length <= 2) {
      cleaned = `*${cleaned}*`;
    }

    parts.push('');
    parts.push(cleaned);
  }

  return parts.join('\n');
}

function getHeadingLevel(
  fontSize: number,
  bodyFontSize: number,
  headingSizes: number[],
  isBold: boolean,
  text: string
): number | null {
  if (text.length > 200) return null;

  if (fontSize > bodyFontSize * 1.1) {
    const idx = headingSizes.indexOf(fontSize);
    if (idx === 0) return 1;
    if (idx === 1) return 2;
    if (idx >= 2) return 3;
  }

  // Bold text at body size that looks like a standalone heading
  if (isBold && fontSize >= bodyFontSize && text.length < 80) {
    if (!/[.,;:]$/.test(text)) {
      return 3;
    }
  }

  return null;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\u00AD/g, '') // soft hyphens
    .replace(/\uFFFD/g, '') // replacement characters
    .replace(/\ufb01/g, 'fi') // fi ligature
    .replace(/\ufb02/g, 'fl') // fl ligature
    .replace(/\ufb03/g, 'ffi') // ffi ligature
    .replace(/\ufb04/g, 'ffl') // ffl ligature
    .trim();
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}
