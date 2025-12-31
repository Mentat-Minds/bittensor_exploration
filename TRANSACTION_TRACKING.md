# Transaction Tracking Implementation

## Overview

This document describes the implementation of transaction counting for alpha holders analysis.

## Feature: `number_tx` Field

Each wallet in the analysis now includes a `number_tx` field that counts **ONLY stake/unstake transactions** in the last 50 days.

### What is Counted

✅ **DELEGATE** transactions (adding stake)  
✅ **UNDELEGATE** transactions (removing stake)  

❌ **NOT** counted: Transfers, swaps, or any other transaction types

### Data Source

**Taostats API Endpoint:** `/api/delegation/v1`

This endpoint returns exclusively DELEGATE and UNDELEGATE transactions, ensuring no contamination with other transaction types.

## Implementation Details

### 1. Type Definition

```typescript
export interface AlphaHolderAnalysis {
  coldkey: string;
  // ... other fields
  number_tx: number; // Number of stake/unstake transactions in the last 50 days
}
```

### 2. Core Function: `getStakeUnstakeCount()`

Located in: `src/services/taostats.ts`

**Features:**
- ✅ **Defensive order detection**: Automatically detects if API returns DESC or ASC order
- ✅ **Early exit optimization**: Stops fetching pages once transactions are older than 50 days (if DESC order)
- ✅ **Handles pagination**: Fetches all pages if needed
- ✅ **Error handling**: Returns 0 on error instead of crashing

**Algorithm:**

```typescript
1. Peek with 1 result to check if any transactions exist
   → If 0, return immediately

2. If ≤100 total transactions
   → Fetch all at once, filter by date, return count

3. If >100 transactions
   → Fetch first full page to detect order (DESC vs ASC)
   
   If DESC (newest first):
     → Use early exit optimization
     → Stop fetching when last tx in page is older than 50 days
   
   If ASC (oldest first):
     → Must fetch all pages
     → Filter by date at the end
```

### 3. Batch Processing: `getStakeUnstakeCountsBatch()`

**Configuration:**
- Batch size: 10 coldkeys in parallel
- Delay between batches: 200ms
- Per-request delay: 50ms
- Error handling: Defaults to 0 if fetch fails

**Performance:**
- For 2,391 wallets: ~30-60 seconds
- Respects API rate limits

### 4. Integration in Analysis

The transaction counts are fetched **after** identifying all alpha holders but **before** querying free balances:

```
Step 1: Fetch stakes (Taostats API)
Step 2: Fetch liquidity positions (Taostats API)
Step 3: Identify unique coldkeys with alpha
Step 4: Fetch transaction counts ← NEW
Step 5: Fetch free balances (Blockchain)
Step 6: Calculate metrics
Step 7: Export results
```

## Output Format

### JSON Export

```json
{
  "coldkey": "5F...",
  "total_alpha_value_tao": 9510.23,
  "number_tx": 12,
  // ... other fields
}
```

### Console Display

```
1. Coldkey: 5F...
   Total Wallet Value: 9510.24 TAO
   ├─ Free TAO: 0.01
   ├─ Staked TAO (root): 0.00
   └─ Alpha Value: 9510.23 (99.99%)
   Unique Alpha Tokens: 1
   Stake/Unstake Transactions (50d): 12  ← NEW
```

### Summary Statistics

```
Transaction Activity (last 50 days):
  - Active traders: 1,234 (51.6%)
  - Total transactions: 45,678
  - Average per holder: 19.10
```

## Testing

### Quick Test (Single Wallet)

```bash
npm run test:tx
```

This tests the transaction counting on a single known alpha holder.

### Full Analysis

```bash
npm run analyze:alpha
```

This runs the complete analysis with transaction counting for all 2,391+ alpha holders.

## Performance Considerations

### API Calls

**Worst case:** 2,391 coldkeys × ~2-3 requests = ~5,000-7,000 API calls  
**Best case:** 2,391 coldkeys × 1 request = ~2,391 API calls (if all have ≤100 txs)

**Actual:** Likely ~3,000-4,000 calls with early exit optimization

### Time

- **Sequential:** ~4-8 minutes
- **With batching (10 parallel):** ~30-60 seconds ✅

### Rate Limiting

Built-in protections:
- Batch size: 10 parallel requests max
- 200ms delay between batches
- 50ms delay between pages
- Error handling with default fallback

## Important Notes

### Transaction Types Guarantee

The `/api/delegation/v1` endpoint returns **ONLY** these transaction types:
- `action: "DELEGATE"` - Staking transactions
- `action: "UNDELEGATE"` - Unstaking transactions

**No other transaction types are included.** This is guaranteed by the Taostats API design.

### Time Window

Currently hardcoded to **50 days**. Can be modified in:
- `getStakeUnstakeCount(coldkey, days = 50)` parameter
- `getStakeUnstakeCountsBatch(coldkeys, days = 50)` parameter

### Error Handling

If a coldkey fails to fetch transaction count:
- Warning is logged
- Default value of `0` is used
- Analysis continues for other coldkeys

## Future Improvements

Possible enhancements:

1. **Configurable time window** via CLI parameter
2. **Cache results** to avoid re-fetching on re-run
3. **Detailed breakdown** (DELEGATE vs UNDELEGATE counts separately)
4. **Transaction volume** (sum of amounts, not just count)
5. **Most active subnet** for each holder
6. **Time series data** (transactions per week/month)

## Files Modified

1. `src/types/index.ts` - Added `number_tx` field
2. `src/services/taostats.ts` - Added transaction fetching functions
3. `src/analysis/alphaHolders.ts` - Integrated transaction counting
4. `src/scripts/testTxCount.ts` - Test script (NEW)
5. `package.json` - Added `test:tx` script

## Verification

To verify the implementation is working correctly:

1. Run `npm run test:tx` to test a single wallet
2. Check that only DELEGATE/UNDELEGATE transactions are counted
3. Verify the count matches the expected number for known wallets
4. Run full analysis and check `number_tx` field in JSON output
