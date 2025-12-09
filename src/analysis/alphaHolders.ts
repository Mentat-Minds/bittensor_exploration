// Alpha holders analysis
import type { StakeBalance, AlphaHolderAnalysis, AlphaHolding } from '../types';
import { getAllStakeBalances } from '../services/taostats';
import { connectToChain, getFreeBalances, disconnectFromChain } from '../services/bittensor';

// Subnet names mapping (Greek alphabet for subnets 1-24, etc.)
const SUBNET_NAMES: Record<number, string> = {
  0: 'root',
  1: 'alpha',
  2: 'beta',
  3: 'gamma',
  4: 'delta',
  5: 'epsilon',
  6: 'zeta',
  7: 'eta',
  8: 'theta',
  9: 'iota',
  10: 'kappa',
  11: 'lambda',
  12: 'mu',
  13: 'nu',
  14: 'xi',
  15: 'omicron',
  16: 'pi',
  17: 'rho',
  18: 'sigma',
  19: 'tau',
  20: 'upsilon',
  21: 'phi',
  22: 'chi',
  23: 'psi',
  24: 'omega',
};

function getSubnetName(netuid: number): string {
  return SUBNET_NAMES[netuid] || `subnet-${netuid}`;
}

/**
 * Analyze all alpha holders
 */
export async function analyzeAlphaHolders(): Promise<AlphaHolderAnalysis[]> {
  console.log('\n=== Starting Alpha Holders Analysis ===\n');

  // Step 1: Fetch all stakes from Taostats
  const allStakes = await getAllStakeBalances();
  
  // Step 2: Separate alpha stakes from TAO stakes
  const alphaStakes = allStakes.filter(s => s.netuid > 0);
  const taoStakes = allStakes.filter(s => s.netuid === 0);
  
  console.log(`\nStake distribution:`);
  console.log(`  - Alpha stakes: ${alphaStakes.length}`);
  console.log(`  - TAO stakes (root): ${taoStakes.length}`);
  
  // Step 3: Group by coldkey
  const coldkeyStakes = new Map<string, StakeBalance[]>();
  
  for (const stake of allStakes) {
    const ck = stake.coldkey.ss58;
    if (!coldkeyStakes.has(ck)) {
      coldkeyStakes.set(ck, []);
    }
    coldkeyStakes.get(ck)!.push(stake);
  }
  
  // Step 4: Filter coldkeys that have alpha
  const coldkeysWithAlpha = Array.from(coldkeyStakes.entries())
    .filter(([_, stakes]) => stakes.some(s => s.netuid > 0))
    .map(([ck, _]) => ck);
  
  console.log(`\n✓ Found ${coldkeysWithAlpha.length} unique coldkeys with alpha holdings`);
  
  // Step 5: Connect to chain and get free balances
  await connectToChain();
  const freeBalances = await getFreeBalances(coldkeysWithAlpha);
  
  // Step 6: Calculate analysis for each coldkey
  console.log('\n=== Calculating portfolio metrics ===\n');
  
  const analyses: AlphaHolderAnalysis[] = [];
  
  for (const coldkey of coldkeysWithAlpha) {
    const stakes = coldkeyStakes.get(coldkey)!;
    const alphaStakesForCk = stakes.filter(s => s.netuid > 0);
    const taoStakesForCk = stakes.filter(s => s.netuid === 0);
    
    // Calculate alpha holdings
    const alphaHoldings: AlphaHolding[] = alphaStakesForCk.map(stake => {
      const balanceAlpha = Number(stake.balance) / 1e9;
      const valueTao = Number(stake.balance_as_tao) / 1e9;
      
      return {
        netuid: stake.netuid,
        subnet_name: getSubnetName(stake.netuid),
        balance_alpha: balanceAlpha,
        value_tao: valueTao,
        percentage_of_portfolio: 0, // Will calculate after we have total
      };
    });
    
    // Calculate totals
    const totalAlphaValueTao = alphaHoldings.reduce((sum, h) => sum + h.value_tao, 0);
    const totalStakedTao = taoStakesForCk.reduce((sum, s) => sum + Number(s.balance) / 1e9, 0);
    const freeTao = freeBalances.get(coldkey) || 0;
    const totalWalletValueTao = freeTao + totalStakedTao + totalAlphaValueTao;
    
    // Calculate percentages
    alphaHoldings.forEach(h => {
      h.percentage_of_portfolio = totalWalletValueTao > 0 
        ? (h.value_tao / totalWalletValueTao) * 100 
        : 0;
    });
    
    const alphaPercentage = totalWalletValueTao > 0 
      ? (totalAlphaValueTao / totalWalletValueTao) * 100 
      : 0;
    
    analyses.push({
      coldkey,
      total_alpha_value_tao: totalAlphaValueTao,
      unique_alpha_tokens: new Set(alphaHoldings.map(h => h.netuid)).size,
      alpha_holdings: alphaHoldings.sort((a, b) => b.value_tao - a.value_tao),
      total_staked_tao: totalStakedTao,
      free_tao: freeTao,
      total_wallet_value_tao: totalWalletValueTao,
      alpha_percentage: alphaPercentage,
    });
  }
  
  // Step 7: Disconnect from chain
  await disconnectFromChain();
  
  // Step 8: Sort by total alpha value
  analyses.sort((a, b) => b.total_alpha_value_tao - a.total_alpha_value_tao);
  
  console.log('✓ Analysis complete\n');
  
  return analyses;
}

