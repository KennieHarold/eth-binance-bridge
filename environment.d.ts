declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_PRIV_KEY: string;
      INFURA_API_KEY: string;
      BSCSCAN_API_KEY: string;
      ETHERSCAN_API_KEY: string;
    }
  }
}

export {};
