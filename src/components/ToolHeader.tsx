import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ToolHeader({ title, description, icon }: ToolHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4 no-underline"
      >
        <ArrowLeft className="w-4 h-4" />
        All tools
      </Link>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
