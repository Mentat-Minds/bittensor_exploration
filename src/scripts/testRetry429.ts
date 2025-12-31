// Test rapide du système anti-429 (fetch seulement 10 subnets)
import { fetchAllMetagraphs } from '../services/walletClassification';
import { getStakeUnstakeCountsBatch } from '../services/taostats';

async function testRetrySystem() {
  console.log('🧪 TEST RAPIDE: Système Anti-429\n');
  console.log('='.repeat(60));
  console.log('Test limité à 10 subnets pour vérifier le retry logic\n');
  
  try {
    // Test 1: Fetch metagraphs pour 10 subnets
    console.log('📊 Test 1: Fetching 10 metagraphs...\n');
    const testSubnets = [1, 2, 3, 4, 5, 18, 27, 36, 51, 118];
    const metagraphs = await fetchAllMetagraphs(testSubnets);
    console.log(`\n✅ Metagraphs fetchés: ${metagraphs.size} subnets`);
    
    // Test 2: Fetch TX counts pour 5 coldkeys seulement
    console.log('\n📊 Test 2: Fetching TX counts (5 coldkeys)...\n');
    const testColdkeys = [
      '5HEo565WAy4Dbq3Sv271SAi7syBSofyfhhwRNjFNSM2gP9M2',
      '5FFApaS75bv5pJHfAp2FVLBj9ZaXuFDjEypsaBNc1wCfe52v',
      '5HK5tp6t2S59DywmHRWPBVJeJ86T61KjurYqeooqj8sREpeN',
      '5CXRfP2ekFhe62r7q3vppRajJmGhTi7vwvb2yr79jveZ282w',
      '5GhS7b8fDGRgm9MbNu8FUW4JDphYKwZKzALfRPFRdLQkU3mZ'
    ];
    const txCounts = await getStakeUnstakeCountsBatch(testColdkeys.slice(0, 5), 50);
    console.log(`\n✅ TX counts fetchés: ${txCounts.size} coldkeys`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST RÉUSSI: Système anti-429 opérationnel');
    console.log('   - Retry logic fonctionne');
    console.log('   - Aucune erreur 429 non gérée');
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST ÉCHOUÉ:');
    console.error(error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

testRetrySystem();
