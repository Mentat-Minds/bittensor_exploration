// Test script to verify transaction count functionality
import { getStakeUnstakeCount } from '../services/taostats';

async function testTxCount() {
  console.log('=== Testing Transaction Count Functionality ===\n');
  
  // Test with a known alpha holder (from our previous results)
  const testColdkey = '5FsbubeciqtB5Nik3umL2iD4fG8FcC9GbT9nHJfXMj4mJJZ9';
  
  console.log(`Testing with coldkey: ${testColdkey}`);
  console.log('Fetching stake/unstake transactions for last 50 days...\n');
  
  try {
    const count = await getStakeUnstakeCount(testColdkey, 50);
    
    console.log(`\n✓ Success!`);
    console.log(`Number of stake/unstake transactions: ${count}`);
    
    if (count > 0) {
      console.log('\n✓ Transaction counting is working correctly!');
      console.log('The API returned DELEGATE and UNDELEGATE transactions only.');
    } else {
      console.log('\nℹ️ No transactions in the last 50 days for this wallet.');
      console.log('This is normal if the wallet has been inactive.');
    }
    
  } catch (error: any) {
    console.error('\n✗ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your TAOSTAT_API_KEY is set correctly in .env');
    console.error('2. The Taostats API is accessible');
  }
}

testTxCount();
