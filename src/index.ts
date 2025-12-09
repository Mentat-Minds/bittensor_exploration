import { BITTENSOR_CONFIG } from './config/bittensor';

console.log('Bittensor Exploration Project');
console.log('=============================');
console.log('Configuration loaded:');
console.log(`- Mainnet endpoint: ${BITTENSOR_CONFIG.WEB_SOCKET_MAINNET}`);
console.log(`- Taostat API: ${BITTENSOR_CONFIG.TAOSTAT_API_URL}`);
console.log(`- Blocks per day: ${BITTENSOR_CONFIG.BLOCKS_PER_DAY}`);

// Your exploration code will go here
