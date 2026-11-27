import { useState } from 'react';

const keys = {
  logs: 'vigil:logs:live',
  metrics: 'vigil:metrics:live',
  traces: 'vigil:traces:live',
};

export function clearLivePreferences() {
  try {
    for (const key of Object.values(keys)) localStorage.removeItem(key);
  } catch {
    // Storage may be disabled by the browser.
  }
}

export function useLivePreference(page: keyof typeof keys) {
  const key = keys[page];
  const [live, setLive] = useState(() => {
    try {
      return localStorage.getItem(key) !== 'false';
    } catch {
      return true;
    }
  });

  function toggleLive() {
    const next = !live;
    setLive(next);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      // The toggle still works in memory when storage is unavailable.
    }
  }

  return { live, toggleLive, pauseLive: () => setLive(false) };
}
