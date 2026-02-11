import { useState, useEffect, useRef } from 'react';
import { Terminal, WifiOff } from 'lucide-react';
import { useTrust } from '../contexts/TrustContext';

export default function NetworkMonitor() {
  const [testing, setTesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isOnline, blockedRequests, clearBlockedRequests } = useTrust();

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [blockedRequests]);

  const handleTest = async () => {
    setTesting(true);
    try {
      await fetch('https://httpbin.org/get');
    } catch {
      // Blocked by our interceptor — exactly what we want
    } finally {
      setTesting(false);
    }
  };

  const count = blockedRequests.length;

  if (!isOnline) {
    return (
      <div className="mt-8">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-10 text-center">
          <WifiOff className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">You're offline</h3>
          <p className="text-gray-400">
            And everything still works. That's the point.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-8 transition-[filter] duration-700 ease-in-out"
      style={isOnline ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
    >
      {/* Terminal window */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden font-mono text-sm">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-gray-500 text-xs">network-firewall — {count} request{count !== 1 ? 's' : ''} blocked</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-md hover:bg-indigo-400 transition-colors disabled:opacity-50"
            >
              {testing ? 'sending…' : 'Test it →'}
            </button>
            {count > 0 && (
              <button
                onClick={clearBlockedRequests}
                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        </div>

        {/* Terminal body */}
        <div ref={scrollRef} className="px-4 py-3 min-h-[120px] max-h-[240px] overflow-y-auto">
          <p className="text-green-500 mb-1">
            <span className="text-gray-600">$</span> Patching window.fetch — intercepting outbound requests
          </p>
          <p className="text-green-500 mb-1">
            <span className="text-gray-600">$</span> Patching XMLHttpRequest.open — intercepting outbound requests
          </p>
          <p className="text-gray-500 mb-3">
            <span className="text-gray-600">$</span> Firewall active. All external requests will be blocked.
          </p>

          {blockedRequests.length === 0 ? (
            <>
              <p className="text-gray-600 mb-1">
                &nbsp;&nbsp;0 outbound requests attempted.
              </p>
              <p className="text-gray-600 mb-1">
                &nbsp;&nbsp;Process files above — nothing will leave your browser.
              </p>
              <p className="text-gray-700 animate-pulse mt-2">█</p>
            </>
          ) : (
            <>
              {blockedRequests.map((entry) => (
                <div key={entry.id} className="mb-1 break-all">
                  <span className="text-red-500 font-bold">BLOCKED </span>
                  <span className="text-indigo-400">{entry.method}</span>
                  {' '}
                  <span className="text-gray-300">{entry.url}</span>
                  <span className="text-red-400/60 ml-2">← rejected, 0 bytes sent</span>
                </div>
              ))}
              <p className="text-gray-700 animate-pulse mt-1">█</p>
            </>
          )}
        </div>
      </div>

      {/* Explainer */}
      <div className="mt-4 flex items-start gap-3">
        <Terminal className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-500">
          Unfiled patches <code className="text-indigo-600 bg-gray-100 px-1 py-0.5 rounded text-xs">window.fetch</code> and <code className="text-indigo-600 bg-gray-100 px-1 py-0.5 rounded text-xs">XMLHttpRequest</code> to
          block all external requests before they leave your browser. Click "Test it" to try — it gets blocked.
        </p>
      </div>
    </div>
  );
}
