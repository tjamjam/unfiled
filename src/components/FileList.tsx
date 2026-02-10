import { FileText, X, GripVertical } from 'lucide-react';
import { formatFileSize } from '../lib/pdf-utils';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  sortable?: boolean;
}

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
        >
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <button
            onClick={() => onRemove(index)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
