import { connectToChain, getStakingProxies, disconnectFromChain } from './src/services/bittensor';

async function testProxyCheck() {
  const testAddress = '5GH2aUTMRUh1RprCgH4x3tRyCaKeUi5BfmYCfs1NARA8R54n';
  
  console.log(`\nTesting staking proxy detection for: ${testAddress}\n`);
  
  try {
    // Connect to chain
    await connectToChain();
    
    // Check for staking proxy
    const proxies = await getStakingProxies([testAddress]);
    
    console.log('\n=== RESULTS ===');
    console.log(`Address: ${testAddress}`);
    console.log(`Has Staking Proxy: ${proxies.get(testAddress)}`);
    console.log('===============\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await disconnectFromChain();
  }
}

testProxyCheck();
