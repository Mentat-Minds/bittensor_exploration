// Test the new pagination fix
import { BITTENSOR_CONFIG } from '../config/bittensor';
import { taostatsRateLimiter } from '../utils/rateLimiter';

interface StakeBalance {
  balance: string;
  balance_as_tao: string;
  coldkey: { ss58: string };
  hotkey: { ss58: string };
  netuid: number;
}

async function testNewPagination() {
  const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
  const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;
  
  const testNetuid = 64;
  const targetColdkey = '5FjyK7GpbkAUHaFuLznsq5Yh9kzwFc6Gv1WhyvQdiyNfaQn2';
  
  console.log('\n=== Testing New Pagination Fix ===');
  console.log(`Subnet: ${testNetuid}`);
  console.log(`Target: ${targetColdkey}\n`);
  
  let page = 1;
  let allStakes: StakeBalance[] = [];
  let shouldContinue = true;
  let totalPages = 0;
  let foundTarget = false;
  
  while (shouldContinue) {
    const result = await taostatsRateLimiter.execute(async () => {
      const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${testNetuid}&page=${page}`;
      
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
      const stakes = Array.isArray(responseData) ? responseData : (responseData.data || []);
      const pagination = responseData.pagination || null;
      
      return { stakes: stakes as StakeBalance[], pagination };
    }, `page ${page}`);
    
    if (result.stakes.length === 0) {
      break;
    }
    
    // Store total pages
    if (page === 1 && result.pagination) {
      totalPages = result.pagination.total_pages || 0;
      console.log(`Total pages: ${totalPages}`);
      console.log(`Total items: ${result.pagination.total_items}\n`);
    }
    
    // Check for target
    const targetInPage = result.stakes.find(s => s.coldkey.ss58 === targetColdkey);
    if (targetInPage) {
      foundTarget = true;
      const valueTao = Number(targetInPage.balance_as_tao) / 1e9;
      console.log(`🎯 FOUND on page ${page}!`);
      console.log(`   Position in page: ${result.stakes.indexOf(targetInPage) + 1}`);
      console.log(`   Value: ${valueTao.toFixed(4)} TAO\n`);
    }
    
    // Get min/max values
    const values = result.stakes.map(s => Number(s.balance_as_tao) / 1e9);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    console.log(`Page ${page}/${totalPages}: ${result.stakes.length} stakes, range: ${minValue.toFixed(4)} - ${maxValue.toFixed(4)} TAO`);
    
    allStakes.push(...result.stakes);
    
    // Check stop condition (0.1 TAO)
    const MIN_VALUE_TAO = 0.1;
    const allBelowThreshold = result.stakes.every(s => {
      const valueTao = Number(s.balance_as_tao) / 1e9;
      return valueTao < MIN_VALUE_TAO;
    });
    
    if (allBelowThreshold) {
      console.log(`\n✓ Stop condition met: all stakes < ${MIN_VALUE_TAO} TAO`);
      shouldContinue = false;
      break;
    }
    
    // Check pagination
    if (result.pagination && !result.pagination.next_page) {
      shouldContinue = false;
      break;
    }
    
    page++;
    
    // Safety limit for testing
    if (page > 100) {
      console.log('\n⚠️  Stopping after 100 pages for testing');
      break;
    }
    
    // Log progress every 10 pages
    if (page % 10 === 0) {
      console.log(`  ... (fetched ${allStakes.length} stakes so far)`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Pages fetched: ${page}`);
  console.log(`Total stakes: ${allStakes.length}`);
  console.log(`Target found: ${foundTarget ? '✅ YES' : '❌ NO'}`);
  
  if (foundTarget) {
    console.log('\n✅ Pagination works correctly!');
  }
}

testNewPagination().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
