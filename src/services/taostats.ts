// Taostats API service
import { BITTENSOR_CONFIG } from '../config/bittensor';
import type { StakeBalance } from '../types';

const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;

/**
 * Fetch all stake balances from Taostats API
 */
export async function getAllStakeBalances(): Promise<StakeBalance[]> {
  console.log('Fetching all stake balances from Taostats API...');
  
  const url = `${API_URL}/api/dtao/stake_balance/latest/v1`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Taostats API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as StakeBalance[];
  console.log(`✓ Fetched ${data.length} stake records`);
  
  return data;
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

  return await response.json() as StakeBalance[];
}
