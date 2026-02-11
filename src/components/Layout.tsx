import { Outlet, useLocation } from 'react-router-dom';
import { useTrust } from '../contexts/TrustContext';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { isOnline } = useTrust();

  return (
    <div
      className="min-h-screen bg-gray-50 transition-[filter] duration-700 ease-in-out"
      style={isOnline ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
    >
      <main className={isHome ? '' : 'max-w-4xl mx-auto px-4 py-8'}>
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>100% client-side. No servers.</p>
        </div>
      </footer>
    </div>
  );
}
