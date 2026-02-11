import { useState, useCallback } from 'react';
import { Merge, Download, Plus } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import FileDropzone from '../components/FileDropzone';
import FileList from '../components/FileList';
import ProcessingButton from '../components/ProcessingButton';
import { mergePdfs, downloadFile, formatFileSize } from '../lib/pdf-utils';

export default function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const data = await mergePdfs(files);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge PDFs. Please check that all files are valid PDFs.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadFile(result.data, 'merged.pdf');
  };

  return (
    <div>
      <ToolHeader
        title="Merge PDFs"
        description="Combine multiple PDF files into a single document"
        icon={<Merge className="w-6 h-6" />}
      />

      <FileDropzone
        onFilesSelected={handleFilesSelected}
        label="Drop PDF files here to merge"
        description="Add 2 or more PDFs, then merge them in order"
      />

      <FileList files={files} onRemove={handleRemove} onReorder={(reordered) => { setFiles(reordered); setResult(null); }} />

      {files.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => (document.querySelector('input[type="file"]') as HTMLElement)?.click()}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add more files
          </button>
        </div>
      )}

      {files.length >= 2 && (
        <div className="mt-6 flex items-center gap-4">
          <ProcessingButton
            onClick={handleMerge}
            processing={processing}
            label={`Merge ${files.length} files`}
            processingLabel="Merging..."
            icon={<Merge className="w-5 h-5" />}
          />
          <span className="text-sm text-gray-500">
            Total input: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
          </span>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">
                Merged successfully!
              </p>
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
