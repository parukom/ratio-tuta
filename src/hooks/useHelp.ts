'use client';

import { useEffect, useState } from 'react';

export function useHelp() {
  const [showHelp, setShowHelp] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/me/settings');
        if (!res.ok) {
          if (active) setShowHelp(true); // default to true on error
          return;
        }
        const data = (await res.json()) as { showHelp: boolean };
        if (active) {
          setShowHelp(data.showHelp ?? true);
        }
      } catch {
        if (active) setShowHelp(true); // default to true on error
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleHelp = async (value: boolean) => {
    try {
      setShowHelp(value);
      const res = await fetch('/api/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showHelp: value }),
      });
      if (!res.ok) {
        // Revert on error
        setShowHelp(!value);
      }
    } catch {
      // Revert on error
      setShowHelp(!value);
    }
  };

  return { showHelp, toggleHelp, loading };
}
