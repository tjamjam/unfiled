import { useState, useCallback } from 'react';
import { RotateCw, Download, RotateCcw } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import ProcessingButton from '../components/ProcessingButton';
import {
  rotateAllPages,
  downloadFile,
  formatFileSize,
  getPageCount,
} from '../lib/pdf-utils';

export default function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    const count = await getPageCount(f);
    setPageCount(count);
  }, []);

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const data = await rotateAllPages(file, rotation);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Rotation failed:', err);
      alert('Failed to rotate PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file!.name.replace('.pdf', '');
    downloadFile(result.data, `${baseName}-rotated.pdf`);
  };

  return (
    <div>
      <ToolHeader
        title="Rotate Pages"
        description="Rotate all pages in a PDF"
        icon={<RotateCw className="w-6 h-6" />}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          label="Drop a PDF to rotate"
        />
      ) : (
        <div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {pageCount} pages &middot; {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Change file
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rotation direction
            </label>
            <div className="flex gap-3">
              {[
                { value: 90, label: '90° clockwise', icon: <RotateCw className="w-5 h-5" /> },
                { value: 180, label: '180°', icon: <RotateCw className="w-5 h-5" /> },
                {
                  value: 270,
                  label: '90° counter-clockwise',
                  icon: <RotateCcw className="w-5 h-5" />,
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRotation(option.value);
                    setResult(null);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium
                    transition-all duration-150
                    ${
                      rotation === option.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <ProcessingButton
            onClick={handleRotate}
            processing={processing}
            label={`Rotate all ${pageCount} pages`}
            processingLabel="Rotating..."
            icon={<RotateCw className="w-5 h-5" />}
          />

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Pages rotated!</p>
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
