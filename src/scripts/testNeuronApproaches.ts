/**
 * Test script to compare different approaches for neuron classification
 * Tests performance and feasibility of:
 * 1. Per-coldkey approach: Query neurons for each coldkey
 * 2. Global approach: Fetch all neurons once, then map to coldkeys
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';

// Test configuration
const TEST_COLDKEYS = [
  '5GH2aUTMRUh1RprCgH4x3tRyCaKeUi5BfmYCfs1NARA8R54n', // Known big holder
  '5FsbubeciqtB5Nik3umL2iD4fG8FcC9GbT9nHJfXMj4mJJZ9', // Test wallet
];

const TEST_NETUIDS = [0, 1, 3, 4]; // Test with a few subnets first

interface NeuronInfo {
  uid: number;
  hotkey: string;
  coldkey: string;
  stake: string;
  validator_permit: boolean;
  dividends: string;
  incentive: string;
  netuid: number;
}

/**
 * APPROACH 1: Per-Coldkey
 * For each coldkey, find all associated hotkeys and check their status
 */
async function testApproach1_PerColdkey() {
  console.log('\n=== APPROACH 1: Per-Coldkey ===\n');
  
  const api = getApi();
  const startTime = Date.now();
  
  // Step 1: Find hotkeys for each coldkey
  console.log('Finding hotkeys for each coldkey...');
  
  for (const coldkey of TEST_COLDKEYS) {
    console.log(`\nColdkey: ${coldkey.slice(0, 10)}...`);
    const coldkeyHotkeys = new Set<string>();
    
    // Check each subnet to find neurons owned by this coldkey
    for (const netuid of TEST_NETUIDS) {
      const netuidsTime = Date.now();
      
      try {
        // Query all neurons in this subnet
        const neurons = await api.query.subtensorModule.neurons.entries(netuid);
        
        console.log(`  Subnet ${netuid}: ${neurons.length} neurons (${Date.now() - netuidsTime}ms)`);
        
        // Filter neurons that belong to this coldkey
        neurons.forEach(([key, neuronData]: any) => {
          const neuron = neuronData.toJSON() as any;
          
          if (neuron.coldkey === coldkey) {
            coldkeyHotkeys.add(neuron.hotkey);
            console.log(`    Found hotkey: ${neuron.hotkey.slice(0, 10)}... (UID ${neuron.uid})`);
          }
        });
      } catch (error: any) {
        console.warn(`  Error querying subnet ${netuid}:`, error.message);
      }
    }
    
    console.log(`  Total hotkeys found: ${coldkeyHotkeys.size}`);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✓ Approach 1 completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`  Estimated for 4,018 coldkeys: ${(totalTime / TEST_COLDKEYS.length * 4018 / 1000 / 60).toFixed(2)} minutes`);
  
  return totalTime;
}

/**
 * APPROACH 2: Global
 * Fetch all neurons from all subnets once, then map to coldkeys
 */
async function testApproach2_Global() {
  console.log('\n=== APPROACH 2: Global (Fetch All) ===\n');
  
  const api = getApi();
  const startTime = Date.now();
  
  // Step 1: Fetch ALL neurons from ALL test subnets
  console.log('Fetching all neurons from all subnets...');
  
  const allNeurons: NeuronInfo[] = [];
  
  for (const netuid of TEST_NETUIDS) {
    const subnetStartTime = Date.now();
    
    try {
      const neurons = await api.query.subtensorModule.neurons.entries(netuid);
      
      neurons.forEach(([key, neuronData]: any) => {
        const neuron = neuronData.toJSON() as any;
        
        allNeurons.push({
          uid: neuron.uid,
          hotkey: neuron.hotkey,
          coldkey: neuron.coldkey,
          stake: neuron.stake,
          validator_permit: neuron.validator_permit || false,
          dividends: neuron.dividends || '0',
          incentive: neuron.incentive || '0',
          netuid: netuid,
        });
      });
      
      console.log(`  Subnet ${netuid}: ${neurons.length} neurons (${Date.now() - subnetStartTime}ms)`);
    } catch (error: any) {
      console.warn(`  Error querying subnet ${netuid}:`, error.message);
    }
  }
  
  console.log(`\n✓ Total neurons fetched: ${allNeurons.length}`);
  
  // Step 2: Build coldkey → neurons index
  console.log('\nBuilding coldkey index...');
  const indexStartTime = Date.now();
  
  const coldkeyIndex = new Map<string, NeuronInfo[]>();
  
  allNeurons.forEach(neuron => {
    if (!coldkeyIndex.has(neuron.coldkey)) {
      coldkeyIndex.set(neuron.coldkey, []);
    }
    coldkeyIndex.get(neuron.coldkey)!.push(neuron);
  });
  
  console.log(`✓ Index built in ${Date.now() - indexStartTime}ms`);
  console.log(`  Unique coldkeys: ${coldkeyIndex.size}`);
  
  // Step 3: Lookup test coldkeys
  console.log('\nLooking up test coldkeys...');
  
  for (const coldkey of TEST_COLDKEYS) {
    const neurons = coldkeyIndex.get(coldkey) || [];
    console.log(`\nColdkey: ${coldkey.slice(0, 10)}...`);
    console.log(`  Neurons found: ${neurons.length}`);
    
    neurons.forEach(neuron => {
      const role = neuron.validator_permit ? 'Validator' : 'Miner';
      console.log(`    Subnet ${neuron.netuid}, UID ${neuron.uid}: ${role}`);
    });
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✓ Approach 2 completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`  This approach fetches all neurons once, then O(1) lookup per coldkey`);
  console.log(`  Estimated for all 101 subnets: ${(totalTime / TEST_NETUIDS.length * 101 / 1000 / 60).toFixed(2)} minutes`);
  
  return totalTime;
}

