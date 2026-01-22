# Bittensor Exploration

Exploration and analysis project for the Bittensor network.

## 🚀 Quick Start - Run Streamlit Dashboard Locally

### Prerequisites
- Python 3.8+
- Node.js (for backend analysis)

### Installation

```bash
# Install Python dependencies
pip install streamlit pandas plotly

# Install Node.js dependencies (for analysis scripts)
npm install
```

### Run the Dashboard

```bash
streamlit run streamlit_app.py
```

The dashboard will open automatically in your browser at `http://localhost:8501`

### Features
- **Global Analysis by Role** - Breakdown of alpha holders by role (Subnet Owner, Investor, Miner)
- **Transaction Analysis** - View transaction counts and sessions (grouped by 1-hour windows)
- **Token Holdings** - Distribution of unique alpha tokens per holder
- **Alpha Percentage** - Portfolio composition analysis
- **Top Holders** - Ranked list of largest alpha holders
- **Subnet Breakdown** - Complete subnet-level statistics

## Overview

This project provides tools and scripts to interact with and analyze the Bittensor network.

## Configuration

The project connects to the Bittensor network using the following endpoints:
- Mainnet: `wss://entrypoint-finney.opentensor.ai:443`
- Archive nodes: Mentat Minds archive nodes
- Subvortex: `wss://secure.subvortex.info:443`

## Setup

```bash
npm install
```

## Usage

TBD

## Resources

- [Taostat API](https://taostats.io/)
- [Bittensor Documentation](https://docs.bittensor.com/)
