const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Mock token contracts for localhost testing
const MOCK_USDC_DECIMALS = 6;
const MOCK_USDT_DECIMALS = 6;

// Initial supply for mock tokens (1 million tokens)
const INITIAL_SUPPLY_USDC = ethers.parseUnits("1000000", MOCK_USDC_DECIMALS);
const INITIAL_SUPPLY_USDT = ethers.parseUnits("1000000", MOCK_USDT_DECIMALS);

// Marketplace configuration
const MARKETPLACE_CONFIG = {
  name: "MetaverseNFT",
  symbol: "MNFT",
  listingPrice: ethers.parseEther("0.001"), // 0.001 ETH
  platformFeePercentage: 250, // 2.5%
};

async function deployMockUSDC() {
  console.log("\n📄 Deploying Mock USDC...");

  const MockUSDC = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockUSDC.deploy(
    "USD Coin",
    "USDC",
    MOCK_USDC_DECIMALS,
    INITIAL_SUPPLY_USDC
  );
  await mockUSDC.waitForDeployment();

  const address = await mockUSDC.getAddress();
  console.log(`✅ Mock USDC deployed to: ${address}`);
  console.log(`   Name: USD Coin`);
  console.log(`   Symbol: USDC`);
  console.log(`   Decimals: ${MOCK_USDC_DECIMALS}`);
  console.log(
    `   Initial Supply: ${ethers.formatUnits(
      INITIAL_SUPPLY_USDC,
      MOCK_USDC_DECIMALS
    )} USDC`
  );

  return mockUSDC;
}

async function deployMockUSDT() {
  console.log("\n📄 Deploying Mock USDT...");

  const MockUSDT = await ethers.getContractFactory("MockERC20");
  const mockUSDT = await MockUSDT.deploy(
    "Tether USD",
    "USDT",
    MOCK_USDT_DECIMALS,
    INITIAL_SUPPLY_USDT
  );
  await mockUSDT.waitForDeployment();

  const address = await mockUSDT.getAddress();
  console.log(`✅ Mock USDT deployed to: ${address}`);
  console.log(`   Name: Tether USD`);
  console.log(`   Symbol: USDT`);
  console.log(`   Decimals: ${MOCK_USDT_DECIMALS}`);
  console.log(
    `   Initial Supply: ${ethers.formatUnits(
      INITIAL_SUPPLY_USDT,
      MOCK_USDT_DECIMALS
    )} USDT`
  );

  return mockUSDT;
}

async function deployNFTMarketplace(usdcAddress, usdtAddress, feeRecipient) {
  console.log("\n🏪 Deploying NFT Marketplace...");

  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(
    usdcAddress,
    usdtAddress,
    feeRecipient,
    MARKETPLACE_CONFIG.name,
    MARKETPLACE_CONFIG.symbol
  );
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log(`✅ NFT Marketplace deployed to: ${address}`);
  console.log(`   Collection Name: ${MARKETPLACE_CONFIG.name}`);
  console.log(`   Collection Symbol: ${MARKETPLACE_CONFIG.symbol}`);
  console.log(`   USDC Address: ${usdcAddress}`);
  console.log(`   USDT Address: ${usdtAddress}`);
  console.log(`   Fee Recipient: ${feeRecipient}`);

  return marketplace;
}

async function configureMarketplace(marketplace) {
  console.log("\n⚙️  Configuring Marketplace...");

  // Set token-specific listing fees
  console.log(`   Setting token listing fees...`);

  const ethListingFee = ethers.parseEther("0.001"); // 0.001 ETH
  const usdcListingFee = ethers.parseUnits("1", 6); // 1 USDC
  const usdtListingFee = ethers.parseUnits("1", 6); // 1 USDT

  try {
    const txEth = await marketplace.updateTokenListingFee(0, ethListingFee); // ETH = 0
    await txEth.wait();

    const txUsdc = await marketplace.updateTokenListingFee(1, usdcListingFee); // USDC = 1
    await txUsdc.wait();

    const txUsdt = await marketplace.updateTokenListingFee(2, usdtListingFee); // USDT = 2
    await txUsdt.wait();

    console.log(
      `   ✅ ETH listing fee: ${ethers.formatEther(ethListingFee)} ETH`
    );
    console.log(
      `   ✅ USDC listing fee: ${ethers.formatUnits(usdcListingFee, 6)} USDC`
    );
    console.log(
      `   ✅ USDT listing fee: ${ethers.formatUnits(usdtListingFee, 6)} USDT`
    );
  } catch (error) {
    console.log(
      `   ⚠️  Using default listing fees (configuration failed): ${error.message}`
    );
  }
}

