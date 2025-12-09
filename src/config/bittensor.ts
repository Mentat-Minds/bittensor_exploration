// Bittensor network configuration
import * as dotenv from 'dotenv';

dotenv.config();

export const BITTENSOR_CONFIG = {
  // WebSocket endpoints
  WEB_SOCKET_MAINNET: process.env.WEB_SOCKET_MAINNET || 'wss://entrypoint-finney.opentensor.ai:443',
  WEB_SOCKET_SUBVORTEX: process.env.WEB_SOCKET_SUBVORTEX || 'wss://secure.subvortex.info:443',
  WEB_SOCKET_ARCHIVE_MENTATMINDS: process.env.WEB_SOCKET_ARCHIVE_MENTATMINDS || 'wss://archive.mentatminds.com',
  WEB_SOCKET_ARCHIVE_MENTATMINDS_FALLBACK: process.env.WEB_SOCKET_ARCHIVE_MENTATMINDS_FALLBACK || 'wss://archive-fallback.mentatminds.com',
  WEB_SOCKET_ARCHIVE_RAPIDO: process.env.WEB_SOCKET_ARCHIVE_RAPIDO || 'wss://archive.minersunion.ai',
  WEB_SOCKET_ARCHIVE: process.env.WEB_SOCKET_ARCHIVE || 'wss://archive.chain.opentensor.ai:443/',

  // Taostat API
  TAOSTAT_API_URL: process.env.TAOSTAT_API_URL || 'https://api.taostats.io',
  TAOSTAT_API_KEY: process.env.TAOSTAT_API_KEY || '',

  // Block parameters
  BLOCKS_PER_DAY: parseInt(process.env.BLOCKS_PER_DAY || '7200', 10),
};
