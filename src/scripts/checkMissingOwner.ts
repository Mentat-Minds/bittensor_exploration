// Check a missing subnet owner
import { getAllStakeBalances } from '../services/taostats';
import type { StakeBalance } from '../types';

async function check() {
  const coldkey = '5HVuEdEGMYisecwjkWC7dKDPEzgs9cECdsdCQagfPRVf6FxZ';
  console.log('\n=== CHECKING MISSING SUBNET OWNER ===');
  console.log(`Coldkey: ${coldkey}`);
  console.log('Owner of: Subnet 123\n');
  
  console.log('Fetching all stakes (this takes ~1 minute)...\n');
  const allStakes = await getAllStakeBalances();
  
  const coldkeyStakes = allStakes.filter((s: StakeBalance) => s.coldkey.ss58 === coldkey);
  
  console.log(`Stakes found for this coldkey: ${coldkeyStakes.length}`);
  
  if (coldkeyStakes.length > 0) {
    let totalAlpha = 0;
    console.log('\n📊 All stakes:');
    coldkeyStakes.forEach((s: StakeBalance) => {
      const tao = Number(s.balance) / 1e9;
      if (s.netuid > 0) totalAlpha += tao;
      console.log(`  Subnet ${s.netuid}: ${tao.toFixed(6)} TAO`);
    });
    console.log(`\n✅ Total ALPHA (netuid > 0): ${totalAlpha.toFixed(6)} TAO`);
    
    if (totalAlpha < 0.1) {
      console.log(`\n🎯 FOUND IT! This subnet owner has ${totalAlpha.toFixed(6)} TAO < 0.1 TAO`);
      console.log('This is why they are not in our alpha holders data!');
    }
  } else {
    console.log('\n❌ NO STAKES FOUND AT ALL!');
    console.log('This subnet owner has ZERO stake across ALL subnets!');
    console.log('Including on their own subnet (123)');
  }
}

check().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
