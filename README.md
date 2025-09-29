# NFT Marketplace Lite

A lightweight NFT marketplace built on the Algorand blockchain. Users can mint, list, and trade NFTs such as digital art, certificates, and event tickets. Designed for simplicity, speed, and modular extensibility.

## Overview

This project is part of the AlgoBharat Hack Series #2, organized by the Blockchain Club at Geethanjali College of Engineering and Technology.

**Core Features:**
- Mint NFTs by uploading digital assets
- List NFTs for sale or trade
- Buy and sell NFTs using Algorand smart contracts
- Seamless ownership transfer and payment handling
- Minimalist UI: Upload → Mint → Buy/Sell

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (React or Vanilla JS)
- **Backend:** Algorand Smart Contracts (ASC1)
- **Blockchain:** Algorand TestNet
- **Wallet Integration:** Pera Wallet or AlgoSigner

## Smart Contract Logic

- **Minting:** Creates a unique asset on Algorand with metadata
- **Listing:** Stores NFT details and price in a global state
- **Trading:** Executes atomic transfers of asset and payment
- **Ownership:** Verified via asset holding and smart contract state

## UI Flow

1. **Upload:** User selects a file (image, certificate, ticket)
2. **Mint:** NFT is created and metadata stored on-chain
3. **List:** NFT is listed with price and description
4. **Buy/Sell:** Buyer initiates transaction; smart contract handles transfer

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nft-marketplace-lite.git
   cd nft-marketplace-lite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Algorand wallet and TestNet access:
   - Connect to Pera Wallet or AlgoSigner
   - Fund wallet via TestNet faucet

4. Deploy smart contracts:
   - Use Algorand SDK or Reach to compile and deploy

5. Start the development server:
   ```bash
   npm start
   ```

## Future Enhancements

- IPFS integration for decentralized asset storage
- Role-based access for creators and buyers
- NFT categories and search filters
- Analytics dashboard for marketplace activity

## License

This project is licensed under the MIT License.