/**
 * Display analysis results
 */
export function displayResults(analyses: AlphaHolderAnalysis[], limit: number = 20): void {
  console.log('\n=== TOP ALPHA HOLDERS ===\n');
  console.log(`Showing top ${Math.min(limit, analyses.length)} of ${analyses.length} alpha holders\n`);
  
  analyses.slice(0, limit).forEach((analysis, idx) => {
    console.log(`\n${idx + 1}. Coldkey: ${analysis.coldkey}`);
    console.log(`   Total Wallet Value: ${analysis.total_wallet_value_tao.toFixed(2)} TAO`);
    console.log(`   ├─ Free TAO: ${analysis.free_tao.toFixed(2)}`);
    console.log(`   ├─ Staked TAO (root): ${analysis.total_staked_tao.toFixed(2)}`);
    console.log(`   └─ Alpha Value: ${analysis.total_alpha_value_tao.toFixed(2)} (${analysis.alpha_percentage.toFixed(2)}%)`);
    console.log(`   Unique Alpha Tokens: ${analysis.unique_alpha_tokens}`);
    
    if (analysis.alpha_holdings.length <= 3) {
      console.log(`   Alpha Holdings:`);
      analysis.alpha_holdings.forEach(h => {
        console.log(`     - ${h.subnet_name} (netuid ${h.netuid}): ${h.value_tao.toFixed(2)} TAO (${h.percentage_of_portfolio.toFixed(2)}%)`);
      });
    } else {
      console.log(`   Top 3 Alpha Holdings:`);
      analysis.alpha_holdings.slice(0, 3).forEach(h => {
        console.log(`     - ${h.subnet_name} (netuid ${h.netuid}): ${h.value_tao.toFixed(2)} TAO (${h.percentage_of_portfolio.toFixed(2)}%)`);
      });
      console.log(`     ... and ${analysis.alpha_holdings.length - 3} more`);
    }
  });
  
  // Summary statistics
  console.log('\n\n=== SUMMARY STATISTICS ===\n');
  const totalAlphaValue = analyses.reduce((sum, a) => sum + a.total_alpha_value_tao, 0);
  const avgAlphaPercentage = analyses.reduce((sum, a) => sum + a.alpha_percentage, 0) / analyses.length;
  const avgUniqueTokens = analyses.reduce((sum, a) => sum + a.unique_alpha_tokens, 0) / analyses.length;
  
  console.log(`Total Alpha Holders: ${analyses.length}`);
  console.log(`Total Alpha Value: ${totalAlphaValue.toFixed(2)} TAO`);
  console.log(`Average Alpha Percentage: ${avgAlphaPercentage.toFixed(2)}%`);
  console.log(`Average Unique Tokens per Holder: ${avgUniqueTokens.toFixed(2)}`);
}

/**
 * Export to JSON
 */
export function exportToJSON(analyses: AlphaHolderAnalysis[], filepath: string): void {
  const fs = require('fs');
  const path = require('path');
  
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(analyses, null, 2));
  console.log(`\n✓ Results exported to ${filepath}`);
}
