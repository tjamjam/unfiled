import { useState, useCallback } from 'react';
import { FileText, Download, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import ProcessingButton from '../components/ProcessingButton';
import { formatFileSize } from '../lib/pdf-utils';
import { pdfToMarkdown } from '../lib/pdf-to-markdown';

export default function PdfToMarkdownTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setMarkdown(null);
    setCopied(false);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const md = await pdfToMarkdown(file);
      setMarkdown(md);
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('Failed to convert PDF to Markdown. The file may be scanned (image-only) or corrupted.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file!.name.replace('.pdf', '');
    a.download = `${baseName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ToolHeader
        title="PDF to Markdown"
        description="Extract text with structure (headings, paragraphs, lists) as clean Markdown"
        icon={<FileText className="w-6 h-6" />}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          label="Drop a PDF to convert to Markdown"
          description="We'll extract headings, paragraphs, and lists based on font sizes and formatting"
        />
      ) : (
        <div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setMarkdown(null);
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Change file
              </button>
            </div>
          </div>

          {!markdown && (
            <div>
              <ProcessingButton
                onClick={handleConvert}
                processing={processing}
                label="Convert to Markdown"
                processingLabel="Extracting text..."
                icon={<FileText className="w-5 h-5" />}
              />
              <p className="mt-2 text-sm text-gray-500">
                Works best with text-based PDFs. Scanned/image PDFs will need OCR first.
              </p>
            </div>
          )}

          {markdown !== null && (
            <div className="space-y-4">
              {/* Actions bar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {markdown.length.toLocaleString()} characters &middot;{' '}
                  {markdown.split('\n').length} lines
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download .md
                  </button>
                </div>
              </div>

              {/* Preview with tabs */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    Markdown Output
                  </span>
                </div>
                <pre className="p-4 overflow-auto max-h-[600px] text-sm font-mono text-gray-800 bg-white whitespace-pre-wrap">
                  {markdown || '(No text content found in this PDF)'}
                </pre>
              </div>

              {markdown.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    No text was extracted. This PDF may be scanned (image-only).
                    OCR support is coming soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
