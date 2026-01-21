// Test optimized metrics on random coldkeys sample
import { getStakeUnstakeMetrics } from '../services/taostats';

async function testOptimizedMetrics() {
  console.log('\n=== Test: Optimized Transaction Metrics ===\n');
  
  // Random sample of coldkeys from the ecosystem
  const testColdkeys = [
    '5GH2aUTMRUh1RprCgH4x3tRyCaKeUi5BfmYCfs1NARA8R54n', // Big holder
    '5F6D1yTyQDwqR8Hjawq733WSnZVpH3X3W2aQhAWyCZq47nrf', // Medium holder
    '5FsbubeciqtB5Nik3umL2iD4fG8FcC9GbT9nHJfXMj4mJJZ9', // Small holder
    '5Ds8nuwoySJRwkXorzFv8MVWXeCzehCYVrjcsVtSGCPB8V4R', // Small holder
    '5EFZf5pnTqLegv6gxCrb6TKBQBGz9xLJNK8x9eR273cSons6', // Medium holder
  ];
  
  console.log(`Testing on ${testColdkeys.length} random coldkeys...\n`);
  
  for (const coldkey of testColdkeys) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Coldkey: ${coldkey}`);
    console.log('='.repeat(80));
    
    try {
      const start = Date.now();
      const metrics = await getStakeUnstakeMetrics(coldkey, 50);
      const duration = Date.now() - start;
      
      console.log('\n✅ Metrics fetched successfully!');
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);
      console.log('📊 Result JSON:');
      console.log(JSON.stringify(metrics, null, 2));
      
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
    }
  }
  
  console.log('\n\n✅ Test complete!\n');
}

testOptimizedMetrics().catch(console.error);
