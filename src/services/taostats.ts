// Taostats API service
import { BITTENSOR_CONFIG } from '../config/bittensor';
import type { StakeBalance } from '../types';
import { taostatsRateLimiter } from '../utils/rateLimiter';

const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;

/**
 * Fetch all stake balances from Taostats API
 * Strategy: Fetch for each netuid separately to get alpha holders
 */
export async function getAllStakeBalances(): Promise<StakeBalance[]> {
  console.log('Fetching all stake balances from Taostats API...');
  console.log('Rate limit: 60 calls/minute (1 call/second)\n');
  
  const allStakes: StakeBalance[] = [];
  
  // Fetch stakes for all possible subnets (0-128, including root=0 for TAO stakes)
  const MAX_NETUID = 128;
  const netuids = Array.from({ length: MAX_NETUID + 1 }, (_, i) => i); // 0 to 128
  
  console.log(`Fetching stakes for netuids 0-${MAX_NETUID} with pagination (stops at 0.1 TAO)...`);
  
  // Process SEQUENTIALLY to respect rate limit (60 calls/minute = 1 call/sec)
  for (let i = 0; i < netuids.length; i++) {
    const netuid = netuids[i];
    
    try {
      // Paginate through all stakes for this netuid using page parameter
      let page = 1;
      let subnetStakes: StakeBalance[] = [];
      let shouldContinue = true;
      let totalPages = 0;
      
      while (shouldContinue) {
        const result = await taostatsRateLimiter.execute(async () => {
          const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${netuid}&page=${page}`;
          
          const response = await fetch(url, {
            headers: {
              'Authorization': API_KEY,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 404) return { stakes: [], pagination: null }; // Subnet doesn't exist
            throw new Error(`Taostats API error for netuid ${netuid}: ${response.status} ${response.statusText}`);
          }

          const responseData = await response.json() as any;
          const stakes = Array.isArray(responseData) ? responseData : (responseData.data || []);
          const pagination = responseData.pagination || null;
          
          return { stakes: stakes as StakeBalance[], pagination };
        }, `netuid ${netuid} page ${page}`);
        
        if (result.stakes.length === 0) {
          // No more stakes
          shouldContinue = false;
          break;
        }
        
        // Store total pages from first response
        if (page === 1 && result.pagination) {
          totalPages = result.pagination.total_pages || 0;
        }
        
        // Check if we should stop (all stakes in this page are < 0.1 TAO)
        const MIN_VALUE_TAO = 0.1;
        const allBelowThreshold = result.stakes.every(s => {
          const valueTao = Number(s.balance_as_tao) / 1e9;
          return valueTao < MIN_VALUE_TAO;
        });
        
        if (allBelowThreshold) {
          // Stop pagination for this subnet - all remaining are below threshold
          shouldContinue = false;
        } else {
          // Add stakes that are above threshold
          const validStakes = result.stakes.filter(s => {
            const valueTao = Number(s.balance_as_tao) / 1e9;
            return valueTao >= MIN_VALUE_TAO;
          });
          subnetStakes.push(...validStakes);
        }
        
        // Check if we've reached the last page
        if (result.pagination && !result.pagination.next_page) {
          shouldContinue = false;
        }
        
        page++;
        
        // Safety: stop after 100 pages (20,000 stakes)
        if (page > 100) {
          console.warn(`    (Stopping after 100 pages for netuid ${netuid})`);
          shouldContinue = false;
        }
      }
      
      if (subnetStakes.length > 0) {
        allStakes.push(...subnetStakes);
        const pagesInfo = totalPages > 0 ? `${page - 1}/${totalPages} pages` : `${page - 1} pages`;
        console.log(`  [${i+1}/${netuids.length}] Netuid ${netuid}: ${subnetStakes.length} stakes (${pagesInfo}, Total: ${allStakes.length})`);
      }
    } catch (error: any) {
      if (error.message.includes('404')) continue; // Skip non-existent subnets
      
      // Si erreur 429 après tous les retries, FAIL HARD
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.error(`\n❌ ERREUR CRITIQUE: Rate limit non résolu pour netuid ${netuid} après tous les retries`);
        throw new Error(`Rate limit error après retries pour netuid ${netuid}: ${error.message}`);
      }
      
      console.warn(`  [${i+1}/${netuids.length}] Warning for netuid ${netuid}:`, error.message);
    }
  }
  
  console.log(`✓ Fetched ${allStakes.length} total alpha stake records`);
  
  return allStakes;
}

/**
 * Get stake balances for a specific coldkey
 */
export async function getStakeBalanceByColdkey(coldkey: string): Promise<StakeBalance[]> {
  const url = `${API_URL}/api/dtao/stake_balance/latest/v1?coldkey=${coldkey}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Taostats API error: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json() as any;
  const data = responseData.data || responseData;
  
  return (Array.isArray(data) ? data : []) as StakeBalance[];
}

// LIQUIDITY POSITIONS REMOVED - Not needed for current analysis
// Liquidity positions are very rare and not significant for alpha holder analysis

/**
 * Interface for delegation transaction response from Taostats
 */
export interface DelegationTransaction {
  id: string;
  block_number: number;
  timestamp: string;
  action: 'DELEGATE' | 'UNDELEGATE';
  nominator: {
    ss58: string;
    hex: string;
  };
  delegate: {
    ss58: string;
    hex: string;
  };
  amount: string;
  netuid: number;
}

export interface DelegationResponse {
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    next_page: number | null;
    prev_page: number | null;
  };
  data: DelegationTransaction[];
}

/**
 * Fetch delegation transactions for a specific coldkey within the last N days
 * Returns the count of stake/unstake transactions
 */
export async function getStakeUnstakeCount(
  coldkey: string,
  days: number = 50
): Promise<number> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Helper to fetch a single page WITH rate limiting
  const fetchPage = async (page: number, perPage: number = 100): Promise<DelegationResponse> => {
    return await taostatsRateLimiter.execute(async () => {
      const url = `${API_URL}/api/delegation/v1?nominator=${coldkey}&page=${page}&per_page=${perPage}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Taostats API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as DelegationResponse;
    }, `tx page ${page} for ${coldkey.slice(0, 10)}...`);
  };
  
  // 1. Peek to see if there are any transactions
  const firstPage = await fetchPage(1, 1);
  
  if (firstPage.pagination.total_items === 0) {
    return 0;
  }
  
  // 2. If very few transactions (≤100), fetch all at once
  if (firstPage.pagination.total_items <= 100) {
    const allData = await fetchPage(1, 100);
    return allData.data.filter(tx => new Date(tx.timestamp) >= cutoffDate).length;
  }
  
  // 3. Fetch first full page to detect order
  const page1 = await fetchPage(1, 100);
  
  if (page1.data.length === 0) {
    return 0;
  }
  
  // 4. Determine order (DESC = newest first, ASC = oldest first)
  const firstTxDate = new Date(page1.data[0].timestamp);
  const lastTxDate = new Date(page1.data[page1.data.length - 1].timestamp);
  const isDescOrder = firstTxDate >= lastTxDate;
  
  // 5a. If DESC order → Early exit optimization possible
  if (isDescOrder) {
    let count = 0;
    let currentPage = 1;
    let pageData = page1; // Start with already fetched page 1
    
    while (true) {
      // Count recent transactions in this page
      const recentInPage = pageData.data.filter(tx => 
        new Date(tx.timestamp) >= cutoffDate
      );
      count += recentInPage.length;
      
      // Early exit: if last tx in page is older than cutoff, stop
      const lastTx = pageData.data[pageData.data.length - 1];
      if (new Date(lastTx.timestamp) < cutoffDate) {
        break;
      }
      
      // If no more pages, stop
      if (!pageData.pagination.next_page) {
        break;
      }
      
      // Fetch next page (rate limited)
      currentPage++;
      pageData = await fetchPage(currentPage, 100);
    }
    
    return count;
  }
  
  // 5b. If ASC order → Must fetch all pages
  else {
    const allData: DelegationTransaction[] = [];
    let currentPage = 1;
    
    while (true) {
      const pageData = await fetchPage(currentPage, 100);
      allData.push(...pageData.data);
      
      if (!pageData.pagination.next_page) {
        break;
      }
      
      currentPage++;
    }
    
    return allData.filter(tx => new Date(tx.timestamp) >= cutoffDate).length;
  }
}

/**
 * Batch fetch stake/unstake counts for multiple coldkeys
 * Rate limited: 60 calls/minute
 * Each coldkey may require multiple API calls (1 peek + N pages)
 */
export async function getStakeUnstakeCountsBatch(
  coldkeys: string[],
  days: number = 50
): Promise<Map<string, number>> {
  console.log(`\nFetching stake/unstake transaction counts for ${coldkeys.length} coldkeys (last ${days} days)...`);
  console.log('Rate limit: 60 calls/minute (1 call/second)');
  console.log(`Estimated time: ~${Math.ceil(coldkeys.length * 2 / 60)} minutes (avg 2 calls/coldkey)\n`);
  
  const results = new Map<string, number>();
  let successCount = 0;
  let errorCount = 0;
  
  // Process SEQUENTIALLY to avoid rate limit issues
  for (let i = 0; i < coldkeys.length; i++) {
    const ck = coldkeys[i];
    
    try {
      const count = await getStakeUnstakeCount(ck, days);
      results.set(ck, count);
      successCount++;
      
      if (count > 0) {
        console.log(`  [${i+1}/${coldkeys.length}] ${ck.slice(0, 10)}...: ${count} transactions`);
      }
      
      // Progress update every 50 wallets
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i+1}/${coldkeys.length} coldkeys processed (${successCount} success, ${errorCount} errors)`);
      }
    } catch (error: any) {
      errorCount++;
      
      // Si erreur 429 après tous les retries, FAIL HARD
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.error(`\n❌ ERREUR CRITIQUE: Rate limit non résolu pour coldkey ${ck.slice(0, 10)}... après tous les retries`);
        throw new Error(`Rate limit error après retries pour coldkey ${ck}: ${error.message}`);
      }
      
      console.warn(`  [${i+1}/${coldkeys.length}] Error for ${ck.slice(0, 10)}...: ${error.message}`);
      results.set(ck, 0); // Default to 0 on error (non 429)
    }
  }
  
  console.log(`\n✓ Transaction counts fetched: ${successCount} success, ${errorCount} errors`);
  
  return results;
}
