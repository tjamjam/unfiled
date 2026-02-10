import { useState, useCallback } from 'react';
import { Image, Download, X } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import ProcessingButton from '../components/ProcessingButton';
import { imagesToPdf, downloadFile, formatFileSize } from '../lib/pdf-utils';

export default function ImagesToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setResult(null);
  }, []);

  const handleRemove = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const data = await imagesToPdf(files);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('Failed to convert images to PDF. Make sure images are JPG or PNG.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadFile(result.data, 'images.pdf');
  };

  return (
    <div>
      <ToolHeader
        title="Images to PDF"
        description="Convert JPG and PNG images into a PDF document"
        icon={<Image className="w-6 h-6" />}
      />

      <FileDropzone
        onFilesSelected={handleFilesSelected}
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
        label="Drop images here"
        description="JPG and PNG supported. Each image becomes one page."
      />

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              {files.length} image{files.length !== 1 ? 's' : ''} &middot;{' '}
              {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
            </p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative rounded-lg overflow-hidden border border-gray-200 bg-white"
              >
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="w-full aspect-[3/4] object-cover"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 truncate px-1">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <ProcessingButton
              onClick={handleConvert}
              processing={processing}
              label={`Create PDF (${files.length} pages)`}
              processingLabel="Converting..."
              icon={<Image className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">PDF created!</p>
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
  );
}