async function fundAddresses(mockUSDC, mockUSDT, addresses) {
  console.log("\n💰 Funding addresses with mock tokens...");

  const fundAmount = ethers.parseUnits("10000", 6); // 10,000 tokens each

  for (const address of addresses) {
    try {
      console.log(`   Funding ${address}...`);

      // Transfer USDC
      const txUSDC = await mockUSDC.transfer(address, fundAmount);
      await txUSDC.wait();

      // Transfer USDT
      const txUSDT = await mockUSDT.transfer(address, fundAmount);
      await txUSDT.wait();

      console.log(
        `   ✅ Sent ${ethers.formatUnits(
          fundAmount,
          6
        )} USDC and USDT to ${address}`
      );
    } catch (error) {
      console.log(`   ⚠️  Failed to fund ${address}: ${error.message}`);
    }
  }
}

async function saveDeploymentInfo(marketplace, mockUSDC, mockUSDT, network) {
  console.log("\n💾 Saving deployment information...");

  const marketplaceAddress = await marketplace.getAddress();
  const usdcAddress = await mockUSDC.getAddress();
  const usdtAddress = await mockUSDT.getAddress();

  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      NFTMarketplace: {
        address: marketplaceAddress,
        name: MARKETPLACE_CONFIG.name,
        symbol: MARKETPLACE_CONFIG.symbol,
      },
      MockUSDC: {
        address: usdcAddress,
        symbol: "USDC",
        decimals: MOCK_USDC_DECIMALS,
      },
      MockUSDT: {
        address: usdtAddress,
        symbol: "USDT",
        decimals: MOCK_USDT_DECIMALS,
      },
    },
    configuration: {
      listingPrice: MARKETPLACE_CONFIG.listingPrice.toString(),
      platformFeePercentage: MARKETPLACE_CONFIG.platformFeePercentage,
    },
  };

  try {
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, `localhost.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment info saved to: ${deploymentFile}`);

    // Create contract artifacts for frontend
    const contractAddresses = {
      NFTMarketplace: marketplaceAddress,
      MockUSDC: usdcAddress,
      MockUSDT: usdtAddress,
    };

    const addressesFile = path.join(deploymentsDir, "addresses.json");
    fs.writeFileSync(addressesFile, JSON.stringify(contractAddresses, null, 2));
    console.log(`✅ Contract addresses saved to: ${addressesFile}`);

    // Save ABIs for frontend
    const artifacts = {
      NFTMarketplace: require("../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json"),
      MockERC20: require("../artifacts/contracts/MockERC20.sol/MockERC20.json"),
    };

    const abisFile = path.join(deploymentsDir, "abis.json");
    fs.writeFileSync(abisFile, JSON.stringify(artifacts, null, 2));
    console.log(`✅ Contract ABIs saved to: ${abisFile}`);
  } catch (error) {
    console.log(`⚠️  Failed to save deployment info: ${error.message}`);
  }
}

async function verifyDeployment(marketplace, mockUSDC, mockUSDT) {
  console.log("\n🔍 Verifying deployment...");

  try {
    // Check marketplace configuration
    const listingPrice = await marketplace.getListingPrice();
    const platformFee = await marketplace.platformFeePercentage();
    const feeRecipient = await marketplace.feeRecipient();
    const owner = await marketplace.owner();

    console.log("\n📊 Marketplace Status:");
    console.log(`   Listing Price: ${ethers.formatEther(listingPrice)} ETH`);
    console.log(`   Platform Fee: ${Number(platformFee) / 100}%`);
    console.log(`   Fee Recipient: ${feeRecipient}`);
    console.log(`   Owner: ${owner}`);

    // Check token balances
    const [deployer] = await ethers.getSigners();
    const usdcBalance = await mockUSDC.balanceOf(deployer.address);
    const usdtBalance = await mockUSDT.balanceOf(deployer.address);

    console.log("\n💳 Deployer Token Balances:");
    console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`   USDT: ${ethers.formatUnits(usdtBalance, 6)}`);

    // Check if marketplace is paused
    const isPaused = await marketplace.paused();
    console.log(`\n⏸️  Marketplace Paused: ${isPaused}`);

    console.log("\n✅ Deployment verification completed!");
  } catch (error) {
    console.log(`⚠️  Verification failed: ${error.message}`);
  }
}

