// Test if API accepts larger limits
import { BITTENSOR_CONFIG } from '../config/bittensor';

async function testLargeLimit() {
  const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
  const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;
  
  const testNetuid = 67;
  const targetColdkey = '5FjyK7GpbkAUHaFuLznsq5Yh9kzwFc6Gv1WhyvQdiyNfaQn2';
  
  console.log('\n=== Testing Large Limit ===\n');
  
  // Test different limit values
  const limitsToTest = [200, 500, 1000, 5000, 10000];
  
  for (const limit of limitsToTest) {
    const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=${testNetuid}&limit=${limit}`;
    
    console.log(`Testing limit=${limit}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.log(`  ✗ Error: ${response.status} ${response.statusText}\n`);
        continue;
      }
      
      const data = await response.json() as any;
      const stakes = Array.isArray(data) ? data : (data.data || []);
      
      console.log(`  ✓ Got ${stakes.length} stakes`);
      
      if (stakes.length > 0) {
        const values = stakes.map((s: any) => Number(s.balance_as_tao) / 1e9);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        console.log(`    Range: ${minValue.toFixed(4)} - ${maxValue.toFixed(4)} TAO`);
        
        // Check for target
        const found = stakes.some((s: any) => s.coldkey.ss58 === targetColdkey);
        console.log(`    Target found: ${found ? '✓ YES' : '✗ NO'}`);
      }
      console.log();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }
}

testLargeLimit().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
