/**
 * Compare hotkeys with stake vs registered neurons on chain
 * Test hypothesis: Can a miner be active without stake?
 */

import { connectToChain, getApi, disconnectFromChain } from '../services/chain';
import { getAllStakeBalances } from '../services/taostats';

async function compareStakeVsRegistered() {
  console.log('=== COMPARING STAKE DATA VS CHAIN REGISTRATION ===\n');
  console.log('Hypothesis: Some active neurons might have 0 stake\n');
  
  try {
    // Step 1: Get hotkeys from stake data
    console.log('Step 1: Getting hotkeys from stake data...');
    const stakes = await getAllStakeBalances();
    
    const hotkeysWithStake = new Set<string>();
    for (const stake of stakes) {
      hotkeysWithStake.add(stake.hotkey.ss58);
    }
    
    console.log(`✓ Found ${hotkeysWithStake.size} unique hotkeys with stake\n`);
    
    // Step 2: Get registered neurons from chain for a sample subnet
    console.log('Step 2: Getting registered neurons from chain...');
    await connectToChain();
    const api = getApi();
    
    // Test with subnet 1 (usually active)
    const testNetuid = 1;
    console.log(`Testing with subnet ${testNetuid}\n`);
    
    const totalNeurons = parseInt(
      (await api.query.subtensorModule.subnetworkN(testNetuid)).toString(),
      10
    );
    
    console.log(`Subnet ${testNetuid} has ${totalNeurons} registered neurons\n`);
    
    // Get hotkeys for each UID
    console.log('Fetching hotkeys for all UIDs...');
    const registeredHotkeys = new Set<string>();
    const hotkeyDetails = [];
    
    for (let uid = 0; uid < Math.min(totalNeurons, 256); uid++) {
      try {
        const hotkey = (await api.query.subtensorModule.keys(testNetuid, uid)).toString();
        registeredHotkeys.add(hotkey);
        
        // Check if this hotkey has stake in our data
        const hasStake = hotkeysWithStake.has(hotkey);
        
        hotkeyDetails.push({
          uid,
          hotkey: hotkey.slice(0, 10) + '...',
          hasStake,
        });
        
        if (uid < 10 || !hasStake) {
          console.log(`  UID ${uid}: ${hotkey.slice(0, 10)}... ${hasStake ? '✓ HAS stake' : '✗ NO stake'}`);
        }
      } catch (error) {
        // Might be empty slot
      }
    }
    
    console.log(`\n✓ Found ${registeredHotkeys.size} registered hotkeys on subnet ${testNetuid}\n`);
    
    // Step 3: Compare
    console.log('=== COMPARISON ===\n');
    
    const registeredWithoutStake = Array.from(registeredHotkeys).filter(
      hk => !hotkeysWithStake.has(hk)
    );
    
    const registeredWithStake = Array.from(registeredHotkeys).filter(
      hk => hotkeysWithStake.has(hk)
    );
    
    console.log(`Total registered on subnet ${testNetuid}: ${registeredHotkeys.size}`);
    console.log(`  - With stake: ${registeredWithStake.length} (${(registeredWithStake.length / registeredHotkeys.size * 100).toFixed(1)}%)`);
    console.log(`  - WITHOUT stake: ${registeredWithoutStake.length} (${(registeredWithoutStake.length / registeredHotkeys.size * 100).toFixed(1)}%)`);
    
    if (registeredWithoutStake.length > 0) {
      console.log(`\n⚠️  CRITICAL FINDING:`);
      console.log(`    ${registeredWithoutStake.length} neurons are ACTIVE but have NO stake!`);
      console.log(`    Our current method would MISS these neurons!\n`);
      
      console.log(`Examples of registered neurons without stake:`);
      registeredWithoutStake.slice(0, 5).forEach((hk, i) => {
        console.log(`  ${i + 1}. ${hk.slice(0, 10)}...`);
      });
    } else {
      console.log(`\n✓ All registered neurons have stake`);
      console.log(`  Our stake-based method is complete!\n`);
    }
    
    // Step 4: Check multiple subnets
    console.log(`\n=== TESTING MULTIPLE SUBNETS ===\n`);
    
    const subnetsToTest = [0, 1, 3, 8, 11]; // Popular subnets
    let totalRegistered = 0;
    let totalWithoutStake = 0;
    
    for (const netuid of subnetsToTest) {
      try {
        const n = parseInt(
          (await api.query.subtensorModule.subnetworkN(netuid)).toString(),
          10
        );
        
        const registered = new Set<string>();
        for (let uid = 0; uid < Math.min(n, 256); uid++) {
          try {
            const hk = (await api.query.subtensorModule.keys(netuid, uid)).toString();
            registered.add(hk);
          } catch (e) {}
        }
        
        const withoutStake = Array.from(registered).filter(
          hk => !hotkeysWithStake.has(hk)
        ).length;
        
        totalRegistered += registered.size;
        totalWithoutStake += withoutStake;
        
        console.log(`Subnet ${netuid}: ${registered.size} neurons, ${withoutStake} without stake (${(withoutStake / registered.size * 100).toFixed(1)}%)`);
      } catch (error) {
        console.log(`Subnet ${netuid}: Error querying`);
      }
    }
    
    console.log(`\n=== OVERALL FINDINGS ===\n`);
    console.log(`Across ${subnetsToTest.length} subnets:`);
    console.log(`  Total neurons: ${totalRegistered}`);
    console.log(`  Without stake: ${totalWithoutStake} (${(totalWithoutStake / totalRegistered * 100).toFixed(1)}%)`);
    
    if (totalWithoutStake > 0) {
      console.log(`\n🚨 CONCLUSION:`);
      console.log(`   Our stake-based classification is INCOMPLETE!`);
      console.log(`   We need to also query chain registration data.`);
    } else {
      console.log(`\n✅ CONCLUSION:`);
      console.log(`   Stake-based classification appears complete.`);
      console.log(`   All active neurons have stake.`);
    }
    
    await disconnectFromChain();
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

compareStakeVsRegistered();
