// Test the API directly to understand pagination
import { BITTENSOR_CONFIG } from '../config/bittensor';

async function testApi() {
  const API_URL = BITTENSOR_CONFIG.TAOSTAT_API_URL;
  const API_KEY = BITTENSOR_CONFIG.TAOSTAT_API_KEY;
  
  console.log('\n=== Testing Taostats API Directly ===\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Testing on netuid 64 (11k+ coldkeys selon toi)\n`);
  
  // Test 1: Basic call with limit=10000
  console.log('--- Test 1: limit=10000 ---');
  const url1 = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=64&limit=10000`;
  console.log(`URL: ${url1}\n`);
  
  try {
    const response1 = await fetch(url1, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Status: ${response1.status} ${response1.statusText}`);
    
    if (response1.ok) {
      const data1 = await response1.json() as any;
      const stakes1 = Array.isArray(data1) ? data1 : (data1.data || []);
      
      console.log(`Records returned: ${stakes1.length}`);
      
      if (stakes1.length > 0) {
        // Check if response has pagination metadata
        if (!Array.isArray(data1) && data1.pagination) {
          console.log('Pagination metadata found:');
          console.log(JSON.stringify(data1.pagination, null, 2));
        }
        
        // Show first record to see structure
        console.log('\nFirst record structure:');
        console.log(JSON.stringify(stakes1[0], null, 2));
        
        // Show unique coldkeys
        const uniqueColdkeys = new Set(stakes1.map((s: any) => s.coldkey.ss58));
        console.log(`\nUnique coldkeys in response: ${uniqueColdkeys.size}`);
        
        // Check if subnet_total_holders field exists
        if (stakes1[0].subnet_total_holders) {
          console.log(`Subnet total holders (from API): ${stakes1[0].subnet_total_holders}`);
        }
      }
    } else {
      const errorText = await response1.text();
      console.log(`Error response: ${errorText}`);
    }
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('\n--- Test 2: Testing with page/offset parameters ---\n');
  
  // Test different pagination parameter names
  const paginationTests = [
    { params: 'limit=200&offset=200', desc: 'offset=200' },
    { params: 'limit=200&page=2', desc: 'page=2' },
    { params: 'limit=200&skip=200', desc: 'skip=200' },
  ];
  
  for (const test of paginationTests) {
    const url = `${API_URL}/api/dtao/stake_balance/latest/v1?netuid=64&${test.params}`;
    console.log(`Testing ${test.desc}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        const stakes = Array.isArray(data) ? data : (data.data || []);
        
        if (stakes.length > 0) {
          const values = stakes.map((s: any) => Number(s.balance_as_tao) / 1e9);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          console.log(`  ✓ ${stakes.length} records, range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)} TAO\n`);
        } else {
          console.log(`  ✗ No records\n`);
        }
      } else {
        console.log(`  ✗ Error ${response.status}\n`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.log(`  ✗ ${error.message}\n`);
    }
  }
  
  console.log('--- Test 3: Check if there\'s a "get all coldkeys" endpoint ---\n');
  
  // Try different endpoint variations
  const endpoints = [
    '/api/dtao/coldkeys/v1?netuid=64',
    '/api/dtao/holders/v1?netuid=64',
    '/api/coldkeys?netuid=64',
    '/api/dtao/stake_balance/coldkeys/v1?netuid=64',
  ];
  
  for (const endpoint of endpoints) {
    const url = `${API_URL}${endpoint}`;
    console.log(`Trying: ${endpoint}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json() as any;
        console.log(`  ✓ Success! Response type: ${Array.isArray(data) ? 'array' : 'object'}`);
        
        if (Array.isArray(data)) {
          console.log(`  Records: ${data.length}`);
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`  Records: ${data.data.length}`);
        }
        
        console.log();
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.log(`  ✗ ${error.message}\n`);
    }
  }
}

testApi().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
