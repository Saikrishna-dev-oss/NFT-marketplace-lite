import { ethers } from "ethers";
import { contractConfig } from "./config";
import ABI from "../../web3/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import ERC20 from "../../web3/artifacts/contracts/MockERC20.sol/MockERC20.json";

export const getContract = (signerOrProvider) => {
  // You'll need to import your ABI here
  const NFTMarketplaceABI = ABI.abi;
  return new ethers.Contract(
    contractConfig.address,
    NFTMarketplaceABI,
    signerOrProvider
  );
};

export const getERC20Contract = (tokenAddress, signerOrProvider) => {
  const ERC20_ABI = ERC20.abi;
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
};

export const formatPrice = (price, decimals = 18) => {
  return ethers.utils.formatUnits(price.toString(), decimals);
};

export const parsePrice = (price, decimals = 18) => {
  return ethers.utils.parseUnits(price.toString(), decimals);
};

export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

export const formatTokenSymbol = (paymentToken) => {
  switch (paymentToken) {
    case 0:
      return "ETH";
    case 1:
      return "USDC";
    case 2:
      return "USDT";
    default:
      return "Unknown";
  }
};

export const getTokenDecimals = (paymentToken) => {
  switch (paymentToken) {
    case 0:
      return 18; // ETH
    case 1:
      return 6; // USDC
    case 2:
      return 6; // USDT
    default:
      return 18;
  }
};
