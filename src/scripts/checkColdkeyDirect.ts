// Check coldkey using direct API query by coldkey address
import { BITTENSOR_CONFIG } from '../config/bittensor';
import { connectToChain, getFreeBalance, getStakingProxies, disconnectFromChain } from '../services/bittensor';

async function checkColdkeyDirect() {
  const targetColdkey = '5FjyK7GpbkAUHaFuLznsq5Yh9kzwFc6Gv1WhyvQdiyNfaQn2';
  
  console.log('\n=== Checking Coldkey (Direct Query) ===');
  console.log(`Coldkey: ${targetColdkey}\n`);
  
  // Connect to chain
  await connectToChain();
  
  // Check staking proxy
  const proxies = await getStakingProxies([targetColdkey]);
  const hasProxy = proxies.get(targetColdkey) || false;
  console.log(`✓ Staking Proxy: ${hasProxy ? '✓ YES' : '✗ NO'}\n`);
  
  // Get free balance
  const freeBalance = await getFreeBalance(targetColdkey);
  console.log(`✓ Free Balance: ${freeBalance.toFixed(4)} TAO\n`);
  
  await disconnectFromChain();
  
  // Fetch stakes DIRECTLY for this coldkey across all subnets
  console.log('Fetching stakes directly for this coldkey...\n');
  
  const allStakes: any[] = [];
  
  // Query all netuids (0-100) for this specific coldkey
  for (let netuid = 0; netuid <= 100; netuid++) {
    const url = `${BITTENSOR_CONFIG.TAOSTAT_API_URL}/api/dtao/stake_balance/latest/v1?netuid=${netuid}&coldkey=${targetColdkey}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': BITTENSOR_CONFIG.TAOSTAT_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        const stakes = Array.isArray(data) ? data : (data.data || []);
        
        if (stakes.length > 0) {
          console.log(`  ✓ Netuid ${netuid}: Found ${stakes.length} stake(s)`);
          allStakes.push(...stakes);
        }
      }
      
      // Rate limiting: wait 1 second between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Skip errors silently
    }
  }
  
  console.log(`\n✓ Total stakes found: ${allStakes.length}\n`);
  
  if (allStakes.length === 0) {
    console.log('No stakes found for this coldkey.\n');
    return;
  }
  
  // Display stakes breakdown
  console.log('=== STAKES BREAKDOWN ===\n');
  
  const taoStakes = allStakes.filter((s: any) => s.netuid === 0);
  const alphaStakes = allStakes.filter((s: any) => s.netuid > 0);
  
  if (taoStakes.length > 0) {
    console.log('TAO Stakes (Root - netuid 0):');
    let totalTaoStaked = 0;
    taoStakes.forEach((stake: any) => {
      const amount = Number(stake.balance) / 1e9;
      totalTaoStaked += amount;
      console.log(`  - Hotkey: ${stake.hotkey.ss58}`);
      console.log(`    Amount: ${amount.toFixed(4)} TAO`);
    });
    console.log(`  → Total TAO Staked: ${totalTaoStaked.toFixed(4)} TAO\n`);
  }
  
  if (alphaStakes.length > 0) {
    console.log('Alpha Stakes:');
    let totalAlphaValue = 0;
    
    // Group by netuid
    const byNetuid = new Map<number, any[]>();
    alphaStakes.forEach((stake: any) => {
      if (!byNetuid.has(stake.netuid)) {
        byNetuid.set(stake.netuid, []);
      }
      byNetuid.get(stake.netuid)!.push(stake);
    });
    
    for (const [netuid, stakes] of byNetuid.entries()) {
      console.log(`\n  Netuid ${netuid}:`);
      let netuidAlpha = 0;
      let netuidValue = 0;
      
      stakes.forEach((stake: any) => {
        const alpha = Number(stake.balance) / 1e9;
        const value = Number(stake.balance_as_tao) / 1e9;
        netuidAlpha += alpha;
        netuidValue += value;
        
        console.log(`    - Hotkey: ${stake.hotkey.ss58}`);
        console.log(`      Alpha: ${alpha.toFixed(4)}`);
        console.log(`      Value: ${value.toFixed(4)} TAO`);
      });
      
      totalAlphaValue += netuidValue;
      console.log(`    → Subnet Total: ${netuidAlpha.toFixed(4)} alpha = ${netuidValue.toFixed(4)} TAO`);
    }
    console.log(`\n  → Total Alpha Value: ${totalAlphaValue.toFixed(4)} TAO\n`);
  }
  
  console.log('✓ Check complete!\n');
}

checkColdkeyDirect().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
