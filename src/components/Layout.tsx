import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useTrust } from '../contexts/TrustContext';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { isOnline } = useTrust();

  return (
    <div
      className="min-h-screen bg-gray-50 transition-[filter] duration-700 ease-in-out"
      style={!isOnline ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
    >
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Unfiled</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-green-600" />
            <span>100% client-side. Your files never leave your device.</span>
          </div>
        </div>
      </header>

      <main className={isHome ? '' : 'max-w-4xl mx-auto px-4 py-8'}>
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Unfiled is free, open-source, and processes everything in your browser.
            No servers, no uploads, no tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}
