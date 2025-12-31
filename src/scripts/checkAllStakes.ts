// Check ALL stakes for the target coldkey
import { getAllStakeBalances } from '../services/taostats';

async function checkAllStakes() {
  const targetColdkey = '5H3inPro2MLGag8sC1iAuYZJ43Ax9sDzsPfSuFmNXjW2LEv4';
  
  console.log(`\n=== Fetching ALL stakes for coldkey ===`);
  console.log(`${targetColdkey}\n`);
  
  const allStakes = await getAllStakeBalances();
  const coldkeyStakes = allStakes.filter(s => s.coldkey.ss58 === targetColdkey);
  
  console.log(`\nFound ${coldkeyStakes.length} total stake entries for this coldkey\n`);
  
  // Group by netuid
  const byNetuid = new Map<number, any[]>();
  
  coldkeyStakes.forEach(stake => {
    if (!byNetuid.has(stake.netuid)) {
      byNetuid.set(stake.netuid, []);
    }
    byNetuid.get(stake.netuid)!.push(stake);
  });
  
  console.log(`Breakdown by subnet:\n`);
  
  for (const [netuid, stakes] of byNetuid.entries()) {
    console.log(`\n--- Subnet ${netuid} ---`);
    console.log(`Number of stake entries: ${stakes.length}`);
    
    let totalBalance = 0;
    let totalValueTao = 0;
    
    stakes.forEach((stake, idx) => {
      const balanceAlpha = Number(stake.balance) / 1e9;
      const valueTao = Number(stake.balance_as_tao) / 1e9;
      
      console.log(`  Entry ${idx + 1}:`);
      console.log(`    Hotkey: ${stake.hotkey.ss58}`);
      console.log(`    Balance: ${balanceAlpha.toFixed(2)} alpha`);
      console.log(`    Value: ${valueTao.toFixed(2)} TAO`);
      
      totalBalance += balanceAlpha;
      totalValueTao += valueTao;
    });
    
    console.log(`  → TOTAL for subnet ${netuid}: ${totalBalance.toFixed(2)} alpha = ${totalValueTao.toFixed(2)} TAO`);
  }
  
  console.log(`\n\n=== EXPECTED (from Taostats frontend) ===`);
  console.log(`Subnet 49: ~10,557 alpha = ~59 TAO`);
  console.log(`Subnet 75: ~23,269 alpha = ~372 TAO`);
  console.log(`Total wallet: ~1,192 TAO`);
}

checkAllStakes().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
