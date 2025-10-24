import { createPublicClient, http } from "viem";
import { localhost } from "viem/chains";
import { getContract as viemGetContract } from "viem";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { contractConfig } from "./config";

import ABI from "../../web3/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import ERC20 from "../../web3/artifacts/contracts/MockERC20.sol/MockERC20.json";
// Import your existing ABI
const NFTMarketplaceABI = ABI.abi;

const ERC20_ABI = ERC20.abi;

// Helper function to get public client
const getPublicClient = () => {
  return createPublicClient({
    chain: localhost,
    transport: http(contractConfig.rpcUrl || "http://127.0.0.1:8545"),
  });
};

// Helper function to get contract instance for reading
const getReadContract = (publicClient) => {
  return viemGetContract({
    address: contractConfig.address,
    abi: NFTMarketplaceABI,
    client: publicClient,
  });
};

// Helper function to get contract instance for writing
const getWriteContract = (walletClient) => {
  return viemGetContract({
    address: contractConfig.address,
    abi: NFTMarketplaceABI,
    client: walletClient,
  });
};

// Helper function to get ERC20 contract
const getERC20Contract = (tokenAddress, client) => {
  return viemGetContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    client: client,
  });
};

// READ FUNCTIONS
export const getListingPrice = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const price = await contract.read.getListingPrice();
    return formatEther(price);
  } catch (error) {
    console.error("Error getting listing price:", error);
    throw new Error(`Failed to get listing price: ${error.message}`);
  }
};

export const getMarketItem = async (publicClient, tokenId) => {
  try {
    const contract = getReadContract(publicClient);
    const item = await contract.read.getMarketItem([BigInt(tokenId)]);

    console.log(item);

    return {
      tokenId: item.tokenId.toString(),
      seller: item.seller,
      owner: item.owner,
      ethPrice: formatEther(item.ethPrice),
      usdcPrice: formatUnits(item.usdcPrice, 6),
      usdtPrice: formatUnits(item.usdtPrice, 6),
      sold: item.sold,
      listedAt: new Date(Number(item.listedAt) * 1000),
      royaltyPercentage: Number(item.royaltyPercentage),
      royaltyRecipient: item.royaltyRecipient,
    };
  } catch (error) {
    console.error("Error getting market item:", error);
    throw new Error(`Failed to get market item: ${error.message}`);
  }
};

export const fetchMarketItems = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const items = await contract.read.fetchMarketItems();

    return Promise.all(
      items.map(async (item) => {
        try {
          const tokenURI = await contract.read.tokenURI([item.tokenId]);
          return {
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            owner: item.owner,
            ethPrice: formatEther(item.ethPrice),
            usdcPrice: formatUnits(item.usdcPrice, 6),
            usdtPrice: formatUnits(item.usdtPrice, 6),
            sold: item.sold,
            listedAt: new Date(Number(item.listedAt) * 1000),
            royaltyPercentage: Number(item.royaltyPercentage),
            royaltyRecipient: item.royaltyRecipient,
            tokenURI: tokenURI,
          };
        } catch (uriError) {
          console.error(
            `Error getting tokenURI for token ${item.tokenId}:`,
            uriError
          );
          return {
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            owner: item.owner,
            ethPrice: formatEther(item.ethPrice),
            usdcPrice: formatUnits(item.usdcPrice, 6),
            usdtPrice: formatUnits(item.usdtPrice, 6),
            sold: item.sold,
            listedAt: new Date(Number(item.listedAt) * 1000),
            royaltyPercentage: Number(item.royaltyPercentage),
            royaltyRecipient: item.royaltyRecipient,
            tokenURI: "",
          };
        }
      })
    );
  } catch (error) {
    console.error("Error fetching market items:", error);
    throw new Error(`Failed to fetch market items: ${error.message}`);
  }
};

