import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

export interface BlockedRequest {
  id: number;
  url: string;
  method: string;
  type: 'fetch' | 'xhr';
  timestamp: number;
}

interface TrustContextType {
  isOnline: boolean;
  blockedRequests: BlockedRequest[];
  clearBlockedRequests: () => void;
}

const TrustContext = createContext<TrustContextType | undefined>(undefined);

function isExternal(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'ws:' || parsed.protocol === 'wss:') return false;
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return false;
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function TrustProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [blockedRequests, setBlockedRequests] = useState<BlockedRequest[]>([]);
  const idRef = useRef(0);

  const logBlocked = useCallback((url: string, method: string, type: 'fetch' | 'xhr') => {
    setBlockedRequests((prev) => [
      ...prev,
      { id: ++idRef.current, url, method, type, timestamp: Date.now() },
    ]);
  }, []);

  const clearBlockedRequests = useCallback(() => {
    idRef.current = 0;
    setBlockedRequests([]);
  }, []);

  // Patch fetch and XHR to block external requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (isExternal(url)) {
        const method = init?.method?.toUpperCase() || 'GET';
        logBlocked(url, method, 'fetch');
        return Promise.reject(new Error(`[Unfiled] Blocked outbound ${method} to ${url}`));
      }
      return originalFetch.apply(this, [input, init] as Parameters<typeof originalFetch>);
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    XMLHttpRequest.prototype.open = function (...args: any[]) {
      const method = args[0] as string;
      const url = args[1];
      const urlStr = typeof url === 'string' ? url : (url as URL).href;
      if (isExternal(urlStr)) {
        logBlocked(urlStr, method.toUpperCase(), 'xhr');
        args[1] = 'data:text/plain,blocked';
        return originalXhrOpen.apply(this, args as Parameters<typeof originalXhrOpen>);
      }
      return originalXhrOpen.apply(this, args as Parameters<typeof originalXhrOpen>);
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
    };
  }, [logBlocked]);

  // Online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <TrustContext.Provider value={{ isOnline, blockedRequests, clearBlockedRequests }}>
      {children}
    </TrustContext.Provider>
  );
}

export function useTrust() {
  const context = useContext(TrustContext);
  if (context === undefined) {
    throw new Error('useTrust must be used within a TrustProvider');
  }
  return context;
}
