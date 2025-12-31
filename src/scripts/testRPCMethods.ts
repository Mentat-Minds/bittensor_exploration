/**
 * Test Bittensor custom RPC methods for neuron data
 * These are specialized methods that should give us all neuron data efficiently
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';

async function testRPCMethods() {
  console.log('=== TESTING BITTENSOR CUSTOM RPC METHODS ===\n');
  
  try {
    await connectToChain();
    const api = getApi();
    
    const testNetuid = 1;
    const testUid = 0;
    const testHotkey = '5C5vatoPEY6Gskf5qVTgLBCetZdezmEWhnDeYKxJPv4F8qhW'; // From previous test
    
    console.log(`Testing with subnet ${testNetuid}\n`);
    
    // Test 1: Get single neuron
    console.log('1. Testing neuronInfo_getNeuron...');
    try {
      const result = await (api.rpc as any).neuronInfo?.getNeuron(testNetuid, testHotkey);
      console.log('   ✓ Success!');
      console.log('   Result:', JSON.stringify(result?.toJSON(), null, 2).slice(0, 500));
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    // Test 2: Get single neuron (lite version)
    console.log('\n2. Testing neuronInfo_getNeuronLite...');
    try {
      const result = await (api.rpc as any).neuronInfo?.getNeuronLite(testNetuid, testUid);
      console.log('   ✓ Success!');
      console.log('   Result:', JSON.stringify(result?.toJSON(), null, 2).slice(0, 500));
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    // Test 3: Get ALL neurons (this is what we want!)
    console.log('\n3. Testing neuronInfo_getNeurons...');
    try {
      const startTime = Date.now();
      const result = await (api.rpc as any).neuronInfo?.getNeurons(testNetuid);
      const elapsed = Date.now() - startTime;
      
      console.log(`   ✓ Success! Fetched in ${elapsed}ms`);
      
      if (result) {
        const neurons = result.toJSON();
        console.log(`   Total neurons: ${neurons ? (Array.isArray(neurons) ? neurons.length : 'N/A') : 'N/A'}`);
        
        if (Array.isArray(neurons) && neurons.length > 0) {
          console.log('\n   First neuron:');
          console.log(JSON.stringify(neurons[0], null, 2));
          
          // Count validators vs miners
          const validators = neurons.filter((n: any) => n.validator_permit || n.validatorPermit);
          const miners = neurons.filter((n: any) => !(n.validator_permit || n.validatorPermit));
          
          console.log(`\n   Statistics:`);
          console.log(`   - Total neurons: ${neurons.length}`);
          console.log(`   - Validators: ${validators.length}`);
          console.log(`   - Miners: ${miners.length}`);
        }
      }
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    // Test 4: Get ALL neurons (lite version - faster!)
    console.log('\n4. Testing neuronInfo_getNeuronsLite...');
    try {
      const startTime = Date.now();
      const result = await (api.rpc as any).neuronInfo?.getNeuronsLite(testNetuid);
      const elapsed = Date.now() - startTime;
      
      console.log(`   ✓ Success! Fetched in ${elapsed}ms`);
      
      if (result) {
        const neurons = result.toJSON();
        console.log(`   Total neurons: ${neurons ? (Array.isArray(neurons) ? neurons.length : 'N/A') : 'N/A'}`);
      }
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    // Test 5: Get metagraph (complete subnet data!)
    console.log('\n5. Testing subnetInfo_getMetagraph...');
    try {
      const startTime = Date.now();
      const result = await (api.rpc as any).subnetInfo?.getMetagraph(testNetuid);
      const elapsed = Date.now() - startTime;
      
      console.log(`   ✓ Success! Fetched in ${elapsed}ms`);
      
      if (result) {
        const metagraph = result.toJSON();
        console.log('   Metagraph keys:', Object.keys(metagraph || {}));
      }
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    // Test 6: Get all metagraphs (ALL subnets at once!)
    console.log('\n6. Testing subnetInfo_getAllMetagraphs...');
    try {
      const startTime = Date.now();
      const result = await (api.rpc as any).subnetInfo?.getAllMetagraphs();
      const elapsed = Date.now() - startTime;
      
      console.log(`   ✓ Success! Fetched in ${elapsed}ms`);
      
      if (result) {
        const metagraphs = result.toJSON();
        if (Array.isArray(metagraphs)) {
          console.log(`   Total subnets: ${metagraphs.length}`);
          console.log(`   Estimated time for ALL neurons: ${elapsed}ms`);
        }
      }
    } catch (error: any) {
      console.log('   ✗ Failed:', error.message);
    }
    
    console.log('\n=== PERFORMANCE ESTIMATES ===\n');
    console.log('If getNeurons works:');
    console.log('  - Fetch all 101 subnets sequentially: ~5-10 seconds');
    console.log('  - Or use getAllMetagraphs: ~1 second for ALL data!');
    console.log('\nThis is MUCH faster than querying individual fields!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await disconnectFromChain();
  }
}

testRPCMethods();
