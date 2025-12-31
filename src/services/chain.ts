/**
 * Blockchain service for querying Bittensor chain directly
 * Used for neuron classification and metagraph data
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BITTENSOR_CONFIG } from '../config/bittensor';

let api: ApiPromise | null = null;

/**
 * Connect to the Bittensor chain
 */
export async function connectToChain(): Promise<void> {
  if (api?.isConnected) {
    console.log('Already connected to chain');
    return;
  }

  const endpoint = BITTENSOR_CONFIG.WEB_SOCKET_ARCHIVE_MENTATMINDS_FALLBACK;
  console.log(`Connecting to Bittensor chain: ${endpoint}`);
  
  const provider = new WsProvider(endpoint);
  
  api = await ApiPromise.create({ 
    provider,
    throwOnConnect: true,
  });

  await api.isReady;
  
  console.log('✓ Connected to Bittensor chain');
}

/**
 * Get the API instance (must connect first)
 */
export function getApi(): ApiPromise {
  if (!api) {
    throw new Error('Chain not connected. Call connectToChain() first.');
  }
  return api;
}

/**
 * Disconnect from the chain
 */
export async function disconnectFromChain(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
    console.log('✓ Disconnected from chain');
  }
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return api?.isConnected || false;
}
