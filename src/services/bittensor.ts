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

  const wsEndpoint = endpoint || BITTENSOR_CONFIG.WEB_SOCKET_ARCHIVE_MENTATMINDS_FALLBACK;
  console.log(`Connecting to Bittensor chain at ${wsEndpoint}...`);

  const provider = new WsProvider(wsEndpoint);
  api = await ApiPromise.create({ provider });

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
  
  // Batch queries in chunks to avoid overwhelming the node
  const BATCH_SIZE = 100;
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
  }
  
  console.log('✓ Free balances fetched');
  return balances;
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
