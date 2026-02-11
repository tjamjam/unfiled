import { Link } from 'react-router-dom';
import {
  Merge,
  Scissors,
  RotateCw,
  Minimize2,
  Image,
  FileText,
} from 'lucide-react';
import NetworkMonitor from '../components/NetworkMonitor';

const tools = [
  {
    name: 'Merge',
    description: 'Combine multiple PDFs into one',
    icon: <Merge className="w-5 h-5" />,
    path: '/merge',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Split',
    description: 'Extract or separate pages',
    icon: <Scissors className="w-5 h-5" />,
    path: '/split',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Compress',
    description: 'Reduce file size',
    icon: <Minimize2 className="w-5 h-5" />,
    path: '/compress',
    color: 'bg-green-100 text-green-600',
  },
  {
    name: 'Rotate',
    description: 'Rotate individual or all pages',
    icon: <RotateCw className="w-5 h-5" />,
    path: '/rotate',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    name: 'Images to PDF',
    description: 'Convert JPG or PNG to PDF',
    icon: <Image className="w-5 h-5" />,
    path: '/images-to-pdf',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    name: 'PDF to Markdown',
    badge: 'Beta',
    description: 'Extract text as clean Markdown',
    icon: <FileText className="w-5 h-5" />,
    path: '/pdf-to-markdown',
    color: 'bg-teal-100 text-teal-600',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Unfiled
            </h1>
          </div>
          <p className="text-lg text-gray-500">
            No upload. No account. PDF tools that run entirely in your browser.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 no-underline text-center"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${tool.color}`}
              >
                {tool.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {tool.name}
                {tool.badge && (
                  <span className="ml-1 inline-block text-xs font-medium px-1 py-0.5 rounded-full bg-amber-100 text-amber-700 align-middle">
                    {tool.badge}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Privacy proof */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-12">
          <div className="max-w-2xl mx-auto text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Zero network requests
            </h2>
            <p className="text-gray-600">
              Your files never leave this device. Verify it below, or turn off your Wi-Fi — everything still works.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <NetworkMonitor />
          </div>
        </div>
      </div>
    </div>
  );
}
