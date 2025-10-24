export const contractConfig = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS,
  usdtAddress: process.env.NEXT_PUBLIC_USDT_ADDRESS,
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
};

export const pinataConfig = {
  jwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  gatewayUrl: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL,
};

export const PaymentToken = {
  ETH: 0,
  USDC: 1,
  USDT: 2,
};

export const PERCENTAGE_BASE = 10000;
export const MAX_ROYALTY_PERCENTAGE = 1000; // 10%
