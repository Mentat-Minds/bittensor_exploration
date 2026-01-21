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
  console.log('Rate limit: 200 calls/minute (~3 calls/second)\n');
  
  const allStakes: StakeBalance[] = [];
  
  // Fetch stakes for all possible subnets (0-128, including root=0 for TAO stakes)
  const MAX_NETUID = 128;
  const netuids = Array.from({ length: MAX_NETUID + 1 }, (_, i) => i); // 0 to 128
  
  console.log(`Fetching stakes for netuids 0-${MAX_NETUID} with pagination (stops at 0.1 TAO)...`);
  
  // Process SEQUENTIALLY to respect rate limit (200 calls/minute = ~3 calls/sec)
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

/**
 * Fetch all liquidity positions from Taostats API
 */
export async function getAllLiquidityPositions(): Promise<any[]> {
  console.log('\nFetching all liquidity positions from Taostats API...');
  console.log('Rate limit: 200 calls/minute (~3 calls/second)\n');
  
  const allPositions: any[] = [];
  
  // Fetch liquidity positions for all subnets
  const MAX_NETUID = 100;
  const netuids = Array.from({ length: MAX_NETUID + 1 }, (_, i) => i);
  
  console.log(`Fetching liquidity positions for netuids 0-${MAX_NETUID} (101 requests at ~3/sec = ~30 seconds)...`);
  
  // Process SEQUENTIALLY to respect rate limit
  for (let i = 0; i < netuids.length; i++) {
    const netuid = netuids[i];
    
    try {
      const positions = await taostatsRateLimiter.execute(async () => {
        const url = `${API_URL}/api/dtao/liquidity/position/v1?netuid=${netuid}&limit=10000`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) return [];
          throw new Error(`Taostats API error for netuid ${netuid}: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json() as any;
        const data = responseData.data || responseData;
        
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
        return [];
      }, `netuid ${netuid} LP`);
      
      if (positions.length > 0) {
        allPositions.push(...positions);
        console.log(`  [${i+1}/${netuids.length}] Netuid ${netuid}: ${positions.length} liquidity positions (Total: ${allPositions.length})`);
      }
    } catch (error: any) {
      if (error.message.includes('404')) continue;
      console.warn(`  [${i+1}/${netuids.length}] Warning for netuid ${netuid}:`, error.message);
    }
  }
  
  console.log(`✓ Fetched ${allPositions.length} total liquidity positions`);
  
  return allPositions;
}

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
 * OPTIMIZED: Fetch transactions once and calculate both metrics
 * Returns: { number_tx: total count, tx_time: session count }
 */
export async function getStakeUnstakeMetrics(
  coldkey: string,
  days: number = 50
): Promise<{ number_tx: number; tx_time: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Rate-limited fetch function
  const fetchPage = async (page: number, limit: number): Promise<DelegationResponse> => {
    return await taostatsRateLimiter.execute(async () => {
      const url = `${API_URL}/api/delegation/v1?nominator=${coldkey}&page=${page}&per_page=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json() as DelegationResponse;
    });
  };
  
  // Fetch all transactions
  const allTransactions: DelegationTransaction[] = [];
  let currentPage = 1;
  
  // Peek first page to check order
  const firstPage: DelegationResponse = await fetchPage(1, 100);
  const isDescOrder = firstPage.data.length >= 2 && 
    new Date(firstPage.data[0].timestamp) > new Date(firstPage.data[1].timestamp);
  
  if (isDescOrder) {
    // DESC order: fetch until we hit cutoff date
    let pageData = firstPage;
    
    while (true) {
      const recentInPage = pageData.data.filter(tx => 
        new Date(tx.timestamp) >= cutoffDate
      );
      allTransactions.push(...recentInPage);
      
      const lastTx = pageData.data[pageData.data.length - 1];
      if (new Date(lastTx.timestamp) < cutoffDate || !pageData.pagination.next_page) {
        break;
      }
      
      currentPage++;
      pageData = await fetchPage(currentPage, 100);
    }
  } else {
    // ASC order: fetch all pages then filter
    let pageData = firstPage;
    allTransactions.push(...pageData.data);
    
    while (pageData.pagination.next_page) {
      currentPage++;
      pageData = await fetchPage(currentPage, 100);
      allTransactions.push(...pageData.data);
    }
  }
  
  // Filter by date and sort by timestamp
  const recentTxs = allTransactions
    .filter(tx => new Date(tx.timestamp) >= cutoffDate)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Metric 1: Total transaction count
  const number_tx = recentTxs.length;
  
  if (recentTxs.length === 0) {
    return { number_tx: 0, tx_time: 0 };
  }
  
  // Metric 2: Group transactions into 1-hour sessions
  let sessionCount = 1;
  let sessionStart = new Date(recentTxs[0].timestamp);
  
  for (let i = 1; i < recentTxs.length; i++) {
    const currentTxTime = new Date(recentTxs[i].timestamp);
    const hoursSinceSessionStart = (currentTxTime.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
    
    // If more than 1 hour since session start, it's a new session
    if (hoursSinceSessionStart > 1) {
      sessionCount++;
      sessionStart = currentTxTime;
    }
  }
  
  return { number_tx, tx_time: sessionCount };
}

/**
 * Batch fetch stake/unstake counts for multiple coldkeys
 * Rate limited: 200 calls/minute
 * Each coldkey may require multiple API calls (1 peek + N pages)
 */
export async function getStakeUnstakeCountsBatch(
  coldkeys: string[],
  days: number = 50
): Promise<Map<string, number>> {
  console.log(`\nFetching stake/unstake transaction counts for ${coldkeys.length} coldkeys (last ${days} days)...`);
  console.log('Rate limit: 200 calls/minute (~3 calls/second)');
  console.log(`Estimated time: ~${Math.ceil(coldkeys.length * 2 / 200)} minutes (avg 2 calls/coldkey)\n`);
  
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
      console.warn(`  [${i+1}/${coldkeys.length}] Error for ${ck.slice(0, 10)}...: ${error.message}`);
      results.set(ck, 0); // Default to 0 on error
    }
  }
  
  console.log(`\n✓ Transaction counts fetched: ${successCount} success, ${errorCount} errors`);
  
  return results;
}

