/**
 * Discover the correct way to query neuron data from Bittensor chain
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';

async function discoverNeuronAPI() {
  console.log('=== DISCOVERING NEURON DATA ACCESS ===\n');
  
  try {
    await connectToChain();
    const api = getApi();
    
    const testNetuid = 1; // Subnet 1 usually exists
    const testUid = 0; // UID 0 usually exists
    
    console.log(`Testing with subnet ${testNetuid}, UID ${testUid}\n`);
    
    // List ALL subtensorModule methods
    const allMethods = Object.keys(api.query.subtensorModule);
    console.log(`Total subtensorModule methods: ${allMethods.length}\n`);
    
    // Filter for potentially useful methods
    const relevant = allMethods.filter(m => 
      m.toLowerCase().includes('key') ||
      m.toLowerCase().includes('stake') ||
      m.toLowerCase().includes('uid') ||
      m.toLowerCase().includes('weight') ||
      m.toLowerCase().includes('active') ||
      m.toLowerCase().includes('permit') ||
      m.toLowerCase().includes('trust') ||
      m.toLowerCase().includes('consensus') ||
      m.toLowerCase().includes('incentive') ||
      m.toLowerCase().includes('dividend') ||
      m.toLowerCase().includes('emission') ||
      m.toLowerCase().includes('axon') ||
      m.toLowerCase().includes('pruning')
    );
    
    console.log(`Relevant methods for neuron data (${relevant.length}):`);
    relevant.forEach(m => console.log(`  - ${m}`));
    
    // Test some key methods
    console.log('\n=== TESTING KEY METHODS ===\n');
    
    const tests = [
      {
        name: 'uids (netuid)',
        fn: async () => api.query.subtensorModule.uids(testNetuid)
      },
      {
        name: 'subnetworkN (netuid)',
        fn: async () => api.query.subtensorModule.subnetworkN(testNetuid)
      },
      {
        name: 'keys (netuid, uid)',
        fn: async () => api.query.subtensorModule.keys(testNetuid, testUid)
      },
      {
        name: 'stake (hotkey, coldkey)',
        fn: async () => api.query.subtensorModule.stake.entries()
      },
      {
        name: 'active (netuid, uid)',
        fn: async () => api.query.subtensorModule.active(testNetuid, testUid)
      },
      {
        name: 'validatorPermit (netuid, uid)',
        fn: async () => api.query.subtensorModule.validatorPermit(testNetuid, testUid)
      },
      {
        name: 'trust (netuid, uid)',
        fn: async () => api.query.subtensorModule.trust(testNetuid, testUid)
      },
      {
        name: 'consensus (netuid, uid)',
        fn: async () => api.query.subtensorModule.consensus(testNetuid, testUid)
      },
      {
        name: 'incentive (netuid, uid)',
        fn: async () => api.query.subtensorModule.incentive(testNetuid, testUid)
      },
      {
        name: 'dividends (netuid, uid)',
        fn: async () => api.query.subtensorModule.dividends(testNetuid, testUid)
      },
      {
        name: 'emission (netuid, uid)',
        fn: async () => api.query.subtensorModule.emission(testNetuid, testUid)
      },
      {
        name: 'axons (netuid, uid)',
        fn: async () => api.query.subtensorModule.axons(testNetuid, testUid)
      },
      {
        name: 'pruningScores (netuid, uid)',
        fn: async () => api.query.subtensorModule.pruningScores(testNetuid, testUid)
      },
      {
        name: 'lastUpdate (netuid, uid)',
        fn: async () => api.query.subtensorModule.lastUpdate(testNetuid, testUid)
      },
    ];
    
    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name}...`);
        const result = await test.fn();
        const value = result.toString();
        console.log(`  ✓ Success! Value: ${value.slice(0, 100)}${value.length > 100 ? '...' : ''}`);
        
        // If it's an entries result, show count
        if (Array.isArray(result)) {
          console.log(`    (${result.length} entries)`);
        }
      } catch (error: any) {
        console.log(`  ✗ Failed: ${error.message}`);
      }
    }
    
    // Try to get all UIDs for a subnet
    console.log('\n=== GETTING ALL UIDS FOR SUBNET ===\n');
    
    try {
      const subnetN = await api.query.subtensorModule.subnetworkN(testNetuid);
      const totalNeurons = parseInt(subnetN.toString(), 10);
      console.log(`Subnet ${testNetuid} has ${totalNeurons} neurons\n`);
      
      if (totalNeurons > 0 && totalNeurons < 300) {
        console.log('Fetching data for first 5 neurons...\n');
        
        for (let uid = 0; uid < Math.min(5, totalNeurons); uid++) {
          console.log(`UID ${uid}:`);
          
          try {
            const hotkey = await api.query.subtensorModule.keys(testNetuid, uid);
            const active = await api.query.subtensorModule.active(testNetuid, uid);
            const validatorPermit = await api.query.subtensorModule.validatorPermit(testNetuid, uid);
            const incentive = await api.query.subtensorModule.incentive(testNetuid, uid);
            const dividends = await api.query.subtensorModule.dividends(testNetuid, uid);
            
            console.log(`  Hotkey: ${hotkey.toString()}`);
            console.log(`  Active: ${active.toString()}`);
            console.log(`  Validator Permit: ${validatorPermit.toString()}`);
            console.log(`  Incentive: ${incentive.toString()}`);
            console.log(`  Dividends: ${dividends.toString()}`);
            console.log('');
          } catch (error: any) {
            console.log(`  Error: ${error.message}\n`);
          }
        }
      }
    } catch (error: any) {
      console.log(`Error getting subnet info: ${error.message}`);
    }
    
    console.log('\n=== CONCLUSION ===\n');
    console.log('✓ Bittensor API uses individual queries per field, not a single "neurons" query');
    console.log('✓ To get neuron data:');
    console.log('  1. Get total neurons: subnetworkN(netuid)');
    console.log('  2. For each UID (0 to N-1):');
    console.log('     - keys(netuid, uid) → hotkey');
    console.log('     - validatorPermit(netuid, uid) → is validator');
    console.log('     - incentive(netuid, uid) → miner score');
    console.log('     - dividends(netuid, uid) → validator score');
    console.log('     - active(netuid, uid) → is active');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await disconnectFromChain();
  }
}

discoverNeuronAPI();
