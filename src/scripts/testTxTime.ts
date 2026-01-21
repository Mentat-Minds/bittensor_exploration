// Quick test script for tx_time metric
import { getAllStakeBalances, getStakeUnstakeCountsBatch, getStakeUnstakeSessionCountsBatch } from '../services/taostats';

async function testTxTime() {
  console.log('\n=== Quick Test: tx_time Metric ===\n');
  
  // Step 1: Fetch some stake balances to get coldkeys
  console.log('Step 1: Fetching alpha stake balances...\n');
  const allStakes = await getAllStakeBalances();
  
  // Get alpha stakes only (netuid > 0)
  const alphaStakes = allStakes.filter(s => s.netuid > 0);
  
  // Get unique coldkeys
  const allColdkeys = new Set<string>();
  for (const stake of alphaStakes) {
    allColdkeys.add(stake.coldkey.ss58);
  }
  
  // Take only first 20 for quick test
  const testColdkeys = Array.from(allColdkeys).slice(0, 20);
  
  console.log(`\n✓ Selected ${testColdkeys.length} coldkeys for testing\n`);
  
  // Step 2: Fetch transaction counts
  console.log('Step 2: Fetching transaction counts (number_tx)...\n');
  const txCounts = await getStakeUnstakeCountsBatch(testColdkeys, 50);
  
  // Step 3: Fetch transaction session counts
  console.log('\nStep 3: Fetching transaction session counts (tx_time)...\n');
  const txSessionCounts = await getStakeUnstakeSessionCountsBatch(testColdkeys, 50);
  
  // Step 4: Display results
  console.log('\n\n=== RESULTS ===\n');
  console.log('Coldkey | number_tx | tx_time | Ratio');
  console.log('-'.repeat(70));
  
  for (const coldkey of testColdkeys) {
    const numTx = txCounts.get(coldkey) || 0;
    const txTime = txSessionCounts.get(coldkey) || 0;
    const ratio = numTx > 0 ? (numTx / txTime).toFixed(2) : 'N/A';
    
    if (numTx > 0 || txTime > 0) {
      console.log(`${coldkey.slice(0, 10)}... | ${numTx.toString().padStart(9)} | ${txTime.toString().padStart(7)} | ${ratio}`);
    }
  }
  
  // Summary
  const totalTx = Array.from(txCounts.values()).reduce((sum, val) => sum + val, 0);
  const totalSessions = Array.from(txSessionCounts.values()).reduce((sum, val) => sum + val, 0);
  const avgRatio = totalSessions > 0 ? (totalTx / totalSessions).toFixed(2) : 'N/A';
  
  console.log('-'.repeat(70));
  console.log(`\nTotal TX: ${totalTx}`);
  console.log(`Total Sessions: ${totalSessions}`);
  console.log(`Average TX per session: ${avgRatio}`);
  console.log('\n✓ Test complete!\n');
}

testTxTime().catch(console.error);
