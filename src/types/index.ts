// Type definitions for the analysis

export interface StakeBalance {
  block_number: number;
  timestamp: string;
  hotkey_name?: string;
  hotkey: {
    ss58: string;
    hex: string;
  };
  coldkey: {
    ss58: string;
    hex: string;
  };
  netuid: number;
  subnet_rank: number;
  subnet_total_holders: number;
  balance: string; // RAO
  balance_as_tao: string; // RAO
}

export interface AlphaHolding {
  netuid: number;
  subnet_name: string;
  balance_alpha: number;
  value_tao: number;
  percentage_of_portfolio: number;
}

export interface AlphaHolderAnalysis {
  coldkey: string;
  roles: string[]; // Array of roles: "Subnet Owner", "Validator", "Miner", "Investor"
  has_staking_proxy: boolean; // Whether this coldkey has a staking proxy configured
  total_alpha_value_tao: number;
  unique_alpha_tokens: number;
  alpha_holdings: AlphaHolding[];
  total_staked_tao: number;
  free_tao: number;
  total_wallet_value_tao: number;
  alpha_percentage: number;
  number_tx: number; // Number of stake/unstake transactions in the last 50 days
  tx_time: number; // Number of transaction sessions (grouped by 1-hour windows) in the last 50 days
}

// Metagraph API types
export interface MetagraphNeuron {
  hotkey: {
    ss58: string;
    hex: string;
  };
  coldkey: {
    ss58: string;
    hex: string;
  };
  netuid: number;
  uid: number;
  validator_permit: boolean;
  dividends: string;
  incentive: string;
  emission: string;
  stake: string;
  consensus: string;
  active: boolean;
  is_owner_hotkey: boolean;
  // Additional fields exist but these are the ones we need for classification
}

export interface HotkeyInfo {
  address: string;
  netuid: number;
  role: 'VALIDATOR' | 'MINER' | 'SUBNET_OWNER';
}

export interface ColdkeyClassification {
  coldkey: string;
  roles: string[]; // Combined roles as strings
  hotkeys: HotkeyInfo[];
  stats: {
    totalHotkeys: number;
    subnetsActive: number[];
    validatorCount: number;
    minerCount: number;
    subnetOwnerCount: number;
  };
}
