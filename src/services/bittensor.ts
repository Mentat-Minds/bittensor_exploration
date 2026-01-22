// Bittensor chain service
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BITTENSOR_CONFIG } from '../config/bittensor';

let api: ApiPromise | null = null;

/**
 * Connect to Bittensor chain
 */
export async function connectToChain(endpoint?: string): Promise<ApiPromise> {
  if (api) {
    return api;
  }

  const wsEndpoint = endpoint || BITTENSOR_CONFIG.WEB_SOCKET_ARCHIVE_MENTATMINDS;
  console.log(`Connecting to Bittensor chain at ${wsEndpoint}...`);

  // Configure provider with better error handling
  const provider = new WsProvider(wsEndpoint);
  
  // Suppress verbose WebSocket logs
  provider.on('error', () => {
    // Silently handle connection errors to avoid console spam
  });

  api = await ApiPromise.create({ 
    provider,
    noInitWarn: true, // Suppress initialization warnings
  });

  console.log('✓ Connected to Bittensor chain');
  return api;
}

/**
 * Get free balance for a coldkey
 */
export async function getFreeBalance(coldkey: string): Promise<number> {
  if (!api) {
    throw new Error('Not connected to chain. Call connectToChain() first.');
  }

  const account = await api.query.system.account(coldkey);
  const accountData = account.toJSON() as any;
  const freeBalanceRao = BigInt(accountData.data.free);
  
  // Convert RAO to TAO (divide by 1e9)
  return Number(freeBalanceRao) / 1e9;
}

/**
 * Get free balances for multiple coldkeys (batched)
 */
export async function getFreeBalances(coldkeys: string[]): Promise<Map<string, number>> {
  if (!api) {
    throw new Error('Not connected to chain. Call connectToChain() first.');
  }

  console.log(`Querying free balances for ${coldkeys.length} coldkeys...`);
  
  const balances = new Map<string, number>();
  
  // Batch queries in smaller chunks to avoid overwhelming the node
  const BATCH_SIZE = 50; // Reduced from 100 to be gentler on the node
  for (let i = 0; i < coldkeys.length; i += BATCH_SIZE) {
    const batch = coldkeys.slice(i, i + BATCH_SIZE);
    
    const queries = batch.map(ck => api!.query.system.account(ck));
    const results = await Promise.all(queries);
    
    results.forEach((account, idx) => {
      const accountData = account.toJSON() as any;
      const freeBalanceRao = BigInt(accountData.data.free);
      balances.set(batch[idx], Number(freeBalanceRao) / 1e9);
    });
    
    console.log(`  Processed ${Math.min(i + BATCH_SIZE, coldkeys.length)}/${coldkeys.length} coldkeys`);
    
    // Add small delay between batches to avoid overwhelming the node
    if (i + BATCH_SIZE < coldkeys.length) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
  }
  
  console.log('✓ Free balances fetched');
  return balances;
}

/**
 * Check if a coldkey has a staking proxy set
 */
export async function hasStakingProxy(coldkey: string): Promise<boolean> {
  if (!api) {
    throw new Error('Not connected to chain. Call connectToChain() first.');
  }

  const proxies = await api.query.proxy.proxies(coldkey);
  const proxiesData = proxies.toJSON() as any;
  
  // proxiesData is an array [proxies[], deposit]
  const proxyList = proxiesData[0] || [];
  
  // Check if any proxy has type 'Staking'
  return proxyList.some((proxy: any) => proxy.proxyType === 'Staking');
}

/**
 * Check staking proxy for multiple coldkeys (batched)
 */
export async function getStakingProxies(coldkeys: string[]): Promise<Map<string, boolean>> {
  if (!api) {
    throw new Error('Not connected to chain. Call connectToChain() first.');
  }

  console.log(`Querying staking proxies for ${coldkeys.length} coldkeys...`);
  
  const proxiesMap = new Map<string, boolean>();
  
  // Batch queries in smaller chunks
  const BATCH_SIZE = 50;
  for (let i = 0; i < coldkeys.length; i += BATCH_SIZE) {
    const batch = coldkeys.slice(i, i + BATCH_SIZE);
    
    const queries = batch.map(ck => api!.query.proxy.proxies(ck));
    const results = await Promise.all(queries);
    
    results.forEach((proxies, idx) => {
      const proxiesData = proxies.toJSON() as any;
      const proxyList = proxiesData[0] || [];
      const hasStaking = proxyList.some((proxy: any) => proxy.proxyType === 'Staking');
      proxiesMap.set(batch[idx], hasStaking);
    });
    
    console.log(`  Processed ${Math.min(i + BATCH_SIZE, coldkeys.length)}/${coldkeys.length} coldkeys`);
    
    // Add small delay between batches
    if (i + BATCH_SIZE < coldkeys.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('✓ Staking proxies fetched');
  return proxiesMap;
}

/**
 * Disconnect from chain
 */
export async function disconnectFromChain(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
    console.log('✓ Disconnected from chain');
  }
}
