
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const saveReportToCache = <T>(key: string, data: T): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to save report to session storage", e);
  }
};

export const getReportFromCache = <T>(key: string): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();

    if (now - entry.timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (e) {
    console.error("Failed to parse cached report", e);
    return null;
  }
};

export const clearReportCache = (key: string): void => {
  sessionStorage.removeItem(key);
};
