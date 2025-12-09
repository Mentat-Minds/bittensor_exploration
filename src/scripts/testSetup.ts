// Test setup script to verify API key and chain connection
import { BITTENSOR_CONFIG } from '../config/bittensor';
import { getAllStakeBalances } from '../services/taostats';
import { connectToChain, getFreeBalance, disconnectFromChain } from '../services/bittensor';

async function testSetup() {
  console.log('\n=== Testing Setup ===\n');
  
  // Test 1: Check API key
  console.log('1. Checking Taostats API key...');
  if (!BITTENSOR_CONFIG.TAOSTAT_API_KEY || BITTENSOR_CONFIG.TAOSTAT_API_KEY === '') {
    console.error('   ✗ API key not found in environment variables');
    console.error('   Please add TAOSTAT_API_KEY to your .env file');
    process.exit(1);
  }
  console.log('   ✓ API key found');
  
  // Test 2: Test Taostats API connection
  console.log('\n2. Testing Taostats API connection...');
  try {
    const stakes = await getAllStakeBalances();
    console.log(`   ✓ Successfully fetched ${stakes.length} stake records`);
    
    // Show sample
    if (stakes.length > 0) {
      const sample = stakes[0];
      console.log(`   Sample record:`);
      console.log(`     - Coldkey: ${sample.coldkey.ss58}`);
      console.log(`     - Netuid: ${sample.netuid}`);
      console.log(`     - Balance: ${(Number(sample.balance) / 1e9).toFixed(4)} tokens`);
    }
  } catch (error: any) {
    console.error('   ✗ Failed to connect to Taostats API');
    console.error('   Error:', error.message);
    process.exit(1);
  }
  
  // Test 3: Test Bittensor chain connection
  console.log('\n3. Testing Bittensor chain connection...');
  console.log(`   Endpoint: ${BITTENSOR_CONFIG.WEB_SOCKET_ARCHIVE_MENTATMINDS_FALLBACK}`);
  try {
    await connectToChain();
    console.log('   ✓ Successfully connected to chain');
    
    // Test a query with a known coldkey (Opentensor Foundation)
    const testColdkey = '5Gdd5wKCs3xJGKT1wstr8Nu4SYuTa8TYqRYqxk8VhZ4k2dTq';
    console.log(`\n4. Testing chain query with sample coldkey...`);
    const balance = await getFreeBalance(testColdkey);
    console.log(`   ✓ Free balance: ${balance.toFixed(4)} TAO`);
    
    await disconnectFromChain();
  } catch (error: any) {
    console.error('   ✗ Failed to connect to chain');
    console.error('   Error:', error.message);
    process.exit(1);
  }
  
  console.log('\n✓ All tests passed! Setup is complete.\n');
  console.log('You can now run the analysis with: npm run analyze:alpha\n');
}

testSetup().catch(error => {
  console.error('\n✗ Setup test failed:', error);
  process.exit(1);
});
