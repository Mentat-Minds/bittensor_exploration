# Alpha Holders Analysis Strategy

## Objective
Analyze all coldkeys holding alpha tokens on Bittensor to understand:
1. List of all coldkeys with alpha holdings
2. Amount of TAO value in subnet tokens (alpha) per coldkey
3. Number of different alpha tokens held per coldkey
4. Percentage of wallet in alpha tokens vs total TAO

## Data Sources & Approach

### Option 1: Taostats API (RECOMMENDED for this analysis)
**Pros:**
- Pre-indexed data, much faster
- Cleaner API for aggregated queries
- No need to process raw chain data
- Handles pagination and filtering

**Cons:**
- Requires API key (free tier available)
- Dependent on external service
- May have rate limits

**Relevant Endpoints:**

1. **`GET /api/dtao/stake_balance/latest/v1`**
   - Returns stake balances for all coldkeys across all subnets
   - Parameters: `coldkey` (optional), `netuid` (optional)
   - Response includes:
     - `coldkey.ss58`: The coldkey address
     - `netuid`: Subnet ID (0 = root, 1+ = alpha subnets)
     - `balance`: Alpha balance in RAO (divide by 1e9 for alpha tokens)
     - `balance_as_tao`: TAO equivalent value
     - `subnet_rank`: Wallet rank in subnet
     - `subnet_total_holders`: Total holders in subnet

2. **`GET /api/dtao/liquidity/position/v1`**
   - Returns liquidity provider positions
   - Useful for understanding liquidity commitments (also alpha holdings)
   - Response includes:
     - `coldkey.ss58`: The coldkey address
     - `netuid`: Subnet ID
     - `alpha`: Alpha tokens in liquidity position
     - `tao`: TAO tokens in liquidity position

**Strategy with Taostats:**
```
1. Call stake_balance endpoint without filters → get ALL stakes across all subnets
2. Filter results where netuid > 0 (exclude root subnet - that's TAO not alpha)
3. Group by coldkey to aggregate:
   - Total alpha value in TAO
   - Count of unique netuids (different alpha types)
   - Calculate percentage vs total wallet
4. Optional: Add liquidity positions data for complete picture
```

### Option 2: Direct Chain Queries via @polkadot/api
**Pros:**
- No external dependencies
- Direct source of truth
- Full control over data

**Cons:**
- Much slower (need to iterate through all possible coldkeys)
- Complex data processing
- Need to decode substrate data formats
- Resource intensive

**Relevant Chain Queries:**
```typescript
// Get all subnet stakes for a specific coldkey + hotkey combination
api.query.subtensorModule.stake(netuid, hotkey_ss58, coldkey_ss58)

// Get subnet data (for pricing)
api.query.subtensorModule.subnetTAO(netuid)
api.query.subtensorModule.subnetAlphaIn(netuid)
api.query.subtensorModule.subnetMovingPrice(netuid)

// Get total coldkey balance
api.query.system.account(coldkey_ss58)
```

**Challenge:** 
The chain doesn't have a direct "get all coldkeys with alpha" query. You'd need to:
1. Get all stake events from chain history, OR
2. Iterate through known coldkeys from other sources, OR
3. Use Taostats to get the list first, then query chain for verification

### Option 3: Hybrid Approach
Use Taostats API to get the list of coldkeys with alpha, then query the chain directly for specific details if needed for verification or additional data not available in Taostats.

## Recommended Implementation

**Phase 1: Use Taostats API** (Quick analysis)
- Get comprehensive alpha holder data
- Fast and efficient
- Good for initial exploration

**Phase 2: Chain verification** (Optional, for critical data)
- Verify specific coldkeys on-chain
- Get real-time updates
- Use for monitoring or alerts

## Data Processing Logic

```
For each coldkey with alpha:
1. Get all stakes where netuid > 0
2. Calculate:
   - total_alpha_value_tao = sum(balance_as_tao for all subnets)
   - unique_alpha_count = count(distinct netuid)
   - total_wallet_tao = coldkey_free_balance + total_staked_tao + total_alpha_value_tao
   - alpha_percentage = (total_alpha_value_tao / total_wallet_tao) * 100

3. Sort and filter:
   - Filter: alpha_percentage > 0
   - Sort by: total_alpha_value_tao DESC or alpha_percentage DESC
```

## Output Format

```json
{
  "coldkey": "5ABC...123",
  "total_alpha_value_tao": 1234.56,
  "unique_alpha_tokens": 5,
  "alpha_holdings": [
    {
      "netuid": 1,
      "alpha_name": "alpha",
      "balance_alpha": 1000,
      "value_tao": 500.5,
      "percentage_of_portfolio": 40.5
    }
  ],
  "total_wallet_value_tao": 2000.0,
  "alpha_percentage": 61.73
}
```

## Notes

- **Root subnet (netuid=0)** holds TAO, not alpha - exclude from analysis
- **1 RAO = 1e-9 TAO/alpha**
- Alpha tokens are named by their subnet (subnet 1 = "alpha", subnet 2 = "beta", etc.)
- Price of alpha varies per subnet based on liquidity pool dynamics
- Consider both staked alpha AND liquidity pool positions for complete picture
