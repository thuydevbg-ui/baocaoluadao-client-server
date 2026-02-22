/**
 * PhishTank Service
 * Integration with PhishTank API - International phishing database
 * Website: https://www.phishtank.com/
 * API: http://data.phishtank.com/data/
 */

export interface PhishTankEntry {
  phish_id: number;
  url: string;
  phish_detail_url: string;
  submission_time: string;
  verified: string;
  verification_time: string;
  online: string;
  target: string;
}

export interface PhishTankResponse {
  entries: PhishTankEntry[];
}

// Free PhishTank data feed (updated every hour)
// This is a publicly available dataset
const PHISHTANK_FEED_URL = 'https://data.phishtank.com/data/online-valid.json';

/**
 * Fetch phishing data from PhishTank
 * Note: For production use, you should register for an API key at:
 * https://www.phishtank.com/api_contrib.php
 */
export async function fetchPhishTankData(): Promise<PhishTankEntry[]> {
  try {
    const response = await fetch(PHISHTANK_FEED_URL, {
      headers: {
        // For production, add your API key:
        // 'PhishTank-API-Key': process.env.PHISHTANK_API_KEY,
        'User-Agent': 'ScamGuard/1.0 (anti-scam platform)',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`PhishTank API error: ${response.status}`);
    }

    const data: PhishTankResponse = await response.json();
    
    // Filter for verified and online phishing sites
    const validPhishes = data.entries.filter(
      entry => entry.verified === 'yes' && entry.online === 'yes'
    );

    return validPhishes;
  } catch (error) {
    console.error('Error fetching PhishTank data:', error);
    return [];
  }
}

/**
 * Search for a specific URL in PhishTank database
 */
export async function checkUrlInPhishTank(url: string): Promise<PhishTankEntry | null> {
  const allPhishes = await fetchPhishTankData();
  
  // Simple URL matching (could be improved with URL normalization)
  return allPhishes.find(entry => entry.url.includes(url)) || null;
}

/**
 * Get recent phishing sites (last N entries)
 */
export async function getRecentPhishes(limit: number = 50): Promise<PhishTankEntry[]> {
  const allPhishes = await fetchPhishTankData();
  
  // Sort by submission time (newest first)
  const sorted = allPhishes.sort(
    (a, b) => new Date(b.submission_time).getTime() - new Date(a.submission_time).getTime()
  );
  
  return sorted.slice(0, limit);
}

/**
 * Get phishing statistics
 */
export async function getPhishTankStats(): Promise<{
  total: number;
  byTarget: Record<string, number>;
  lastUpdated: string;
}> {
  const allPhishes = await fetchPhishTankData();
  
  // Count by target
  const byTarget: Record<string, number> = {};
  allPhishes.forEach(entry => {
    const target = entry.target || 'Unknown';
    byTarget[target] = (byTarget[target] || 0) + 1;
  });
  
  return {
    total: allPhishes.length,
    byTarget,
    lastUpdated: allPhishes[0]?.submission_time || new Date().toISOString(),
  };
}