export const fetchMyNFTs = async (publicClient, userAddress) => {
  try {
    const contract = getReadContract(publicClient);

    console.log("=== DEBUGGING fetchMyNFTs ===");
    console.log("User address:", userAddress);
    console.log("Contract address:", contractConfig.address);

    // Get total tokens first
    const totalTokens = await contract.read.getTotalTokens();
    console.log("Total tokens minted:", totalTokens.toString());

    if (totalTokens === 0n) {
      console.log("No tokens have been minted yet");
      return [];
    }

    // Check each token individually
    const userNFTs = [];

    for (let i = 1; i <= Number(totalTokens); i++) {
      try {
        console.log(`\n--- Checking Token ${i} ---`);

        // Get market item data
        const marketItem = await contract.read.getMarketItem([BigInt(i)]);
        console.log("Market item:", {
          tokenId: marketItem.tokenId.toString(),
          seller: marketItem.seller,
          owner: marketItem.owner,
          sold: marketItem.sold,
          ethPrice: marketItem.ethPrice.toString(),
          usdcPrice: marketItem.usdcPrice.toString(),
          usdtPrice: marketItem.usdtPrice.toString(),
        });

        // Get actual NFT owner
        const actualOwner = await contract.read.ownerOf([BigInt(i)]);
        console.log("Actual NFT owner:", actualOwner);

        // Check ownership conditions
        const isMarketItemOwner =
          marketItem.owner.toLowerCase() === userAddress.toLowerCase();
        const isActualOwner =
          actualOwner.toLowerCase() === userAddress.toLowerCase();
        const wasSeller =
          marketItem.seller.toLowerCase() === userAddress.toLowerCase();

        console.log("Ownership checks:", {
          isMarketItemOwner,
          isActualOwner,
          wasSeller,
          shouldInclude: isMarketItemOwner || isActualOwner,
        });

        // Include if user owns it in either state
        if (isMarketItemOwner || isActualOwner) {
          console.log(`✅ Including token ${i} in user's NFTs`);

          try {
            const tokenURI = await contract.read.tokenURI([BigInt(i)]);
            userNFTs.push({
              tokenId: marketItem.tokenId.toString(),
              seller: marketItem.seller,
              owner: marketItem.owner,
              ethPrice: formatEther(marketItem.ethPrice),
              usdcPrice: formatUnits(marketItem.usdcPrice, 6),
              usdtPrice: formatUnits(marketItem.usdtPrice, 6),
              sold: marketItem.sold,
              listedAt: new Date(Number(marketItem.listedAt) * 1000),
              royaltyPercentage: Number(marketItem.royaltyPercentage),
              royaltyRecipient: marketItem.royaltyRecipient,
              tokenURI: tokenURI,
              // Additional debug info
              actualOwner: actualOwner,
              isListed:
                marketItem.owner.toLowerCase() ===
                contractConfig.address.toLowerCase(),
            });
          } catch (uriError) {
            console.error(`Error getting tokenURI for token ${i}:`, uriError);
            userNFTs.push({
              tokenId: marketItem.tokenId.toString(),
              seller: marketItem.seller,
              owner: marketItem.owner,
              ethPrice: formatEther(marketItem.ethPrice),
              usdcPrice: formatUnits(marketItem.usdcPrice, 6),
              usdtPrice: formatUnits(marketItem.usdtPrice, 6),
              sold: marketItem.sold,
              listedAt: new Date(Number(marketItem.listedAt) * 1000),
              royaltyPercentage: Number(marketItem.royaltyPercentage),
              royaltyRecipient: marketItem.royaltyRecipient,
              tokenURI: "",
              actualOwner: actualOwner,
              isListed:
                marketItem.owner.toLowerCase() ===
                contractConfig.address.toLowerCase(),
            });
          }
        } else {
          console.log(`❌ Excluding token ${i} - not owned by user`);
        }
      } catch (error) {
        console.error(`Error checking token ${i}:`, error);
        // Check if token exists
        try {
          await contract.read.ownerOf([BigInt(i)]);
          console.log(`Token ${i} exists but has other issues`);
        } catch {
          console.log(`Token ${i} does not exist`);
        }
      }
    }

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Found ${userNFTs.length} NFTs for user`);
    console.log("NFTs:", userNFTs);

    return userNFTs;
  } catch (error) {
    console.error("Error in fetchMyNFTsDebug:", error);
    throw error;
  }
};

export const fetchItemsListed = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const items = await contract.read.fetchItemsListed();

    return Promise.all(
      items.map(async (item) => {
        try {
          const tokenURI = await contract.read.tokenURI([item.tokenId]);
          return {
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            owner: item.owner,
            ethPrice: formatEther(item.ethPrice),
            usdcPrice: formatUnits(item.usdcPrice, 6),
            usdtPrice: formatUnits(item.usdtPrice, 6),
            sold: item.sold,
            listedAt: new Date(Number(item.listedAt) * 1000),
            royaltyPercentage: Number(item.royaltyPercentage),
            royaltyRecipient: item.royaltyRecipient,
            tokenURI: tokenURI,
          };
        } catch (uriError) {
          console.error(
            `Error getting tokenURI for token ${item.tokenId}:`,
            uriError
          );
          return {
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            owner: item.owner,
            ethPrice: formatEther(item.ethPrice),
            usdcPrice: formatUnits(item.usdcPrice, 6),
            usdtPrice: formatUnits(item.usdtPrice, 6),
            sold: item.sold,
            listedAt: new Date(Number(item.listedAt) * 1000),
            royaltyPercentage: Number(item.royaltyPercentage),
            royaltyRecipient: item.royaltyRecipient,
            tokenURI: "",
          };
        }
      })
    );
  } catch (error) {
    console.error("Error fetching listed items:", error);
    throw new Error(`Failed to fetch listed items: ${error.message}`);
  }
};

export const getTotalStats = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const [totalTokens, totalSold] = await Promise.all([
      contract.read.getTotalTokens(),
      contract.read.getTotalItemsSold(),
    ]);

    return {
      totalTokens: Number(totalTokens),
      totalSold: Number(totalSold),
      totalListed: Number(totalTokens) - Number(totalSold),
    };
  } catch (error) {
    console.error("Error getting total stats:", error);
    throw new Error(`Failed to get total stats: ${error.message}`);
  }
};

// WRITE FUNCTIONS
export const createToken = async (
  walletClient,
  tokenURI,
  prices,
  royaltyPercentage = 0,
  royaltyRecipient = null
) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    // Get listing price
    const listingPrice = await contract.read.getListingPrice();

    // Parse prices
    const priceParams = {
      ethPrice: prices.ethPrice
        ? parseEther(prices.ethPrice.toString())
        : BigInt(0),
      usdcPrice: prices.usdcPrice
        ? parseUnits(prices.usdcPrice.toString(), 6)
        : BigInt(0),
      usdtPrice: prices.usdtPrice
        ? parseUnits(prices.usdtPrice.toString(), 6)
        : BigInt(0),
    };

    // Validate that at least one price is set
    if (
      priceParams.ethPrice === BigInt(0) &&
      priceParams.usdcPrice === BigInt(0) &&
      priceParams.usdtPrice === BigInt(0)
    ) {
      throw new Error("At least one price must be set");
    }

    console.log("Creating token with params:", {
      tokenURI,
      prices: priceParams,
      royaltyPercentage,
      royaltyRecipient,
      listingPrice: formatEther(listingPrice),
    });

    // Call the contract function
    const hash = await contract.write.createToken(
      [
        tokenURI,
        priceParams,
        BigInt(royaltyPercentage),
        royaltyRecipient || walletClient.account.address,
      ],
      {
        value: listingPrice,
      }
    );

    console.log("Transaction hash:", hash);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed:", receipt);

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error creating token:", error);
    throw new Error(`Failed to create token: ${error.message}`);
  }
};

export const updateItemPrices = async (walletClient, tokenId, prices) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const priceParams = {
      ethPrice: prices.ethPrice
        ? parseEther(prices.ethPrice.toString())
        : BigInt(0),
      usdcPrice: prices.usdcPrice
        ? parseUnits(prices.usdcPrice.toString(), 6)
        : BigInt(0),
      usdtPrice: prices.usdtPrice
        ? parseUnits(prices.usdtPrice.toString(), 6)
        : BigInt(0),
    };

    const hash = await contract.write.updateItemPrices([
      BigInt(tokenId),
      priceParams,
    ]);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error updating item prices:", error);
    throw new Error(`Failed to update item prices: ${error.message}`);
  }
};

export const resellToken = async (walletClient, tokenId, prices) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    // Get listing price
    const listingPrice = await contract.read.getListingPrice();

    const priceParams = {
      ethPrice: prices.ethPrice
        ? parseEther(prices.ethPrice.toString())
        : BigInt(0),
      usdcPrice: prices.usdcPrice
        ? parseUnits(prices.usdcPrice.toString(), 6)
        : BigInt(0),
      usdtPrice: prices.usdtPrice
        ? parseUnits(prices.usdtPrice.toString(), 6)
        : BigInt(0),
    };

    const hash = await contract.write.resellToken(
      [BigInt(tokenId), priceParams],
      {
        value: listingPrice,
      }
    );

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error reselling token:", error);
    throw new Error(`Failed to resell token: ${error.message}`);
  }
};

export const createMarketSaleETH = async (walletClient, tokenId, price) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const parsedPrice = parseEther(price.toString());

    const hash = await contract.write.createMarketSaleETH([BigInt(tokenId)], {
      value: parsedPrice,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error buying with ETH:", error);
    throw new Error(`Failed to buy with ETH: ${error.message}`);
  }
};

export const createMarketSaleUSDC = async (walletClient, tokenId, price) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();
    const usdcContract = getERC20Contract(
      contractConfig.usdcAddress,
      walletClient
    );

    const parsedPrice = parseUnits(price.toString(), 6);

    // Check allowance and approve if needed
    const allowance = await usdcContract.read.allowance([
      walletClient.account.address,
      contractConfig.address,
    ]);

    if (allowance < parsedPrice) {
      console.log("Approving USDC...");
      const approveHash = await usdcContract.write.approve([
        contractConfig.address,
        parsedPrice,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("USDC approved");
    }

    const hash = await contract.write.createMarketSaleUSDC([BigInt(tokenId)]);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error buying with USDC:", error);
    throw new Error(`Failed to buy with USDC: ${error.message}`);
  }
};

export const createMarketSaleUSDT = async (walletClient, tokenId, price) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();
    const usdtContract = getERC20Contract(
      contractConfig.usdtAddress,
      walletClient
    );

    const parsedPrice = parseUnits(price.toString(), 6);

    // Check allowance and approve if needed
    const allowance = await usdtContract.read.allowance([
      walletClient.account.address,
      contractConfig.address,
    ]);

    if (allowance < parsedPrice) {
      console.log("Approving USDT...");
      const approveHash = await usdtContract.write.approve([
        contractConfig.address,
        parsedPrice,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("USDT approved");
    }

    const hash = await contract.write.createMarketSaleUSDT([BigInt(tokenId)]);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error buying with USDT:", error);
    throw new Error(`Failed to buy with USDT: ${error.message}`);
  }
};

// UTILITY FUNCTIONS
export const getTokenBalance = async (
  publicClient,
  tokenAddress,
  userAddress
) => {
  try {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      // ETH balance
      const balance = await publicClient.getBalance({ address: userAddress });
      return formatEther(balance);
    } else {
      // ERC20 balance
      const tokenContract = getERC20Contract(tokenAddress, publicClient);
      const [balance, decimals] = await Promise.all([
        tokenContract.read.balanceOf([userAddress]),
        tokenContract.read.decimals(),
      ]);
      return formatUnits(balance, decimals);
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
};

// Check if user has enough balance for transaction
export const checkUserBalance = async (
  publicClient,
  userAddress,
  paymentToken,
  amount
) => {
  try {
    let tokenAddress;
    let decimals;

    switch (paymentToken) {
      case 0: // ETH
        tokenAddress = "0x0000000000000000000000000000000000000000";
        decimals = 18;
        break;
      case 1: // USDC
        tokenAddress = contractConfig.usdcAddress;
        decimals = 6;
        break;
      case 2: // USDT
        tokenAddress = contractConfig.usdtAddress;
        decimals = 6;
        break;
      default:
        throw new Error("Invalid payment token");
    }

    const balance = await getTokenBalance(
      publicClient,
      tokenAddress,
      userAddress
    );
    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(amount);

    return {
      hasEnoughBalance: balanceNum >= amountNum,
      balance: balance,
      required: amount,
      difference: (balanceNum - amountNum).toFixed(6),
    };
  } catch (error) {
    console.error("Error checking user balance:", error);
    throw new Error(`Failed to check user balance: ${error.message}`);
  }
};

// Get gas estimate for transaction
export const estimateGas = async (
  publicClient,
  walletClient,
  functionName,
  args,
  value = BigInt(0)
) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const gasEstimate = await publicClient.estimateContractGas({
      address: contractConfig.address,
      abi: NFTMarketplaceABI,
      functionName: functionName,
      args: args,
      account: walletClient.account.address,
      value: value,
    });

    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas:", error);
    // Return a default estimate if estimation fails
    return BigInt(500000);
  }
};

// Check if contract is deployed and accessible
export const checkContractDeployment = async (publicClient) => {
  try {
    const bytecode = await publicClient.getBytecode({
      address: contractConfig.address,
    });

    return {
      isDeployed: !!bytecode && bytecode !== "0x",
      address: contractConfig.address,
    };
  } catch (error) {
    console.error("Error checking contract deployment:", error);
    return {
      isDeployed: false,
      address: contractConfig.address,
      error: error.message,
    };
  }
};

// Additional functions to add to your existing functions.js file

// ========== ADMIN FUNCTIONS ==========

export const updateListingPrice = async (walletClient, newListingPrice) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const parsedPrice = parseEther(newListingPrice.toString());

    const hash = await contract.write.updateListingPrice([parsedPrice]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error updating listing price:", error);
    throw new Error(`Failed to update listing price: ${error.message}`);
  }
};

export const updatePlatformFee = async (walletClient, newFeePercentage) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.updatePlatformFee([
      BigInt(newFeePercentage),
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error updating platform fee:", error);
    throw new Error(`Failed to update platform fee: ${error.message}`);
  }
};

export const updateFeeRecipient = async (walletClient, newFeeRecipient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.updateFeeRecipient([newFeeRecipient]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error updating fee recipient:", error);
    throw new Error(`Failed to update fee recipient: ${error.message}`);
  }
};

export const updateTokenListingFee = async (
  walletClient,
  paymentToken,
  fee
) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    let parsedFee;
    switch (paymentToken) {
      case 0: // ETH
        parsedFee = parseEther(fee.toString());
        break;
      case 1: // USDC
      case 2: // USDT
        parsedFee = parseUnits(fee.toString(), 6);
        break;
      default:
        throw new Error("Invalid payment token");
    }

    const hash = await contract.write.updateTokenListingFee([
      BigInt(paymentToken),
      parsedFee,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error updating token listing fee:", error);
    throw new Error(`Failed to update token listing fee: ${error.message}`);
  }
};

export const setUserBlacklisted = async (
  walletClient,
  userAddress,
  blacklisted
) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.setUserBlacklisted([
      userAddress,
      blacklisted,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error setting user blacklist status:", error);
    throw new Error(`Failed to set user blacklist status: ${error.message}`);
  }
};

export const setTokenBlacklisted = async (
  walletClient,
  tokenId,
  blacklisted
) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.setTokenBlacklisted([
      BigInt(tokenId),
      blacklisted,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error setting token blacklist status:", error);
    throw new Error(`Failed to set token blacklist status: ${error.message}`);
  }
};

export const pauseContract = async (walletClient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.pause();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error pausing contract:", error);
    throw new Error(`Failed to pause contract: ${error.message}`);
  }
};

export const unpauseContract = async (walletClient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.unpause();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error unpausing contract:", error);
    throw new Error(`Failed to unpause contract: ${error.message}`);
  }
};

// ========== EMERGENCY FUNCTIONS ==========

export const initiateEmergencyWithdraw = async (walletClient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.initiateEmergencyWithdraw();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error initiating emergency withdraw:", error);
    throw new Error(`Failed to initiate emergency withdraw: ${error.message}`);
  }
};

export const cancelEmergencyWithdraw = async (walletClient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.cancelEmergencyWithdraw();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error canceling emergency withdraw:", error);
    throw new Error(`Failed to cancel emergency withdraw: ${error.message}`);
  }
};

export const emergencyWithdrawETH = async (walletClient) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.emergencyWithdrawETH();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error executing emergency ETH withdraw:", error);
    throw new Error(
      `Failed to execute emergency ETH withdraw: ${error.message}`
    );
  }
};

export const emergencyWithdrawToken = async (walletClient, tokenAddress) => {
  try {
    if (!walletClient || !walletClient.account) {
      throw new Error("Wallet client not available");
    }

    const contract = getWriteContract(walletClient);
    const publicClient = getPublicClient();

    const hash = await contract.write.emergencyWithdrawToken([tokenAddress]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      wait: () => Promise.resolve(receipt),
    };
  } catch (error) {
    console.error("Error executing emergency token withdraw:", error);
    throw new Error(
      `Failed to execute emergency token withdraw: ${error.message}`
    );
  }
};

// ========== VIEW FUNCTIONS ==========

export const getTokenListingFee = async (publicClient, paymentToken) => {
  try {
    const contract = getReadContract(publicClient);
    const fee = await contract.read.getTokenListingFee([BigInt(paymentToken)]);

    switch (paymentToken) {
      case 0: // ETH
        return formatEther(fee);
      case 1: // USDC
      case 2: // USDT
        return formatUnits(fee, 6);
      default:
        throw new Error("Invalid payment token");
    }
  } catch (error) {
    console.error("Error getting token listing fee:", error);
    throw new Error(`Failed to get token listing fee: ${error.message}`);
  }
};

export const getPlatformFeePercentage = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const fee = await contract.read.platformFeePercentage();
    return Number(fee);
  } catch (error) {
    console.error("Error getting platform fee percentage:", error);
    throw new Error(`Failed to get platform fee percentage: ${error.message}`);
  }
};

export const getFeeRecipient = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const recipient = await contract.read.feeRecipient();
    return recipient;
  } catch (error) {
    console.error("Error getting fee recipient:", error);
    throw new Error(`Failed to get fee recipient: ${error.message}`);
  }
};

export const isUserBlacklisted = async (publicClient, userAddress) => {
  try {
    const contract = getReadContract(publicClient);
    const blacklisted = await contract.read.blacklistedUsers([userAddress]);
    return blacklisted;
  } catch (error) {
    console.error("Error checking user blacklist status:", error);
    throw new Error(`Failed to check user blacklist status: ${error.message}`);
  }
};

export const isTokenBlacklisted = async (publicClient, tokenId) => {
  try {
    const contract = getReadContract(publicClient);
    const blacklisted = await contract.read.blacklistedTokens([
      BigInt(tokenId),
    ]);
    return blacklisted;
  } catch (error) {
    console.error("Error checking token blacklist status:", error);
    throw new Error(`Failed to check token blacklist status: ${error.message}`);
  }
};

export const getEmergencyWithdrawStatus = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const [enabled, timestamp] = await Promise.all([
      contract.read.emergencyWithdrawEnabled(),
      contract.read.emergencyWithdrawTimestamp(),
    ]);

    return {
      enabled,
      timestamp: Number(timestamp),
      readyAt: new Date(Number(timestamp) * 1000),
      isReady: enabled && Date.now() >= Number(timestamp) * 1000,
    };
  } catch (error) {
    console.error("Error getting emergency withdraw status:", error);
    throw new Error(
      `Failed to get emergency withdraw status: ${error.message}`
    );
  }
};

export const getContractConstants = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const [maxRoyalty, percentageBase, maxListingPrice] = await Promise.all([
      contract.read.MAX_ROYALTY_PERCENTAGE(),
      contract.read.PERCENTAGE_BASE(),
      contract.read.MAX_LISTING_PRICE(),
    ]);

    return {
      maxRoyaltyPercentage: Number(maxRoyalty),
      percentageBase: Number(percentageBase),
      maxListingPrice: formatEther(maxListingPrice),
    };
  } catch (error) {
    console.error("Error getting contract constants:", error);
    throw new Error(`Failed to get contract constants: ${error.message}`);
  }
};

export const getContractAddresses = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const [usdcAddress, usdtAddress] = await Promise.all([
      contract.read.usdcAddress(),
      contract.read.usdtAddress(),
    ]);

    return {
      usdcAddress,
      usdtAddress,
    };
  } catch (error) {
    console.error("Error getting contract addresses:", error);
    throw new Error(`Failed to get contract addresses: ${error.message}`);
  }
};

export const getOwner = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const owner = await contract.read.owner();
    return owner;
  } catch (error) {
    console.error("Error getting contract owner:", error);
    throw new Error(`Failed to get contract owner: ${error.message}`);
  }
};

export const isPaused = async (publicClient) => {
  try {
    const contract = getReadContract(publicClient);
    const paused = await contract.read.paused();
    return paused;
  } catch (error) {
    console.error("Error checking if contract is paused:", error);
    throw new Error(`Failed to check if contract is paused: ${error.message}`);
  }
};

// ========== ROYALTY FUNCTIONS ==========

export const getRoyaltyInfo = async (publicClient, tokenId, salePrice) => {
  try {
    const contract = getReadContract(publicClient);
    const [receiver, royaltyAmount] = await contract.read.royaltyInfo([
      BigInt(tokenId),
      parseEther(salePrice.toString()),
    ]);

    return {
      receiver,
      royaltyAmount: formatEther(royaltyAmount),
      royaltyPercentage:
        (Number(royaltyAmount) * 100) /
        Number(parseEther(salePrice.toString())),
    };
  } catch (error) {
    console.error("Error getting royalty info:", error);
    throw new Error(`Failed to get royalty info: ${error.message}`);
  }
};

// ========== UTILITY FUNCTIONS ==========

export const supportsInterface = async (publicClient, interfaceId) => {
  try {
    const contract = getReadContract(publicClient);
    const supported = await contract.read.supportsInterface([interfaceId]);
    return supported;
  } catch (error) {
    console.error("Error checking interface support:", error);
    throw new Error(`Failed to check interface support: ${error.message}`);
  }
};

// Enhanced function to get token URI with error handling
export const getTokenURI = async (publicClient, tokenId) => {
  try {
    const contract = getReadContract(publicClient);
    const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
    return tokenURI;
  } catch (error) {
    console.error(`Error getting token URI for token ${tokenId}:`, error);
    throw new Error(`Failed to get token URI: ${error.message}`);
  }
};

// Function to calculate fees before transaction
export const calculateFees = async (publicClient, tokenId, salePrice) => {
  try {
    const contract = getReadContract(publicClient);
    const [platformFeePercentage, item] = await Promise.all([
      contract.read.platformFeePercentage(),
      contract.read.getMarketItem([BigInt(tokenId)]),
    ]);

    const price = parseEther(salePrice.toString());
    const platformFee = (price * platformFeePercentage) / BigInt(10000);
    const royaltyFee = (price * item.royaltyPercentage) / BigInt(10000);
    const sellerAmount = price - platformFee - royaltyFee;

    return {
      totalPrice: formatEther(price),
      platformFee: formatEther(platformFee),
      royaltyFee: formatEther(royaltyFee),
      sellerAmount: formatEther(sellerAmount),
      platformFeePercentage: Number(platformFeePercentage) / 100,
      royaltyPercentage: Number(item.royaltyPercentage) / 100,
    };
  } catch (error) {
    console.error("Error calculating fees:", error);
    throw new Error(`Failed to calculate fees: ${error.message}`);
  }
};

// Batch function to get multiple market items
export const getMultipleMarketItems = async (publicClient, tokenIds) => {
  try {
    const contract = getReadContract(publicClient);
    const items = await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          return await contract.read.getMarketItem([BigInt(tokenId)]);
        } catch (error) {
          console.error(`Error getting market item ${tokenId}:`, error);
          return null;
        }
      })
    );

    return items
      .filter((item) => item !== null)
      .map((item) => ({
        tokenId: item.tokenId.toString(),
        seller: item.seller,
        owner: item.owner,
        ethPrice: formatEther(item.ethPrice),
        usdcPrice: formatUnits(item.usdcPrice, 6),
        usdtPrice: formatUnits(item.usdtPrice, 6),
        sold: item.sold,
        listedAt: new Date(Number(item.listedAt) * 1000),
        royaltyPercentage: Number(item.royaltyPercentage),
        royaltyRecipient: item.royaltyRecipient,
      }));
  } catch (error) {
    console.error("Error getting multiple market items:", error);
    throw new Error(`Failed to get multiple market items: ${error.message}`);
  }
};
