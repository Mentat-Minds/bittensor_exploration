// Test metagraph fix
import { fetchAllMetagraphs, classifyColdkeys } from '../services/walletClassification';

async function test() {
  console.log('Testing metagraph fix...\n');
  
  // Test on first 5 subnets only
  const metagraphs = await fetchAllMetagraphs([1, 2, 3, 4, 5]);
  
  console.log('\n=== Results ===');
  console.log(`Subnets fetched: ${metagraphs.size}`);
  
  let totalNeurons = 0;
  for (const [netuid, neurons] of metagraphs.entries()) {
    console.log(`  Subnet ${netuid}: ${neurons.length} neurons`);
    totalNeurons += neurons.length;
  }
  
  console.log(`\nTotal neurons: ${totalNeurons}`);
  
  // Test classification
  const classifications = classifyColdkeys(metagraphs);
  console.log(`\nColdkeys classified: ${classifications.size}`);
  
  // Show sample
  let count = 0;
  for (const [coldkey, classification] of classifications.entries()) {
    if (count < 3) {
      console.log(`\n  ${coldkey}`);
      console.log(`    Roles: ${classification.roles.join(', ')}`);
      console.log(`    Hotkeys: ${classification.hotkeys.length}`);
      console.log(`    Subnets: ${classification.stats.subnetsActive.join(', ')}`);
      count++;
    }
  }
  
  console.log('\n✅ Test complete!');
}

test().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
