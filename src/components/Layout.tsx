import { Outlet, useLocation } from 'react-router-dom';
import { useTrust } from '../contexts/TrustContext';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { isOnline } = useTrust();

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col transition-[filter] duration-700 ease-in-out"
      style={isOnline ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
    >
      <main className={isHome ? 'flex-1' : 'flex-1 max-w-4xl mx-auto px-4 py-8'}>
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            100% client-side. No servers.
          </p>
        </div>
      </footer>
    </div>
  );
}
