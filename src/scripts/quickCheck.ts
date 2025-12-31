// Quick API check for specific coldkey
import { BITTENSOR_CONFIG } from '../config/bittensor';

async function quickCheck() {
  const targetColdkey = '5H3inPro2MLGag8sC1iAuYZJ43Ax9sDzsPfSuFmNXjW2LEv4';
  const netuid = 49;
  
  const url = `${BITTENSOR_CONFIG.TAOSTAT_API_URL}/api/dtao/stake_balance/latest/v1?netuid=${netuid}&coldkey=${targetColdkey}`;
  
  console.log(`\nFetching data for coldkey on subnet ${netuid}...\n`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': BITTENSOR_CONFIG.TAOSTAT_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json() as any;
  const stakes = Array.isArray(data) ? data : (data.data || []);
  
  if (stakes.length === 0) {
    console.log('❌ No stakes found');
    return;
  }
  
  console.log(`Found ${stakes.length} stake(s) for this coldkey on subnet ${netuid}:\n`);
  
  stakes.forEach((stake: any, idx: number) => {
    console.log(`--- Stake ${idx + 1} ---`);
    console.log(`Hotkey: ${stake.hotkey?.ss58 || 'N/A'}`);
    console.log(`\nRAW VALUES from API:`);
    console.log(`  balance: "${stake.balance}"`);
    console.log(`  balance_as_tao: "${stake.balance_as_tao}"`);
    
    // Try both interpretations
    console.log(`\nINTERPRETATION 1 (balance_as_tao en RAO):`);
    const asRao = Number(stake.balance_as_tao) / 1e9;
    console.log(`  ${stake.balance_as_tao} / 1e9 = ${asRao.toFixed(2)} TAO`);
    
    console.log(`\nINTERPRETATION 2 (balance_as_tao déjà en TAO):`);
    const asTao = Number(stake.balance_as_tao);
    console.log(`  ${stake.balance_as_tao} = ${asTao.toFixed(2)} TAO`);
    
    console.log(`\n✅ Devrait être ~59 TAO d'après Taostats\n`);
  });
}

quickCheck().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
