// Debug script to understand balance_as_tao field
import { getAllStakeBalances } from '../services/taostats';

async function debugColdkey() {
  const targetColdkey = '5H3inPro2MLGag8sC1iAuYZJ43Ax9sDzsPfSuFmNXjW2LEv4';
  
  console.log(`\n=== Debugging Coldkey: ${targetColdkey} ===\n`);
  
  // Fetch all stakes
  console.log('Fetching all stake data...\n');
  const allStakes = await getAllStakeBalances();
  
  // Filter for our target coldkey
  const coldkeyStakes = allStakes.filter(s => s.coldkey.ss58 === targetColdkey);
  
  console.log(`Found ${coldkeyStakes.length} stakes for this coldkey:\n`);
  
  let totalAlphaCalculated = 0;
  let totalTaoCalculated = 0;
  
  coldkeyStakes.forEach((stake, idx) => {
    console.log(`\n--- Stake ${idx + 1} ---`);
    console.log(`Netuid: ${stake.netuid}`);
    console.log(`Hotkey: ${stake.hotkey.ss58}`);
    console.log(`\nRAW VALUES from API:`);
    console.log(`  balance (raw): ${stake.balance}`);
    console.log(`  balance_as_tao (raw): ${stake.balance_as_tao}`);
    
    const balanceAlpha = Number(stake.balance) / 1e9;
    const valueTao = Number(stake.balance_as_tao) / 1e9;
    
    console.log(`\nCONVERTED VALUES (/ 1e9):`);
    console.log(`  balance_alpha: ${balanceAlpha.toFixed(9)}`);
    console.log(`  value_tao: ${valueTao.toFixed(9)}`);
    
    if (stake.netuid > 0) {
      totalAlphaCalculated += balanceAlpha;
      totalTaoCalculated += valueTao;
    }
  });
  
  console.log(`\n\n=== TOTALS ===`);
  console.log(`Total alpha tokens: ${totalAlphaCalculated.toFixed(9)}`);
  console.log(`Total value in TAO (our calculation): ${totalTaoCalculated.toFixed(2)}`);
  console.log(`\nExpected value (from user): 1,192 TAO`);
  console.log(`Our calculation: ${totalTaoCalculated.toFixed(2)} TAO`);
  console.log(`Difference: ${Math.abs(totalTaoCalculated - 1192).toFixed(2)} TAO`);
  console.log(`\n❓ The field 'balance_as_tao' might not represent what we think it does!`);
}

async function main() {
  try {
    await debugColdkey();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
