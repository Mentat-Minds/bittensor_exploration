// Test miner detection for subnet 118
import { taostatsRateLimiter } from '../utils/rateLimiter';

const TAOSTATS_METAGRAPH_BASE = 'https://taostats.io/api/metagraph/metagraph';

async function testMiners118() {
  console.log('\n=== TESTING MINERS FOR SUBNET 118 ===\n');
  
  const netuid = 118;
  const url = `${TAOSTATS_METAGRAPH_BASE}?netuid=${netuid}&order=stake_desc`;
  
  console.log(`Fetching metagraph for subnet ${netuid}...\n`);
  
  const neurons = await taostatsRateLimiter.execute(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json() as any;
    const neurons = Array.isArray(responseData) ? responseData : (responseData.data || []);
    return neurons;
  }, `metagraph netuid ${netuid}`);
  
  console.log(`✅ Total neurons in subnet 118: ${neurons.length}\n`);
  
  // Classify neurons
  const owners = neurons.filter((n: any) => n.is_owner_hotkey === true);
  const validators = neurons.filter((n: any) => !n.is_owner_hotkey && n.validator_permit === true);
  const miners = neurons.filter((n: any) => !n.is_owner_hotkey && n.validator_permit === false);
  
  console.log('=== CLASSIFICATION ===');
  console.log(`Subnet Owners: ${owners.length}`);
  console.log(`Validators:    ${validators.length}`);
  console.log(`Miners:        ${miners.length}`);
  console.log('');
  
  // Show subnet owner
  if (owners.length > 0) {
    console.log('🏢 SUBNET OWNER:');
    owners.forEach((n: any) => {
      console.log(`   Coldkey: ${n.coldkey.ss58}`);
      console.log(`   Hotkey:  ${n.hotkey.ss58}`);
    });
    console.log('');
  }
  
  // Show some validators
  if (validators.length > 0) {
    console.log('✅ VALIDATORS (top 5):');
    validators.slice(0, 5).forEach((n: any, i: number) => {
      console.log(`   ${i + 1}. Coldkey: ${n.coldkey.ss58}`);
    });
    console.log('');
  }
  
  // Show some miners
  if (miners.length > 0) {
    console.log('⛏️  MINERS (first 10):');
    miners.slice(0, 10).forEach((n: any, i: number) => {
      console.log(`   ${i + 1}. Coldkey: ${n.coldkey.ss58}`);
    });
    console.log('');
    
    // Get unique coldkeys for miners
    const minerColdkeys = new Set(miners.map((n: any) => n.coldkey.ss58));
    console.log(`📊 Unique miner coldkeys: ${minerColdkeys.size}`);
    console.log('');
    
    // Show first 5 unique
    console.log('First 5 unique miner coldkeys:');
    const uniqueArray = Array.from(minerColdkeys) as string[];
    uniqueArray.slice(0, 5).forEach((ck: string, i: number) => {
      console.log(`   ${i + 1}. ${ck}`);
    });
  } else {
    console.log('❌ NO MINERS FOUND! This is the bug!');
  }
  
  console.log('\n✅ Test complete!\n');
}

testMiners118().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
