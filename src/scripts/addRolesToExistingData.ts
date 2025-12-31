// Add wallet roles to existing analysis data
import { readFileSync, writeFileSync } from 'fs';
import { fetchAllMetagraphs, classifyColdkeys } from '../services/walletClassification';
import type { AlphaHolderAnalysis } from '../types';

async function addRoles() {
  const inputFile = 'output/alpha_holders_analysis.json';
  const outputFile = 'output/alpha_holders_analysis_with_roles.json';
  const backupFile = 'output/alpha_holders_analysis_backup.json';
  
  console.log('\n=== Adding Roles to Existing Analysis Data ===\n');
  
  // Step 1: Read existing data
  console.log('Step 1: Reading existing data...');
  const existingData = JSON.parse(readFileSync(inputFile, 'utf-8')) as AlphaHolderAnalysis[];
  console.log(`  ✓ Loaded ${existingData.length.toLocaleString()} holders\n`);
  
  // Step 2: Fetch metagraphs for all subnets
  console.log('Step 2: Fetching metagraphs for wallet classification...');
  console.log('  (This will take ~5-10 minutes)\n');
  const metagraphsBySubnet = await fetchAllMetagraphs();
  
  // Step 3: Classify coldkeys
  console.log('\nStep 3: Classifying coldkeys based on metagraph data...');
  const coldkeyClassifications = classifyColdkeys(metagraphsBySubnet);
  console.log(`  ✓ Classified ${coldkeyClassifications.size.toLocaleString()} coldkeys\n`);
  
  // Step 4: Update roles in existing data
  console.log('Step 4: Merging roles into existing data...\n');
  let updated = 0;
  let unchanged = 0;
  
  const updatedData = existingData.map((holder, index) => {
    const classification = coldkeyClassifications.get(holder.coldkey);
    
    if (classification && classification.roles.length > 0) {
      // Update roles
      const oldRoles = holder.roles.join(', ');
      const newRoles = classification.roles;
      
      if (oldRoles !== newRoles.join(', ')) {
        updated++;
        if (updated <= 5) {
          console.log(`  [${index + 1}] ${holder.coldkey.substring(0, 12)}...`);
          console.log(`      Old: ${oldRoles}`);
          console.log(`      New: ${newRoles.join(', ')}`);
        }
      }
      
      return {
        ...holder,
        roles: newRoles
      };
    } else {
      // Keep existing roles (default to Investor if was empty)
      unchanged++;
      return holder;
    }
  });
  
  if (updated > 5) {
    console.log(`  ... and ${updated - 5} more updated`);
  }
  
  console.log(`\n  ✓ Updated: ${updated.toLocaleString()} holders`);
  console.log(`  ✓ Unchanged: ${unchanged.toLocaleString()} holders\n`);
  
  // Step 5: Show role distribution
  console.log('Step 5: New role distribution:\n');
  const roleCount = new Map<string, number>();
  updatedData.forEach(holder => {
    holder.roles.forEach(role => {
      roleCount.set(role, (roleCount.get(role) || 0) + 1);
    });
  });
  
  const sortedRoles = Array.from(roleCount.entries()).sort((a, b) => b[1] - a[1]);
  sortedRoles.forEach(([role, count]) => {
    console.log(`  - ${role}: ${count.toLocaleString()}`);
  });
  
  // Step 6: Save files
  console.log('\nStep 6: Saving files...\n');
  
  // Create backup of original
  writeFileSync(backupFile, JSON.stringify(existingData, null, 2));
  console.log(`  ✓ Backup saved: ${backupFile}`);
  
  // Save new version
  writeFileSync(outputFile, JSON.stringify(updatedData, null, 2));
  console.log(`  ✓ Updated data saved: ${outputFile}`);
  
  const newSize = (Buffer.byteLength(JSON.stringify(updatedData)) / 1024 / 1024).toFixed(2);
  console.log(`  ✓ File size: ${newSize} MB\n`);
  
  console.log('='.repeat(60));
  console.log('✅ ROLES SUCCESSFULLY ADDED!');
  console.log('='.repeat(60));
  console.log('\nFiles created:');
  console.log(`  1. ${outputFile} (with roles)`);
  console.log(`  2. ${backupFile} (backup of original)`);
  console.log('\nOriginal file unchanged: ' + inputFile);
  console.log('\n');
}

addRoles().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
