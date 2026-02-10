import { Link } from 'react-router-dom';
import {
  Merge,
  Scissors,
  RotateCw,
  Minimize2,
  Image,
  FileText,
  Shield,
  Lock,
  Zap,
} from 'lucide-react';

const tools = [
  {
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one document',
    icon: <Merge className="w-6 h-6" />,
    path: '/merge',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Split PDF',
    description: 'Extract pages or split into separate files',
    icon: <Scissors className="w-6 h-6" />,
    path: '/split',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Compress PDF',
    description: 'Reduce file size for easier sharing',
    icon: <Minimize2 className="w-6 h-6" />,
    path: '/compress',
    color: 'bg-green-100 text-green-600',
  },
  {
    name: 'Rotate Pages',
    description: 'Rotate individual or all pages',
    icon: <RotateCw className="w-6 h-6" />,
    path: '/rotate',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    name: 'Images to PDF',
    description: 'Convert JPG/PNG images into a PDF',
    icon: <Image className="w-6 h-6" />,
    path: '/images-to-pdf',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    name: 'PDF to Markdown',
    description: 'Extract headings, paragraphs, and lists as clean Markdown',
    icon: <FileText className="w-6 h-6" />,
    path: '/pdf-to-markdown',
    color: 'bg-teal-100 text-teal-600',
  },
];

const privacyFeatures = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: '100% Client-Side',
    description: 'Everything runs in your browser. Your files are never uploaded anywhere.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'No Account Required',
    description: 'No sign-up, no login, no tracking. Just open and use.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'No Limits',
    description: 'No daily task limits. No file size caps. No watermarks. Free forever.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            PDF tools that respect your privacy
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Merge, split, compress, and organize your PDFs. Everything happens in your
            browser — your files never leave your device.
          </p>
          <div className="flex items-center justify-center gap-6">
            {privacyFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <span className="text-green-600">{feature.icon}</span>
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">All Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200 no-underline"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${tool.color}`}
              >
                {tool.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Privacy Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Unfiled?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {privacyFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 text-indigo-600 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer jab */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-16 text-center">
        <p className="text-sm text-gray-400">
          🖕 Adobe Acrobat — $29.99/mo to merge two PDFs? No thanks.
        </p>
      </div>
    </div>
  );
}
