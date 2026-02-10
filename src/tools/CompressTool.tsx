import { useState, useCallback } from 'react';
import { Minimize2, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import ProcessingButton from '../components/ProcessingButton';
import { compressPdf, downloadFile, formatFileSize } from '../lib/pdf-utils';

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    data: Uint8Array;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const data = await compressPdf(file);
      setResult({
        data,
        originalSize: file.size,
        compressedSize: data.length,
      });
    } catch (err) {
      console.error('Compression failed:', err);
      alert('Failed to compress PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file!.name.replace('.pdf', '');
    downloadFile(result.data, `${baseName}-compressed.pdf`);
  };

  const savingsPercent = result
    ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
    : 0;

  return (
    <div>
      <ToolHeader
        title="Compress PDF"
        description="Reduce PDF file size by removing unused data"
        icon={<Minimize2 className="w-6 h-6" />}
      />

      <FileDropzone
        onFilesSelected={handleFileSelected}
        multiple={false}
        label="Drop a PDF to compress"
        description="We'll optimize it by removing unused objects and metadata"
      />

      {file && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">
            Current size: {formatFileSize(file.size)}
          </p>
        </div>
      )}

      {file && !result && (
        <div className="mt-6">
          <ProcessingButton
            onClick={handleCompress}
            processing={processing}
            label="Compress PDF"
            processingLabel="Compressing..."
            icon={<Minimize2 className="w-5 h-5" />}
          />
          <p className="mt-2 text-sm text-gray-500">
            Note: Client-side compression removes unused objects and metadata. For maximum
            compression (image downsampling), a server-side tool like Ghostscript is needed.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Compression complete!</p>
              <p className="text-sm text-green-600">
                {formatFileSize(result.originalSize)} &rarr;{' '}
                {formatFileSize(result.compressedSize)}
                {savingsPercent > 0 && (
                  <span className="ml-2 font-semibold">({savingsPercent}% smaller)</span>
                )}
                {savingsPercent <= 0 && (
                  <span className="ml-2">
                    (File was already optimized — no further reduction possible client-side)
                  </span>
                )}
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
  );
}