async function printUsageInstructions(marketplace, mockUSDC, mockUSDT) {
  const marketplaceAddress = await marketplace.getAddress();
  const usdcAddress = await mockUSDC.getAddress();
  const usdtAddress = await mockUSDT.getAddress();

  console.log("\n" + "=".repeat(80));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(80));

  console.log("\n📝 Contract Addresses:");
  console.log(`   NFT Marketplace: ${marketplaceAddress}`);
  console.log(`   Mock USDC:       ${usdcAddress}`);
  console.log(`   Mock USDT:       ${usdtAddress}`);

  console.log("\n🔧 Next Steps:");
  console.log("   1. Add contract addresses to your frontend environment");
  console.log("   2. Import contract ABIs from deployments/abis.json");
  console.log("   3. Connect your wallet to localhost:8545");
  console.log("   4. Import one of these accounts to MetaMask:");

  // Show first 3 accounts
  const signers = await ethers.getSigners();
  for (let i = 0; i < Math.min(3, signers.length); i++) {
    const balance = await ethers.provider.getBalance(signers[i].address);
    console.log(
      `      Account ${i}: ${signers[i].address} (${ethers.formatEther(
        balance
      )} ETH)`
    );
  }

  console.log("\n💡 Testing Commands:");
  console.log("   npx hardhat console --network localhost");
  console.log("   # Then in console:");
  console.log(
    `   const marketplace = await ethers.getContractAt("NFTMarketplace", "${marketplaceAddress}")`
  );
  console.log(
    `   const usdc = await ethers.getContractAt("MockERC20", "${usdcAddress}")`
  );
  console.log("   await marketplace.getListingPrice()");
  console.log("   await usdc.balanceOf('YOUR_ADDRESS')");

  console.log("\n📱 Frontend Integration:");
  console.log("   - Contract addresses: deployments/addresses.json");
  console.log("   - Contract ABIs: deployments/abis.json");
  console.log("   - Network: localhost:8545 (Chain ID: 31337)");

  console.log("\n⚠️  Important Notes:");
  console.log("   - Mock tokens are for testing only");
  console.log("   - Approve marketplace to spend tokens before purchases");
  console.log("   - Use accounts from Hardhat node for testing");
  console.log("   - Check deployments/localhost.json for full details");

  console.log("\n🧪 Quick Test:");
  console.log("   # Get some test tokens:");
  console.log(`   await usdc.faucet(ethers.parseUnits("1000", 6))`);
  console.log("   # Approve marketplace:");
  console.log(
    `   await usdc.approve("${marketplaceAddress}", ethers.parseUnits("100", 6))`
  );

  console.log("\n" + "=".repeat(80));
}

async function main() {
  console.log("🚀 Starting NFT Marketplace Deployment on Localhost...");
  console.log("=".repeat(60));

  try {
    // Get signers
    const signers = await ethers.getSigners();
    const [deployer, feeRecipient, ...otherSigners] = signers;
    const network = await ethers.provider.getNetwork();

    console.log("\n👤 Deployment Account Info:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Fee Recipient: ${feeRecipient.address}`);
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(
      `   Balance: ${ethers.formatEther(
        await ethers.provider.getBalance(deployer.address)
      )} ETH`
    );
    console.log(`   Available Accounts: ${signers.length}`);

    // Deploy mock tokens
    const mockUSDC = await deployMockUSDC();
    const mockUSDT = await deployMockUSDT();

    // Deploy marketplace
    const marketplace = await deployNFTMarketplace(
      await mockUSDC.getAddress(),
      await mockUSDT.getAddress(),
      feeRecipient.address
    );

    // Configure marketplace
    await configureMarketplace(marketplace);

    // Fund test addresses with mock tokens (first 5 accounts)
    const addressesToFund = [
      deployer.address,
      feeRecipient.address,
      ...otherSigners.slice(0, 3).map((s) => s.address),
    ];
    await fundAddresses(mockUSDC, mockUSDT, addressesToFund);

    // Save deployment information
    await saveDeploymentInfo(marketplace, mockUSDC, mockUSDT, network);

    // Verify deployment
    await verifyDeployment(marketplace, mockUSDC, mockUSDT);

    // Print usage instructions
    await printUsageInstructions(marketplace, mockUSDC, mockUSDT);
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(`   Error: ${error.message}`);
    if (error.reason) {
      console.error(`   Reason: ${error.reason}`);
    }
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Make sure Hardhat node is running: npx hardhat node");
    console.error("   2. Check if contracts compile: npx hardhat compile");
    console.error("   3. Verify network configuration in hardhat.config.js");
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

// Execute deployment
main()
  .then(() => {
    console.log("\n✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
