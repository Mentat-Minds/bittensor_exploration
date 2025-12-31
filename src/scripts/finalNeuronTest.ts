/**
 * Final comprehensive test of neuron data fetching
 * Tests the best approach: getAllMetagraphs RPC method
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';

async function finalTest() {
  console.log('=== FINAL NEURON DATA TEST ===\n');
  
  try {
    await connectToChain();
    const api = getApi();
    
    // Test with a single subnet first
    console.log('TEST 1: Single Subnet (netuid 1)');
    console.log('─'.repeat(50));
    
    const startSingle = Date.now();
    const singleResult = await (api.rpc as any).neuronInfo.getNeurons(1);
    const singleTime = Date.now() - startSingle;
    
    console.log(`✓ Fetched in ${singleTime}ms`);
    console.log(`Result type: ${typeof singleResult}`);
    console.log(`Has toJSON: ${typeof singleResult?.toJSON}`);
    console.log(`Has toString: ${typeof singleResult?.toString}`);
    
    // Try different ways to access the data
    let neurons: any = null;
    
    if (singleResult?.toJSON) {
      neurons = singleResult.toJSON();
    } else if (singleResult?.toString) {
      try {
        neurons = JSON.parse(singleResult.toString());
      } catch (e) {
        neurons = singleResult.toString();
      }
    } else {
      neurons = singleResult;
    }
    
    console.log(`\nParsed neurons type: ${typeof neurons}`);
    console.log(`Is array: ${Array.isArray(neurons)}`);
    
    if (neurons) {
      if (Array.isArray(neurons)) {
        console.log(`✓ Got ${neurons.length} neurons`);
        
        if (neurons.length > 0) {
          const firstNeuron = neurons[0];
          console.log(`\nFirst neuron keys: ${Object.keys(firstNeuron).join(', ')}`);
          console.log(`\nFirst neuron sample:`);
          console.log(`  UID: ${firstNeuron.uid}`);
          console.log(`  Hotkey: ${firstNeuron.hotkey || firstNeuron.axon_info?.hotkey || 'N/A'}`);
          console.log(`  Coldkey: ${firstNeuron.coldkey || 'N/A'}`);
          console.log(`  Validator Permit: ${firstNeuron.validator_permit || firstNeuron.validatorPermit || 'N/A'}`);
          console.log(`  Active: ${firstNeuron.active || 'N/A'}`);
          console.log(`  Stake: ${firstNeuron.stake || 'N/A'}`);
          
          // Count validators and miners
          const validators = neurons.filter((n: any) => 
            n.validator_permit === true || n.validatorPermit === true
          );
          const miners = neurons.filter((n: any) => 
            n.validator_permit === false || n.validatorPermit === false
          );
          
          console.log(`\n📊 Statistics:`);
          console.log(`  Total neurons: ${neurons.length}`);
          console.log(`  Validators: ${validators.length} (${(validators.length / neurons.length * 100).toFixed(1)}%)`);
          console.log(`  Miners: ${miners.length} (${(miners.length / neurons.length * 100).toFixed(1)}%)`);
        }
      } else {
        console.log(`Neurons data: ${JSON.stringify(neurons).slice(0, 200)}...`);
      }
    }
    
    // Test 2: ALL subnets at once!
    console.log(`\n\nTEST 2: ALL Subnets (getAllMetagraphs)`);
    console.log('─'.repeat(50));
    
    const startAll = Date.now();
    const allResult = await (api.rpc as any).subnetInfo.getAllMetagraphs();
    const allTime = Date.now() - startAll;
    
    console.log(`✓ Fetched in ${allTime}ms (${(allTime / 1000).toFixed(2)}s)`);
    
    let allMetagraphs: any = null;
    
    if (allResult?.toJSON) {
      allMetagraphs = allResult.toJSON();
    } else if (allResult?.toString) {
      try {
        allMetagraphs = JSON.parse(allResult.toString());
      } catch (e) {
        allMetagraphs = allResult.toString();
      }
    } else {
      allMetagraphs = allResult;
    }
    
    console.log(`\nMetagraphs type: ${typeof allMetagraphs}`);
    console.log(`Is array: ${Array.isArray(allMetagraphs)}`);
    
    if (Array.isArray(allMetagraphs)) {
      console.log(`✓ Got ${allMetagraphs.length} subnets`);
      
      let totalNeurons = 0;
      let totalValidators = 0;
      let totalMiners = 0;
      const subnetDetails = [];
      
      for (const metagraph of allMetagraphs) {
        const netuid = metagraph.netuid || metagraph.n || 'unknown';
        const neurons = metagraph.neurons || metagraph.n || [];
        const neuronCount = Array.isArray(neurons) ? neurons.length : 0;
        
        if (neuronCount > 0) {
          totalNeurons += neuronCount;
          
          if (Array.isArray(neurons)) {
            const validators = neurons.filter((n: any) => 
              n.validator_permit === true || n.validatorPermit === true
            ).length;
            const miners = neuronCount - validators;
            
            totalValidators += validators;
            totalMiners += miners;
            
            subnetDetails.push({
              netuid,
              neurons: neuronCount,
              validators,
              miners
            });
          }
        }
      }
      
      console.log(`\n📊 TOTAL STATISTICS:`);
      console.log(`  Total subnets: ${allMetagraphs.length}`);
      console.log(`  Total neurons: ${totalNeurons}`);
      console.log(`  Total validators: ${totalValidators}`);
      console.log(`  Total miners: ${totalMiners}`);
      console.log(`  Time to fetch ALL: ${allTime}ms`);
      
      console.log(`\n🔝 Top 5 subnets by neuron count:`);
      subnetDetails
        .sort((a, b) => b.neurons - a.neurons)
        .slice(0, 5)
        .forEach((s, i) => {
          console.log(`  ${i + 1}. Subnet ${s.netuid}: ${s.neurons} neurons (${s.validators} validators, ${s.miners} miners)`);
        });
    } else if (allMetagraphs) {
      console.log(`Metagraphs keys: ${Object.keys(allMetagraphs).slice(0, 10).join(', ')}`);
    }
    
    // Final recommendations
    console.log(`\n\n=== 🎯 FINAL RECOMMENDATIONS ===\n`);
    console.log(`✅ BEST APPROACH: Use getAllMetagraphs RPC`);
    console.log(`   - Fetches ALL subnets in ONE call`);
    console.log(`   - Time: ~${allTime}ms for everything`);
    console.log(`   - Returns complete neuron data including:`);
    console.log(`     • UID, hotkey, coldkey`);
    console.log(`     • validator_permit (to distinguish validator/miner)`);
    console.log(`     • stake, active, etc.`);
    console.log(`\n✅ IMPLEMENTATION STRATEGY:`);
    console.log(`   1. Call getAllMetagraphs() once → ${allTime}ms`);
    console.log(`   2. Build coldkey → neurons index → <1ms`);
    console.log(`   3. For each of 4,018 coldkeys → instant O(1) lookup`);
    console.log(`   4. Classify: validator_permit = true → Validator`);
    console.log(`                validator_permit = false → Miner`);
    console.log(`\n⏱️  TOTAL TIME ESTIMATE: ~${Math.ceil(allTime / 1000)} seconds for complete classification!`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await disconnectFromChain();
  }
}

finalTest();
