// Alpha holders analysis
import type { StakeBalance, AlphaHolderAnalysis, AlphaHolding } from '../types';
import { getAllStakeBalances, getAllLiquidityPositions } from '../services/taostats';
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
  
  // Step 2: Fetch all liquidity positions
  const allLiquidityPositions = await getAllLiquidityPositions();
  
  // Step 3: Separate alpha stakes from TAO stakes
  const alphaStakes = allStakes.filter(s => s.netuid > 0);
  const taoStakes = allStakes.filter(s => s.netuid === 0);
  
  console.log(`\nData distribution:`);
  console.log(`  - Alpha stakes: ${alphaStakes.length}`);
  console.log(`  - TAO stakes (root): ${taoStakes.length}`);
  console.log(`  - Liquidity positions: ${allLiquidityPositions.length}`);
  
  // Step 4: Group stakes by coldkey
  const coldkeyStakes = new Map<string, StakeBalance[]>();
  
  for (const stake of allStakes) {
    const ck = stake.coldkey.ss58;
    if (!coldkeyStakes.has(ck)) {
      coldkeyStakes.set(ck, []);
    }
    coldkeyStakes.get(ck)!.push(stake);
  }
  
  // Step 5: Group liquidity positions by coldkey
  const coldkeyLiquidityPositions = new Map<string, any[]>();
  
  for (const position of allLiquidityPositions) {
    const ck = position.coldkey.ss58;
    if (!coldkeyLiquidityPositions.has(ck)) {
      coldkeyLiquidityPositions.set(ck, []);
    }
    coldkeyLiquidityPositions.get(ck)!.push(position);
  }
  
  // Step 6: Combine all coldkeys with either stakes or liquidity positions in alpha
  const allColdkeys = new Set<string>();
  
  // Add coldkeys with alpha stakes
  for (const [ck, stakes] of coldkeyStakes.entries()) {
    if (stakes.some(s => s.netuid > 0)) {
      allColdkeys.add(ck);
    }
  }
  
  // Add coldkeys with liquidity positions in alpha subnets
  for (const [ck, positions] of coldkeyLiquidityPositions.entries()) {
    if (positions.some(p => p.netuid > 0 && (Number(p.alpha) > 0 || Number(p.tao) > 0))) {
      allColdkeys.add(ck);
    }
  }
  
  const coldkeysWithAlpha = Array.from(allColdkeys);
  
  console.log(`\n✓ Found ${coldkeysWithAlpha.length} unique coldkeys with alpha holdings (stakes + liquidity)`);
  
  // Step 5: Connect to chain and get free balances
  await connectToChain();
  const freeBalances = await getFreeBalances(coldkeysWithAlpha);
  
  // Step 6: Calculate analysis for each coldkey
  console.log('\n=== Calculating portfolio metrics ===\n');
  
  const analyses: AlphaHolderAnalysis[] = [];
  
  for (const coldkey of coldkeysWithAlpha) {
    const stakes = coldkeyStakes.get(coldkey) || [];
    const liquidityPositions = coldkeyLiquidityPositions.get(coldkey) || [];
    
    const alphaStakesForCk = stakes.filter(s => s.netuid > 0);
    const taoStakesForCk = stakes.filter(s => s.netuid === 0);
    
    // Group alpha holdings by netuid (combining stakes + liquidity)
    const alphaHoldingsByNetuid = new Map<number, AlphaHolding>();
    
    // Add staked alpha
    for (const stake of alphaStakesForCk) {
      const netuid = stake.netuid;
      const balanceAlpha = Number(stake.balance) / 1e9;
      const valueTao = Number(stake.balance_as_tao) / 1e9;
      
      if (!alphaHoldingsByNetuid.has(netuid)) {
        alphaHoldingsByNetuid.set(netuid, {
          netuid,
          subnet_name: getSubnetName(netuid),
          balance_alpha: 0,
          value_tao: 0,
          percentage_of_portfolio: 0,
        });
      }
      
      const holding = alphaHoldingsByNetuid.get(netuid)!;
      holding.balance_alpha += balanceAlpha;
      holding.value_tao += valueTao;
    }
    
    // Add liquidity positions alpha
    for (const position of liquidityPositions) {
      if (position.netuid === 0) continue; // Skip root liquidity
      
      const netuid = position.netuid;
      const alphaInPosition = Number(position.alpha) / 1e9;
      
      // For liquidity positions, we need to estimate the TAO value
      // Using the alpha amount directly as value (simplified, should use price)
      // The position also has 'liquidity' field which represents total value
      const totalLiquidity = Number(position.liquidity) / 1e9;
      
      if (!alphaHoldingsByNetuid.has(netuid)) {
        alphaHoldingsByNetuid.set(netuid, {
          netuid,
          subnet_name: getSubnetName(netuid),
          balance_alpha: 0,
          value_tao: 0,
          percentage_of_portfolio: 0,
        });
      }
      
      const holding = alphaHoldingsByNetuid.get(netuid)!;
      holding.balance_alpha += alphaInPosition;
      // Use the liquidity value as TAO equivalent (represents total position value)
      holding.value_tao += totalLiquidity;
    }
    
    const alphaHoldings: AlphaHolding[] = Array.from(alphaHoldingsByNetuid.values());
    
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
  console.log('\n=== TOP ALPHA HOLDERS (Stakes + Liquidity) ===\n');
  console.log(`Showing top ${Math.min(limit, analyses.length)} of ${analyses.length} alpha holders\n`);
  console.log(`Note: Alpha holdings include both staked alpha and alpha in liquidity pools\n`);
  
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
