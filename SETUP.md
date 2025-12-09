# Setup Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Taostats API Key** (free tier available)

## Installation

```bash
npm install
```

## Configuration

### 1. Get Taostats API Key

Visit [https://dash.taostats.io/](https://dash.taostats.io/) to:
1. Create an account
2. Create an organization
3. Create a project
4. Get your API key

### 2. Setup Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your Taostats API key:
```
TAOSTAT_API_KEY=your_actual_api_key_here
```

### 3. Verify Connection

The project is configured to connect to:
- **Bittensor Node**: `wss://archive-fallback.mentatminds.com`
- **Taostats API**: `https://api.taostats.io`

## Running the Analysis

### Alpha Holders Analysis

```bash
npm run analyze:alpha
```

This will:
1. Fetch all stake balances from Taostats API
2. Identify coldkeys with alpha holdings
3. Query the Bittensor chain for free TAO balances
4. Calculate portfolio metrics
5. Display top 20 alpha holders
6. Export results to `output/alpha_holders_analysis.json`

## Output

The analysis provides:
- **Total alpha value** per coldkey (in TAO)
- **Number of unique alpha tokens** held
- **Alpha percentage** of total wallet
- **Detailed breakdown** of holdings per subnet
- **Summary statistics** for the entire ecosystem

## Troubleshooting

### API Key Issues
- Ensure your API key is valid
- Check you haven't exceeded rate limits
- Verify the key has proper permissions

### Chain Connection Issues
- The Mentat Minds archive node may be down
- Try alternative endpoints in `.env`:
  - `WEB_SOCKET_MAINNET`
  - `WEB_SOCKET_ARCHIVE_MENTATMINDS`

### Memory Issues
- For large datasets, increase Node.js memory:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run analyze:alpha
  ```
