import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileDown, type LucideIcon } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  label?: string;
  description?: string;
  icon?: LucideIcon;
}

export default function FileDropzone({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  label = 'Drop PDF files here',
  description = 'or click to browse',
  icon: Icon = FileDown,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-colors duration-200
        ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      <Icon
        className={`w-10 h-10 mx-auto mb-3 ${
          isDragActive ? 'text-indigo-500' : 'text-gray-400'
        }`}
      />
      <p className="text-lg font-medium text-gray-700">{label}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
