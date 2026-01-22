// Wallet classification service using Taostats metagraph API
import type { MetagraphNeuron, ColdkeyClassification, HotkeyInfo } from '../types';
import { taostatsRateLimiter } from '../utils/rateLimiter';

const TAOSTATS_METAGRAPH_BASE = 'https://taostats.io/api/metagraph/metagraph';

/**
 * Fetch metagraph data for a specific subnet
 */
async function fetchSubnetMetagraph(netuid: number): Promise<MetagraphNeuron[]> {
  const url = `${TAOSTATS_METAGRAPH_BASE}?netuid=${netuid}&order=stake_desc`;
  
  try {
    const neurons = await taostatsRateLimiter.execute(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return []; // Subnet doesn't exist
        throw new Error(`Failed to fetch metagraph for subnet ${netuid}: ${response.statusText}`);
      }
      
      const responseData = await response.json() as any;
      // API returns {pagination, data} format
      const neurons = Array.isArray(responseData) ? responseData : (responseData.data || []);
      return neurons as MetagraphNeuron[];
    }, `metagraph netuid ${netuid}`);
    
    return neurons;
  } catch (error) {
    console.error(`Error fetching metagraph for subnet ${netuid}:`, error);
    return [];
  }
}

/**
 * Fetch metagraph data for all active subnets
 * @param subnets Array of subnet IDs to fetch (default: 1-128)
 */
export async function fetchAllMetagraphs(subnets?: number[]): Promise<Map<number, MetagraphNeuron[]>> {
  const subnetsToFetch = subnets || Array.from({ length: 128 }, (_, i) => i + 1);
  
  console.log(`\n=== Fetching metagraphs for ${subnetsToFetch.length} subnets ===`);
  console.log(`Rate limit: 200 requests/minute (~3 requests/second)\n`);
  
  const metagraphsBySubnet = new Map<number, MetagraphNeuron[]>();
  
  let fetched = 0;
  for (const netuid of subnetsToFetch) {
    const neurons = await fetchSubnetMetagraph(netuid);
    
    if (neurons.length > 0) {
      metagraphsBySubnet.set(netuid, neurons);
      fetched++;
      
      if (fetched % 10 === 0) {
        console.log(`  ✓ Fetched ${fetched}/${subnetsToFetch.length} subnets (${neurons.length} neurons in subnet ${netuid})`);
      }
    }
  }
  
  console.log(`\n✓ Completed: ${fetched}/${subnetsToFetch.length} subnets fetched`);
  console.log(`  Total neurons found: ${Array.from(metagraphsBySubnet.values()).reduce((sum, neurons) => sum + neurons.length, 0)}\n`);
  
  return metagraphsBySubnet;
}

/**
 * Classify all coldkeys based on their hotkeys' roles
 */
export function classifyColdkeys(metagraphsBySubnet: Map<number, MetagraphNeuron[]>): Map<string, ColdkeyClassification> {
  console.log('=== Classifying coldkeys based on metagraph data ===\n');
  
  const coldkeyData = new Map<string, ColdkeyClassification>();
  
  // Process all neurons from all subnets
  for (const [netuid, neurons] of metagraphsBySubnet.entries()) {
    for (const neuron of neurons) {
      const coldkey = neuron.coldkey.ss58;
      
      // Initialize coldkey data if not exists
      if (!coldkeyData.has(coldkey)) {
        coldkeyData.set(coldkey, {
          coldkey,
          roles: [],
          hotkeys: [],
          stats: {
            totalHotkeys: 0,
            subnetsActive: [],
            validatorCount: 0,
            minerCount: 0,
            subnetOwnerCount: 0,
          },
        });
      }
      
      const data = coldkeyData.get(coldkey)!;
      
      // Determine role for this hotkey
      let role: 'VALIDATOR' | 'MINER' | 'SUBNET_OWNER';
      if (neuron.is_owner_hotkey) {
        role = 'SUBNET_OWNER';
        data.stats.subnetOwnerCount++;
      } else if (neuron.validator_permit) {
        role = 'VALIDATOR';
        data.stats.validatorCount++;
      } else {
        role = 'MINER';
        data.stats.minerCount++;
      }
      
      // Add hotkey info
      data.hotkeys.push({
        address: neuron.hotkey.ss58,
        netuid: neuron.netuid,
        role,
      });
      
      // Add subnet to active subnets if not already present
      if (!data.stats.subnetsActive.includes(netuid)) {
        data.stats.subnetsActive.push(netuid);
      }
      
      data.stats.totalHotkeys++;
    }
  }
  
  // Aggregate roles for each coldkey
  for (const [coldkey, data] of coldkeyData.entries()) {
    const roleSet = new Set<string>();
    
    // Check each role type
    if (data.stats.subnetOwnerCount > 0) {
      roleSet.add('Subnet Owner');
    }
    if (data.stats.validatorCount > 0) {
      roleSet.add('Validator');
    }
    if (data.stats.minerCount > 0) {
      roleSet.add('Miner');
    }
    
    // Convert to sorted array for consistent output
    data.roles = Array.from(roleSet).sort();
  }
  
  console.log(`✓ Classified ${coldkeyData.size} unique coldkeys\n`);
  
  // Print distribution
  const roleDistribution = new Map<string, number>();
  for (const data of coldkeyData.values()) {
    const roleKey = data.roles.join(' / ');
    roleDistribution.set(roleKey, (roleDistribution.get(roleKey) || 0) + 1);
  }
  
  console.log('Role distribution:');
  const sortedRoles = Array.from(roleDistribution.entries()).sort((a, b) => b[1] - a[1]);
  for (const [role, count] of sortedRoles) {
    console.log(`  - ${role}: ${count}`);
  }
  console.log('');
  
  return coldkeyData;
}

/**
 * Classify a single coldkey based on their hotkeys and staking activity
 * Returns array of role strings
 */
export function classifySingleColdkey(
  coldkey: string,
  coldkeyClassifications: Map<string, ColdkeyClassification>,
  hasStake: boolean
): string[] {
  const classification = coldkeyClassifications.get(coldkey);
  
  if (classification) {
    // Coldkey has neurons (hotkeys) registered
    return classification.roles;
  } else if (hasStake) {
    // Coldkey has stake but no neurons -> Investor
    return ['Investor'];
  } else {
    // No stake, no neurons -> Unknown/Inactive
    return [];
  }
}

/**
 * Get a summary of a coldkey's classification
 */
export function getColdkeySummary(coldkey: string, coldkeyClassifications: Map<string, ColdkeyClassification>): string {
  const classification = coldkeyClassifications.get(coldkey);
  
  if (!classification) {
    return 'No registered neurons';
  }
  
  const parts = [];
  parts.push(`Roles: ${classification.roles.join(' / ')}`);
  parts.push(`Hotkeys: ${classification.stats.totalHotkeys}`);
  parts.push(`Subnets: ${classification.stats.subnetsActive.length}`);
  
  if (classification.stats.validatorCount > 0) {
    parts.push(`Validators: ${classification.stats.validatorCount}`);
  }
  if (classification.stats.minerCount > 0) {
    parts.push(`Miners: ${classification.stats.minerCount}`);
  }
  if (classification.stats.subnetOwnerCount > 0) {
    parts.push(`Subnet Owners: ${classification.stats.subnetOwnerCount}`);
  }
  
  return parts.join(', ');
}
