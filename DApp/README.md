# 🛠 SETUP – NFT Marketplace DApp

Welcome to the **NFT Marketplace DApp**! This guide will help you set up the project from scratch, configure your environment, and run it locally or in production.

---

## 🚀 Getting Started

### 🔧 Prerequisites
Make sure you have the following installed before proceeding:

- **Node.js** v16 or higher  
- **Yarn** or **npm** package manager  
- **MetaMask** (or any compatible Web3 wallet)  
- Local blockchain (**Hardhat** / **Ganache**) or access to a testnet  

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nft-marketplace-dapp
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Copy `.env.local` and update it with your values:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME=NFT Marketplace DApp
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_USDT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### 4. Add Your Contract ABI
Create `lib/contracts/abi.js` and export your contract ABI:

```javascript
export const NFTMarketplaceABI = [
  // Your contract ABI here
];
```

### 5. Start the Development Server
```bash
npm run dev
# or
yarn dev
```

### 6. Open the Application
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### 🛠 Smart Contract Setup
- Deploy your NFT Marketplace contract to your chosen network  
- Update the contract address in `.env.local`  
- Ensure **USDC** and **USDT** token addresses match your network  
- Add your contract ABI to `lib/contracts/abi.js`  

### 📦 IPFS Setup
- Create a [Pinata](https://pinata.cloud) account  
- Generate a **JWT token** in your Pinata dashboard  
- Add the token to your environment variables  

### 🔗 WalletConnect Setup
- Create a project at [WalletConnect Cloud](https://cloud.walletconnect.com)  
- Add your **project ID** to `.env.local`  

---

## 📱 Usage Guide

### 👤 For Users
- **Connect Wallet** → Click *“Connect Wallet”* to link your Web3 wallet  
- **Browse Marketplace** → Explore available NFTs  
- **Buy NFTs** → Purchase using ETH, USDC, or USDT  
- **Create NFTs** → Upload art and mint new NFTs  
- **Manage Collection** → View and manage your owned NFTs  
- **List for Sale** → Set prices and list NFTs for resale  

### 👨‍💻 For Developers
- **Contract Functions** → Located in `lib/contracts/functions.js`  
- **Component Library** → Reusable UI in `components/`  
- **Styling** → Tailwind CSS with animations in `styles/globals.css`  
- **State Management** → React hooks and Context API  

---

## 🎨 Customization

### 🎭 Theming
- Modify `tailwind.config.js` for color schemes  
- Update `styles/globals.css` for animations and effects  
- Customize UI components in `components/`  

### 🧩 Feature Extensions
- Add new pages in `pages/`  
- Extend logic in `lib/contracts/functions.js`  
- Create new UI components in `components/`  

---

## 🧪 Testing & Optimization

Run the following commands during development:

```bash
# Run lint checks
npm run lint

# Build for production
npm run build

# Clear cache and dependencies
npm run clear
```

---

## 🚀 Deployment

### ⚡ Deploying on Vercel (Recommended)
1. Push your code to GitHub  
2. Connect your repo to [Vercel](https://vercel.com)  
3. Add environment variables in the Vercel dashboard  
4. Deploy automatically  

### 🌐 Deploying on Other Platforms
1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy the contents of the `out/` directory to your preferred hosting provider  

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch  
3. Make your changes  
4. Test thoroughly  
5. Submit a pull request  

---


## 🆘 Support
For help and questions:
- Open an issue on GitHub  
- Review the documentation  
- Check the smart contract integration guide  

---

## 🙏 Acknowledgments
- **OpenZeppelin** – Secure smart contract libraries  
- **RainbowKit** – Wallet connection UI  
- **Pinata** – IPFS storage  
- **Tailwind CSS** – Design system  
- **Framer Motion** – Smooth animations  

---

## 📄 License
This project is licensed under the **MIT License**. See the `LICENSE` file for details.  

---