// Quick test script for tx_time metric
import { getAllStakeBalances, getStakeUnstakeMetricsBatch } from '../services/taostats';

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
  
  // Step 2: Fetch transaction metrics (OPTIMIZED: both number_tx and tx_time in one call)
  console.log('Step 2: Fetching transaction metrics (count + sessions)...\n');
  const txMetrics = await getStakeUnstakeMetricsBatch(testColdkeys, 50);
  
  // Step 3: Display results
  console.log('\n\n=== RESULTS ===\n');
  console.log('Full coldkey addresses with data:\n');
  
  let totalTx = 0;
  let totalSessions = 0;
  
  for (const coldkey of testColdkeys) {
    const metrics = txMetrics.get(coldkey);
    const numTx = metrics?.number_tx || 0;
    const txTime = metrics?.tx_time || 0;
    const ratio = numTx > 0 && txTime > 0 ? (numTx / txTime).toFixed(2) : 'N/A';
    
    if (numTx > 0 || txTime > 0) {
      console.log(`${coldkey},${numTx},${txTime},${ratio}`);
      totalTx += numTx;
      totalSessions += txTime;
    }
  }
  
  // Summary
  const avgRatio = totalSessions > 0 ? (totalTx / totalSessions).toFixed(2) : 'N/A';
  
  console.log('-'.repeat(70));
  console.log(`\nTotal TX: ${totalTx}`);
  console.log(`Total Sessions: ${totalSessions}`);
  console.log(`Average TX per session: ${avgRatio}`);
  console.log('\n✓ Test complete!\n');
}

testTxTime().catch(console.error);
