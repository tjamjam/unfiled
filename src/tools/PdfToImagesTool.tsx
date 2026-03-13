import { useState, useCallback } from 'react';
import { FileImage, Download, Loader2 } from 'lucide-react';
import { FileDown } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import { generateThumbnails, renderPageAsBlob } from '../lib/pdf-thumbnails';
import { formatFileSize } from '../lib/pdf-utils';

type Format = 'image/png' | 'image/jpeg';

export default function PdfToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [format, setFormat] = useState<Format>('image/png');
  const [scale, setScale] = useState(2);
  const [downloadingPage, setDownloadingPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const pdf = files[0];
    if (!pdf) return;
    setFile(pdf);
    setThumbnails([]);
    setLoading(true);
    try {
      const thumbs = await generateThumbnails(pdf);
      setThumbnails(thumbs);
    } catch (err) {
      console.error('Failed to generate thumbnails:', err);
      alert('Failed to read PDF. Make sure the file is a valid PDF.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageDownload = async (pageNum: number) => {
    if (!file || downloadingPage !== null) return;
    setDownloadingPage(pageNum);
    try {
      const blob = await renderPageAsBlob(file, pageNum, format, scale);
      const ext = format === 'image/png' ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page-${pageNum}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to render page:', err);
      alert('Failed to render page. Please try again.');
    } finally {
      setDownloadingPage(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
  };

  const ext = format === 'image/png' ? 'PNG' : 'JPG';

  return (
    <div>
      <ToolHeader
        title="PDF to Images"
        description="Convert PDF pages to JPG or PNG images"
        icon={<FileImage className="w-6 h-6" />}
      />

      {!file && (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept={{ 'application/pdf': ['.pdf'] }}
          label="Drop a PDF here"
          description="Each page will be converted to an image"
          icon={FileDown}
          multiple={false}
        />
      )}

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Generating previews…</span>
        </div>
      )}

      {file && thumbnails.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                {thumbnails.length} page{thumbnails.length !== 1 ? 's' : ''} &middot;{' '}
                {formatFileSize(file.size)}
              </p>
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Change file
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Format toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['image/png', 'image/jpeg'] as Format[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      format === f
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'image/png' ? 'PNG' : 'JPG'}
                  </button>
                ))}
              </div>

              {/* Scale selector */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      scale === s
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {thumbnails.map((thumb, i) => {
              const pageNum = i + 1;
              const isDownloading = downloadingPage === pageNum;
              return (
                <button
                  key={i}
                  onClick={() => handlePageDownload(pageNum)}
                  disabled={isDownloading}
                  className="relative rounded-lg overflow-hidden border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 group cursor-pointer"
                >
                  <img
                    src={thumb}
                    alt={`Page ${pageNum}`}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    {isDownloading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow" />
                    ) : (
                      <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 truncate px-1">
                    {pageNum} &middot; {ext}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