/**
 * Test getting subnet owner info
 */
async function testSubnetOwners() {
  console.log('\n=== SUBNET OWNERS ===\n');
  
  const api = getApi();
  const startTime = Date.now();
  
  const subnetOwners = new Map<number, string>();
  
  for (const netuid of TEST_NETUIDS) {
    try {
      const ownerData = await api.query.subtensorModule.subnetOwner(netuid);
      const owner = ownerData.toString();
      
      if (owner && owner !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        subnetOwners.set(netuid, owner);
        console.log(`Subnet ${netuid} owner: ${owner.slice(0, 10)}...`);
      }
    } catch (error: any) {
      console.warn(`  Error querying owner for subnet ${netuid}:`, error.message);
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✓ Subnet owners fetched in ${totalTime}ms`);
  console.log(`  Estimated for all 101 subnets: ${(totalTime / TEST_NETUIDS.length * 101 / 1000).toFixed(2)} seconds`);
  
  return totalTime;
}

/**
 * Test getting hotkeys owned by a coldkey (via stake info)
 */
async function testColdkeyHotkeys() {
  console.log('\n=== COLDKEY → HOTKEYS MAPPING ===\n');
  
  const api = getApi();
  const startTime = Date.now();
  
  for (const coldkey of TEST_COLDKEYS) {
    console.log(`\nColdkey: ${coldkey.slice(0, 10)}...`);
    
    try {
      // Get all stakes for this coldkey
      const stakes = await api.query.subtensorModule.stake.entries(coldkey);
      
      console.log(`  Found ${stakes.length} stake entries`);
      
      stakes.forEach(([key, stakeData]: any) => {
        const stake = stakeData.toString();
        const keyStr = key.toString();
        
        // Extract hotkey from key (format: [coldkey, hotkey])
        // This is a simplified extraction, actual parsing may vary
        console.log(`    Stake entry: ${stake} (key: ${keyStr})`);
      });
    } catch (error: any) {
      console.warn(`  Error:`, error.message);
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✓ Completed in ${totalTime}ms`);
  
  return totalTime;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=== NEURON CLASSIFICATION APPROACH TESTS ===');
  console.log(`Testing with ${TEST_COLDKEYS.length} coldkeys and ${TEST_NETUIDS.length} subnets\n`);
  
  try {
    await connectToChain();
    
    // Test both approaches
    const time1 = await testApproach1_PerColdkey();
    const time2 = await testApproach2_Global();
    
    // Test subnet owners
    await testSubnetOwners();
    
    // Test coldkey → hotkeys
    await testColdkeyHotkeys();
    
    // Summary
    console.log('\n=== PERFORMANCE SUMMARY ===\n');
    console.log(`Approach 1 (Per-Coldkey): ${(time1 / 1000).toFixed(2)}s`);
    console.log(`  - Queries subnets for each coldkey`);
    console.log(`  - For 4,018 coldkeys × 101 subnets: ~${(time1 / TEST_COLDKEYS.length * 4018 / 1000 / 60).toFixed(0)} minutes`);
    console.log(`\nApproach 2 (Global): ${(time2 / 1000).toFixed(2)}s`);
    console.log(`  - Fetches all neurons once`);
    console.log(`  - For all 101 subnets: ~${(time2 / TEST_NETUIDS.length * 101 / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  - Then O(1) lookup for any coldkey`);
    
    console.log('\n=== RECOMMENDATION ===\n');
    if (time2 < time1) {
      console.log('✅ Approach 2 (Global) is FASTER');
      console.log('   - Fetch all neurons once (~10-20 minutes)');
      console.log('   - Build index once');
      console.log('   - Instant lookup for all 4,018 coldkeys');
    } else {
      console.log('✅ Approach 1 (Per-Coldkey) is FASTER for small sets');
      console.log('   - But scales poorly with more coldkeys');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await disconnectFromChain();
  }
}

runTests();
