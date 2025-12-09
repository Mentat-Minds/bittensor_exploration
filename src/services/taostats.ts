// Taostats API service
import { BITTENSOR_CONFIG } from '../config/bittensor';
import type { StakeBalance } from '../types';

const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;

/**
 * Fetch all stake balances from Taostats API
 * Strategy: Fetch for each netuid separately to get alpha holders
 */
export async function getAllStakeBalances(): Promise<StakeBalance[]> {
  console.log('Fetching all stake balances from Taostats API...');
  
  const allStakes: StakeBalance[] = [];
  
  // Fetch stakes for all possible subnets (0-100, including root=0 for TAO stakes)
  // We'll fetch in parallel batches to be faster
  const MAX_NETUID = 100; // Most subnets are under this
  const netuids = Array.from({ length: MAX_NETUID + 1 }, (_, i) => i); // 0 to 100
  
  console.log(`Fetching stakes for netuids 1-${MAX_NETUID}...`);
  
  // Process in batches of 10 to avoid overwhelming the API
  const BATCH_SIZE = 10;
  for (let i = 0; i < netuids.length; i += BATCH_SIZE) {
    const batch = netuids.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (netuid) => {
      try {
        const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${netuid}&limit=10000`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // If 404 or no data, subnet doesn't exist, just skip
          if (response.status === 404) return [];
          throw new Error(`Taostats API error for netuid ${netuid}: ${response.status}`);
        }

        const responseData = await response.json() as any;
        const data = responseData.data || responseData;
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  Netuid ${netuid}: ${data.length} stakes`);
          return data as StakeBalance[];
        }
        return [];
      } catch (error: any) {
        // Silently skip subnets that don't exist
        if (error.message.includes('404')) return [];
        console.warn(`  Warning for netuid ${netuid}:`, error.message);
        return [];
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(stakes => allStakes.push(...stakes));
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 200));
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
