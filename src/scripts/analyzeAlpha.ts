// Script to run alpha holders analysis
import { analyzeAlphaHolders, displayResults, exportToJSON } from '../analysis/alphaHolders';
import * as path from 'path';

async function main() {
  try {
    // Run analysis
    const results = await analyzeAlphaHolders();
    
    // Display results
    displayResults(results, 20);
    
    // Export to JSON
    const outputPath = path.join(__dirname, '../../output/alpha_holders_analysis.json');
    exportToJSON(results, outputPath);
    
    console.log('\n✓ Analysis complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during analysis:', error);
    process.exit(1);
  }
}

main();
