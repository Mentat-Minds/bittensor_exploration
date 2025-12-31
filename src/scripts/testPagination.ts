// Test pagination implementation
import { BITTENSOR_CONFIG } from '../config/bittensor';
import { taostatsRateLimiter } from '../utils/rateLimiter';

interface StakeBalance {
  balance: string;
  balance_as_tao: string;
  coldkey: { ss58: string };
  hotkey: { ss58: string };
  netuid: number;
}

async function testPagination() {
  const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
  const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;
  
  // Test on subnet 67 (where the user's coldkey has a stake)
  const testNetuid = 67;
  const targetColdkey = '5FjyK7GpbkAUHaFuLznsq5Yh9kzwFc6Gv1WhyvQdiyNfaQn2';
  
  console.log('\n=== Testing Pagination ===');
  console.log(`Test Subnet: ${testNetuid}`);
  console.log(`Target Coldkey: ${targetColdkey}\n`);
  
  let offset = 0;
  const limit = 200;
  let allStakes: StakeBalance[] = [];
  let pageCount = 0;
  let foundTarget = false;
  
  while (true) {
    const stakes = await taostatsRateLimiter.execute(async () => {
      const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${testNetuid}&limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const responseData = await response.json() as any;
      const data = responseData.data || responseData;
      
      return (Array.isArray(data) ? data : []) as StakeBalance[];
    }, `page ${pageCount + 1}`);
    
    if (stakes.length === 0) {
      console.log(`\nPage ${pageCount + 1}: No more stakes`);
      break;
    }
    
    pageCount++;
    
    // Check for target coldkey
    const targetInPage = stakes.find(s => s.coldkey.ss58 === targetColdkey);
    if (targetInPage) {
      foundTarget = true;
      const valueTao = Number(targetInPage.balance_as_tao) / 1e9;
      console.log(`\n🎯 FOUND TARGET on page ${pageCount}!`);
      console.log(`   Position in page: ${stakes.indexOf(targetInPage) + 1}`);
      console.log(`   Global position: ${offset + stakes.indexOf(targetInPage) + 1}`);
      console.log(`   Value: ${valueTao.toFixed(4)} TAO`);
    }
    
    // Get min/max values in this page
    const values = stakes.map(s => Number(s.balance_as_tao) / 1e9);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    console.log(`Page ${pageCount}: ${stakes.length} stakes`);
    console.log(`  Range: ${minValue.toFixed(4)} - ${maxValue.toFixed(4)} TAO`);
    console.log(`  Total so far: ${offset + stakes.length}`);
    
    allStakes.push(...stakes);
    
    // Check stop condition
    const MIN_VALUE_TAO = 0.1;
    const allBelowThreshold = stakes.every(s => {
      const valueTao = Number(s.balance_as_tao) / 1e9;
      return valueTao < MIN_VALUE_TAO;
    });
    
    if (allBelowThreshold) {
      console.log(`\n✓ Stop condition met: all stakes < ${MIN_VALUE_TAO} TAO`);
      break;
    }
    
    offset += limit;
    
    // Safety limit
    if (pageCount >= 50) {
      console.log('\n⚠️  Stopping after 50 pages for testing');
      break;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total pages fetched: ${pageCount}`);
  console.log(`Total stakes: ${allStakes.length}`);
  console.log(`Target coldkey found: ${foundTarget ? '✓ YES' : '✗ NO'}`);
  
  if (foundTarget) {
    console.log('\n✅ Pagination works correctly!');
  } else {
    console.log('\n❌ Target not found - pagination may need adjustment');
  }
}

testPagination().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
