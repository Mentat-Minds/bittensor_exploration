// Quick test script to verify staking proxy detection
import { connectToChain, getStakingProxies, disconnectFromChain } from '../services/bittensor';

async function testProxy() {
  console.log('\n=== Testing Staking Proxy Detection ===\n');
  
  // Test with a few coldkeys
  const testColdkeys = [
    '5H3inPro2MLGag8sC1iAuYZJ43Ax9sDzsPfSuFmNXjW2LEv4', // Top alpha holder
    '5FYyEvXWKRuLgsRjXqS2q9TdJWshqSHiaM7eaedd8ntnq66H', // 2nd alpha holder
    '5Fnea2h65o8z1SgXRYqUN66P81sGMuW5hgEG6syNHEwMqUq4', // Random one from earlier test
  ];
  
  console.log(`Testing ${testColdkeys.length} coldkeys...\n`);
  
  await connectToChain();
  const proxies = await getStakingProxies(testColdkeys);
  await disconnectFromChain();
  
  console.log('\n=== Results ===\n');
  
  for (const coldkey of testColdkeys) {
    const hasProxy = proxies.get(coldkey);
    console.log(`${coldkey.substring(0, 10)}...`);
    console.log(`  Staking Proxy: ${hasProxy ? '✓ Yes' : '✗ No'}\n`);
  }
  
  console.log('✓ Test complete!\n');
}

testProxy().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
