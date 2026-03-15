/**
 * Data Source Configuration
 * Centralized configuration for all data sources
 */
import { env } from './env';

// Default source name - can be configured via environment variable
const DEFAULT_SOURCE_NAME = 'tinnhiemmang.vn';
const DEFAULT_SOURCE_URL = 'https://tinnhiemmang.vn';
const DEFAULT_SOURCE_ICON = 'https://tinnhiemmang.vn/img/icon_web2.png';

/**
 * Get the configured data source name
 */
export function getSourceName(): string {
  return env.DATA_SOURCE_NAME || DEFAULT_SOURCE_NAME;
}

/**
 * Get the configured data source URL
 */
export function getSourceURL(): string {
  return env.DATA_SOURCE_URL || DEFAULT_SOURCE_URL;
}

/**
 * Get the configured data source icon
 */
export function getSourceIcon(): string {
  return env.DATA_SOURCE_ICON || DEFAULT_SOURCE_ICON;
}

/**
 * Format source for display (e.g., "Nguồn: tinnhiemmang.vn")
 */
export function formatSourceLabel(source?: string): string {
  const sourceName = source || getSourceName();
  return `Nguồn: ${sourceName}`;
}

/**
 * Get source display title
 * Converts domain to readable title
 */
export function getSourceTitle(source?: string): string {
  const sourceName = source || getSourceName();
  
  if (sourceName.includes('tinnhiemmang')) {
    return 'TinNhiemMang.vn';
  }
  
  // Convert domain to title case
  return sourceName
    .replace(/\\.vn$/, '')
    .split(/[-.]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if a source is the primary data source
 */
export function isPrimarySource(source?: string): boolean {
  const sourceName = source || getSourceName();
  const primaryName = getSourceName();
  return sourceName === primaryName || sourceName.includes('tinnhiemmang');
}

/**
 * Get source icon with fallback
 */
export function getSourceImageWithFallback(
  sourceIcon?: string | null,
  fallbackSrc: string = getSourceIcon()
): string {
  return sourceIcon || fallbackSrc;
}

/**
 * All data source configurations
 */
export const DATA_SOURCES = {
  primary: {
    name: getSourceName(),
    url: getSourceURL(),
    icon: getSourceIcon(),
  },
  // Can add more sources here as needed
  // alternative: {
  //   name: 'scamwatch',
  //   url: 'https://scamwatch.com',
  //   icon: 'https://scamwatch.com/icon.png',
  // },
} as const;

export type SourceName = keyof typeof DATA_SOURCES;
