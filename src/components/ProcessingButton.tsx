import { Loader2 } from 'lucide-react';

interface ProcessingButtonProps {
  onClick: () => void;
  processing: boolean;
  disabled?: boolean;
  label: string;
  processingLabel?: string;
  icon?: React.ReactNode;
}

export default function ProcessingButton({
  onClick,
  processing,
  disabled = false,
  label,
  processingLabel = 'Processing...',
  icon,
}: ProcessingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || processing}
      className={`
        inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white
        transition-all duration-200
        ${
          disabled || processing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow'
        }
      `}
    >
      {processing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {processingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
