// src/utils/muiStorageManager.ts
// Utility to sync color scheme with MUI's theme system

// MUI StorageManager for theme mode, using localStorage and event listeners
export function storageManager() {
  return {
    get: (defaultValue: string) => {
      try {
        return localStorage.getItem('mui-mode') || defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set: (value: string) => {
      try {
        localStorage.setItem('mui-mode', value);
        window.dispatchEvent(new StorageEvent('storage', { key: 'mui-mode', newValue: value }));
      } catch {}
    },
    subscribe: (handler: (value: string | null) => void) => {
      const listener = (event: StorageEvent) => {
        if (event.key === 'mui-mode') handler(event.newValue);
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
  };
}
