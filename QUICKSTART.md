# Quick Start Guide

## Step 1: Add Your API Key

Edit the `.env` file and add your Taostats API key:

```bash
# If you have the key from internal-cloud-ops project:
# Copy TAO_STATS_API_KEY value to TAOSTAT_API_KEY in this project

nano .env
```

Set:
```
TAOSTAT_API_KEY=your_actual_key_here
```

## Step 2: Test the Setup

```bash
npm run test:setup
```

This will verify:
- ✓ API key is configured
- ✓ Taostats API connection works
- ✓ Bittensor chain connection works

## Step 3: Run the Analysis

```bash
npm run analyze:alpha
```

Expected output:
- Fetches all stake data from Taostats (~1 second)
- Identifies coldkeys with alpha holdings
- Queries chain for free balances (~1-2 minutes)
- Displays top 20 alpha holders
- Exports full results to `output/alpha_holders_analysis.json`

## What You'll Get

For each alpha holder:
- **Coldkey address**
- **Total wallet value** (free + staked + alpha)
- **Alpha holdings breakdown** by subnet
- **Percentage of portfolio in alpha**
- **Number of unique alpha tokens**

Plus summary statistics for the entire ecosystem!

## Troubleshooting

**"API key not found"**
→ Make sure you copied `.env.example` to `.env` and added your key

**"Failed to connect to chain"**
→ The archive node might be busy, try again in a few minutes

**"Rate limit exceeded"**
→ Wait a bit, Taostats has rate limits on the free tier

## Next Steps

After the analysis completes, check:
- Console output for top 20 holders
- `output/alpha_holders_analysis.json` for complete data
