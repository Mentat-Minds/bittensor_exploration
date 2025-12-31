/**
 * Simple test to find the correct API structure for querying neurons
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';

async function exploreAPI() {
  console.log('=== EXPLORING BITTENSOR API STRUCTURE ===\n');
  
  try {
    await connectToChain();
    const api = getApi();
    
    console.log('API connected. Exploring available modules...\n');
    
    // List all available query modules
    console.log('Available query modules:');
    const modules = Object.keys(api.query);
    modules.forEach(mod => {
      console.log(`  - ${mod}`);
    });
    
    // Try different possible module names
    const possibleModules = [
      'subtensorModule',
      'subtensor',
      'bittensor',
      'subnetModule',
      'parachainStaking',
    ];
    
    console.log('\nChecking for neurons query...');
    
    for (const moduleName of possibleModules) {
      if (api.query[moduleName]) {
        console.log(`\n✓ Found module: ${moduleName}`);
        const methods = Object.keys(api.query[moduleName]);
        console.log(`  Available methods (${methods.length}):`);
        methods.slice(0, 20).forEach(method => {
          console.log(`    - ${method}`);
        });
        if (methods.length > 20) {
          console.log(`    ... and ${methods.length - 20} more`);
        }
        
        // Check for neurons-related methods
        const neuronMethods = methods.filter(m => 
          m.toLowerCase().includes('neuron') || 
          m.toLowerCase().includes('subnet') ||
          m.toLowerCase().includes('uid')
        );
        
        if (neuronMethods.length > 0) {
          console.log(`\n  Neuron-related methods:`);
          neuronMethods.forEach(method => {
            console.log(`    ✓ ${method}`);
          });
        }
      }
    }
    
    // Try to get neurons for subnet 1 (usually exists)
    console.log('\n=== TESTING NEURON QUERIES ===\n');
    
    const testNetuid = 1;
    console.log(`Trying to get neurons for subnet ${testNetuid}...`);
    
    // Try different approaches
    const approaches = [
      async () => {
        console.log('\n1. Trying api.query.subtensorModule.neurons.entries(netuid)...');
        const result = await api.query.subtensorModule?.neurons?.entries(testNetuid);
        return result;
      },
      async () => {
        console.log('\n2. Trying api.query.subtensorModule.neurons(netuid, uid)...');
        const result = await api.query.subtensorModule?.neurons(testNetuid, 0);
        return result;
      },
      async () => {
        console.log('\n3. Trying api.query.subtensor.neurons.entries(netuid)...');
        const result = await api.query.subtensor?.neurons?.entries(testNetuid);
        return result;
      },
    ];
    
    for (const approach of approaches) {
      try {
        const result = await approach();
        if (result) {
          console.log(`  ✓ Success! Got result:`, typeof result, Array.isArray(result) ? `(${result.length} items)` : '');
          if (Array.isArray(result) && result.length > 0) {
            console.log(`  First item:`, result[0]);
          }
        }
      } catch (error: any) {
        console.log(`  ✗ Failed:`, error.message);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await disconnectFromChain();
  }
}

exploreAPI();
