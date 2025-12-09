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
  total_alpha_value_tao: number;
  unique_alpha_tokens: number;
  alpha_holdings: AlphaHolding[];
  total_staked_tao: number;
  free_tao: number;
  total_wallet_value_tao: number;
  alpha_percentage: number;
}
