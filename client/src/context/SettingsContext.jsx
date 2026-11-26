import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { PublicAPI } from '../api/services.js';
import { extractErrorMessage } from '../api/axiosClient.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PublicAPI.getSettings();
      setSettings(data.settings);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load café settings from MySQL.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
