// Quick test for subnet 123 only
import { BITTENSOR_CONFIG } from '../config/bittensor';
import { taostatsRateLimiter } from '../utils/rateLimiter';

async function quickTest() {
  const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
  const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;
  
  console.log('\n=== QUICK TEST: SUBNET 123 ===\n');
  
  const netuid = 123;
  const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${netuid}&page=1`;
  
  console.log('Fetching stakes for subnet 123...');
  
  const result = await taostatsRateLimiter.execute(async () => {
    const response = await fetch(url, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json() as any;
    const stakes = Array.isArray(responseData) ? responseData : (responseData.data || []);
    
    return stakes;
  }, `netuid ${netuid}`);
  
  console.log(`\n✅ Stakes found for subnet 123: ${result.length}`);
  
  if (result.length > 0) {
    console.log('\nTop 5 stakers:');
    result.slice(0, 5).forEach((s: any, i: number) => {
      const tao = Number(s.balance) / 1e9;
      console.log(`  ${i + 1}. ${s.coldkey.ss58.substring(0, 20)}... : ${tao.toFixed(4)} TAO`);
    });
    
    // Check for the owner
    const ownerColdkey = '5HVuEdEGMYisecwjkWC7dKDPEzgs9cECdsdCQagfPRVf6FxZ';
    const ownerStake = result.find((s: any) => s.coldkey.ss58 === ownerColdkey);
    
    if (ownerStake) {
      const tao = Number(ownerStake.balance) / 1e9;
      console.log(`\n🎯 OWNER FOUND!`);
      console.log(`   Coldkey: ${ownerColdkey}`);
      console.log(`   Stake: ${tao.toFixed(6)} TAO`);
      
      if (tao >= 0.1) {
        console.log(`\n✅ Owner has ${tao.toFixed(6)} TAO >= 0.1 TAO`);
        console.log('   Will be included in next analysis!');
      } else {
        console.log(`\n⚠️  Owner has ${tao.toFixed(6)} TAO < 0.1 TAO`);
        console.log('   Will NOT be in alpha holders (below threshold)');
      }
    } else {
      console.log(`\n❌ Owner not found in top stakers`);
    }
  } else {
    console.log('\n❌ No stakes found for subnet 123!');
  }
  
  console.log('\n✅ Test complete!\n');
}

quickTest().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
