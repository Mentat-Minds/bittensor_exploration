// Export all miners and validators for subnet 118
import { writeFileSync } from 'fs';
import { taostatsRateLimiter } from '../utils/rateLimiter';

const TAOSTATS_METAGRAPH_BASE = 'https://taostats.io/api/metagraph/metagraph';

async function exportSubnet118() {
  console.log('\n=== EXPORTING SUBNET 118 DATA ===\n');
  
  const netuid = 118;
  const url = `${TAOSTATS_METAGRAPH_BASE}?netuid=${netuid}&order=stake_desc`;
  
  console.log('Fetching metagraph...');
  
  const neurons = await taostatsRateLimiter.execute(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json() as any;
    const neurons = Array.isArray(responseData) ? responseData : (responseData.data || []);
    return neurons;
  }, `metagraph netuid ${netuid}`);
  
  console.log(`Total neurons: ${neurons.length}\n`);
  
  // Classify
  const validators = neurons.filter((n: any) => !n.is_owner_hotkey && n.validator_permit === true);
  const miners = neurons.filter((n: any) => !n.is_owner_hotkey && n.validator_permit === false);
  
  // Get unique coldkeys
  const validatorColdkeys = Array.from(new Set(validators.map((n: any) => n.coldkey.ss58))) as string[];
  const minerColdkeys = Array.from(new Set(miners.map((n: any) => n.coldkey.ss58))) as string[];
  
  console.log(`Validators: ${validators.length} hotkeys, ${validatorColdkeys.length} unique coldkeys`);
  console.log(`Miners: ${miners.length} hotkeys, ${minerColdkeys.length} unique coldkeys`);
  
  // Save to files
  const validatorsFile = 'output/subnet118_validators.txt';
  const minersFile = 'output/subnet118_miners.txt';
  
  writeFileSync(validatorsFile, validatorColdkeys.join('\n'));
  writeFileSync(minersFile, minerColdkeys.join('\n'));
  
  console.log(`\n✅ Files saved:`);
  console.log(`   ${validatorsFile}`);
  console.log(`   ${minersFile}`);
  
  // Display lists
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATORS COLDKEYS (ALL)');
  console.log('='.repeat(60));
  validatorColdkeys.forEach((ck, i) => {
    console.log(`${(i + 1).toString().padStart(3, ' ')}. ${ck}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('MINERS COLDKEYS (ALL)');
  console.log('='.repeat(60));
  minerColdkeys.forEach((ck, i) => {
    console.log(`${(i + 1).toString().padStart(3, ' ')}. ${ck}`);
  });
  
  console.log('\n✅ Export complete!\n');
}

exportSubnet118().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