/**
 * OPTIMIZED BATCH: Fetch transactions once per coldkey and calculate both metrics
 * Returns: Map with both number_tx and tx_time for each coldkey
 */
export async function getStakeUnstakeMetricsBatch(
  coldkeys: string[],
  days: number = 50
): Promise<Map<string, { number_tx: number; tx_time: number }>> {
  console.log(`\nFetching transaction metrics for ${coldkeys.length} coldkeys (last ${days} days)...`);
  console.log('Metrics: number_tx (total count) + tx_time (sessions grouped by 1h)');
  console.log('Rate limit: 200 calls/minute (~3 calls/second)');
  console.log(`Estimated time: ~${Math.ceil(coldkeys.length * 2 / 200)} minutes (avg 2 calls/coldkey)\n`);
  
  const results = new Map<string, { number_tx: number; tx_time: number }>();
  let successCount = 0;
  let errorCount = 0;
  
  // Process SEQUENTIALLY to avoid rate limit issues
  for (let i = 0; i < coldkeys.length; i++) {
    const ck = coldkeys[i];
    
    try {
      const metrics = await getStakeUnstakeMetrics(ck, days);
      results.set(ck, metrics);
      successCount++;
      
      if (metrics.number_tx > 0) {
        console.log(`  [${i+1}/${coldkeys.length}] ${ck.slice(0, 10)}...: ${metrics.number_tx} transactions, ${metrics.tx_time} sessions`);
      }
      
      // Progress update every 50 wallets
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i+1}/${coldkeys.length} coldkeys processed (${successCount} success, ${errorCount} errors)`);
      }
    } catch (error: any) {
      errorCount++;
      console.warn(`  [${i+1}/${coldkeys.length}] Error for ${ck.slice(0, 10)}...: ${error.message}`);
      results.set(ck, { number_tx: 0, tx_time: 0 }); // Default to 0 on error
    }
  }
  
  console.log(`\n✓ Transaction metrics fetched: ${successCount} success, ${errorCount} errors`);
  
  return results;
}
