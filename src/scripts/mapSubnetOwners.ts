// Map which coldkey owns which subnet
import { fetchAllMetagraphs } from '../services/walletClassification';

async function mapSubnetOwners() {
  console.log('\n=== MAPPING SUBNET OWNERS ===\n');
  
  // Fetch metagraphs for all subnets (1-128)
  const allSubnets = Array.from({ length: 128 }, (_, i) => i + 1);
  const metagraphs = await fetchAllMetagraphs(allSubnets);
  
  console.log('\n=== SUBNET OWNERSHIP MAP ===\n');
  
  const ownershipMap = new Map<number, { coldkey: string; hotkey: string; stake: number }>();
  const coldkeySubnets = new Map<string, number[]>();
  
  for (const [netuid, neurons] of metagraphs.entries()) {
    // Find the owner hotkey for this subnet
    const ownerNeuron = neurons.find(n => n.is_owner_hotkey);
    
    if (ownerNeuron) {
      const coldkey = ownerNeuron.coldkey.ss58;
      const hotkey = ownerNeuron.hotkey.ss58;
      const stake = Number((ownerNeuron as any).total_alpha_stake || ownerNeuron.stake || 0) / 1e9;
      
      ownershipMap.set(netuid, { coldkey, hotkey, stake });
      
      if (!coldkeySubnets.has(coldkey)) {
        coldkeySubnets.set(coldkey, []);
      }
      coldkeySubnets.get(coldkey)!.push(netuid);
    }
  }
  
  console.log(`Subnets with identified owners: ${ownershipMap.size} / 128\n`);
  console.log(`Unique owner coldkeys: ${coldkeySubnets.size}\n`);
  
  // Show subnet ownership
  console.log('=== SUBNET → OWNER MAPPING ===\n');
  for (const [netuid, owner] of Array.from(ownershipMap.entries()).sort((a, b) => a[0] - b[0])) {
    console.log(`Subnet ${netuid.toString().padStart(3, ' ')}: ${owner.coldkey}`);
  }
  
  // Show owners with multiple subnets
  console.log('\n=== OWNERS WITH MULTIPLE SUBNETS ===\n');
  const multiSubnetOwners = Array.from(coldkeySubnets.entries())
    .filter(([_, subnets]) => subnets.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  
  if (multiSubnetOwners.length > 0) {
    for (const [coldkey, subnets] of multiSubnetOwners) {
      console.log(`${coldkey}`);
      console.log(`  Owns ${subnets.length} subnets: ${subnets.sort((a, b) => a - b).join(', ')}`);
      console.log();
    }
  } else {
    console.log('No owners with multiple subnets found.');
  }
  
  // Missing subnets
  const allPossible = Array.from({ length: 128 }, (_, i) => i + 1);
  const missing = allPossible.filter(n => !ownershipMap.has(n));
  
  console.log('\n=== MISSING SUBNET OWNERS ===\n');
  console.log(`Subnets without identified owners: ${missing.length}`);
  if (missing.length > 0) {
    console.log(`Subnet IDs: ${missing.join(', ')}`);
  }
  
  console.log('\n✅ Mapping complete!\n');
}

mapSubnetOwners().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
