// lib/cache.ts — File-based cache with TTL (no Redis needed)

import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheKey(key: string): string {
  return path.join(CACHE_DIR, key.replace(/[^a-z0-9_-]/gi, '_') + '.json');
}

export function cacheGet<T>(key: string): T | null {
  try {
    const file = cacheKey(key);
    if (!fs.existsSync(file)) return null;
    const entry: CacheEntry<T> = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (Date.now() > entry.expiresAt) {
      fs.unlinkSync(file);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  try {
    ensureCacheDir();
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlSeconds * 1000 };
    fs.writeFileSync(cacheKey(key), JSON.stringify(entry));
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  cacheSet(key, data, ttlSeconds);
  return data;
}
