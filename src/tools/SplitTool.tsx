import { useState, useCallback } from 'react';
import { Scissors, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import ProcessingButton from '../components/ProcessingButton';
import {
  extractPages,
  downloadFile,
  formatFileSize,
  getPageCount,
} from '../lib/pdf-utils';
import { generateThumbnails } from '../lib/pdf-thumbnails';

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setSelectedPages(new Set());

    const count = await getPageCount(f);
    setPageCount(count);

    setLoadingThumbnails(true);
    try {
      const thumbs = await generateThumbnails(f, 0.2);
      setThumbnails(thumbs);
    } catch {
      setThumbnails([]);
    }
    setLoadingThumbnails(false);
  }, []);

  const togglePage = (index: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setResult(null);
  };

  const selectAll = () => {
    const all = new Set<number>();
    for (let i = 0; i < pageCount; i++) all.add(i);
    setSelectedPages(all);
    setResult(null);
  };

  const selectNone = () => {
    setSelectedPages(new Set());
    setResult(null);
  };

  const handleExtract = async () => {
    if (!file || selectedPages.size === 0) return;
    setProcessing(true);
    try {
      const indices = Array.from(selectedPages).sort((a, b) => a - b);
      const data = await extractPages(file, indices);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Split failed:', err);
      alert('Failed to extract pages.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file!.name.replace('.pdf', '');
    downloadFile(result.data, `${baseName}-extracted.pdf`);
  };

  return (
    <div>
      <ToolHeader
        title="Split PDF"
        description="Select and extract pages from a PDF"
        icon={<Scissors className="w-6 h-6" />}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          label="Drop a PDF to split"
          description="Select pages to extract into a new PDF"
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {pageCount} pages &middot; {formatFileSize(file.size)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectNone}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Select none
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => {
                  setFile(null);
                  setThumbnails([]);
                  setSelectedPages(new Set());
                  setResult(null);
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Change file
              </button>
            </div>
          </div>

          {loadingThumbnails ? (
            <div className="text-center py-12 text-gray-500">
              Generating page previews...
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => togglePage(i)}
                  className={`
                    relative rounded-lg overflow-hidden border-2 transition-all duration-150
                    ${
                      selectedPages.has(i)
                        ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {thumbnails[i] ? (
                    <img
                      src={thumbnails[i]}
                      alt={`Page ${i + 1}`}
                      className="w-full aspect-[3/4] object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      {i + 1}
                    </div>
                  )}
                  <div
                    className={`
                    absolute bottom-0 left-0 right-0 text-center py-1 text-xs font-medium
                    ${
                      selectedPages.has(i)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                  >
                    {i + 1}
                  </div>
                  {selectedPages.has(i) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedPages.size > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <ProcessingButton
                onClick={handleExtract}
                processing={processing}
                label={`Extract ${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''}`}
                processingLabel="Extracting..."
                icon={<Scissors className="w-5 h-5" />}
              />
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Pages extracted!</p>
                  <p className="text-sm text-green-600">
                    Output size: {formatFileSize(result.size)}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
