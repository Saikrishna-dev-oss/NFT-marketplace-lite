import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiEdit3,
  FiTag,
  FiEye,
  FiFilter,
  FiGrid,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiBarChart,
  FiStar,
  FiZap,
  FiHeart,
  FiPackage,
  FiActivity,
  FiAward,
  FiSearch,
  FiX,
  FiSliders,
  FiArrowRight,
  FiCpu,
  FiGlobe,
  FiShield,
  FiGift,
  FiChevronDown,
  FiLayers,
  FiBox,
  FiImage,
  FiCodesandbox,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import NFTCard from "../components/NFT/NFTCard";
import NFTDetailModal from "../components/NFT/NFTDetailModal";
import StatsCard from "../components/UI/StatsCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";

import {
  fetchMyNFTs,
  resellToken,
  updateItemPrices,
  getListingPrice,
} from "../lib/contracts/functions";

export default function MyNFTs() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingNFT, setEditingNFT] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [listingPrice, setListingPrice] = useState("0");
  const [reselling, setReselling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editForm, setEditForm] = useState({
    ethPrice: "",
    usdcPrice: "",
    usdtPrice: "",
  });

  useEffect(() => {
    if (isConnected && publicClient) {
      loadMyNFTs();
      loadListingPrice();
    }
  }, [isConnected, publicClient]);

  const loadMyNFTs = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      console.log("=== Debug My NFTs ===");
      console.log("User address:", address);
      console.log(
        "Contract address:",
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );
      console.log("Public client:", publicClient);

      if (!address) {
        console.log("No address found");
        return;
      }

      const nfts = await fetchMyNFTs(publicClient, address);
      console.log("Raw NFTs from contract:", nfts);
      console.log("Number of NFTs found:", nfts.length);

      // Debug each NFT
      nfts.forEach((nft, index) => {
        console.log(`NFT ${index}:`, {
          tokenId: nft.tokenId,
          seller: nft.seller,
          owner: nft.owner,
          sold: nft.sold,
          isOwner: nft.owner.toLowerCase() === address?.toLowerCase(),
          isSeller: nft.seller.toLowerCase() === address?.toLowerCase(),
          isListed:
            nft.owner.toLowerCase() ===
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase(),
          ethPrice: nft.ethPrice,
          usdcPrice: nft.usdcPrice,
          usdtPrice: nft.usdtPrice,
        });
      });

      setMyNFTs(nfts);

      if (nfts.length === 0) {
        console.log("No NFTs found for user - this could mean:");
        console.log("1. User hasn't created any NFTs");
        console.log("2. Contract address mismatch");
        console.log("3. fetchMyNFTs function issue");
        console.log("4. User address not matching");
      }
    } catch (error) {
      console.error("Error loading my NFTs:", error);
      toast.error("Failed to load your NFTs. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadListingPrice = async () => {
    try {
      if (publicClient) {
        const price = await getListingPrice(publicClient);
        setListingPrice(price);
      }
    } catch (error) {
      console.error("Error loading listing price:", error);
      setListingPrice("0.001"); // Fallback
    }
  };

  const handleRefresh = () => {
    loadMyNFTs(true);
  };

  const handleViewNFT = (nft) => {
    setSelectedNFT(nft);
    setShowDetailModal(true);
  };

  const handleEditPrices = (nft) => {
    setEditingNFT(nft);
    setEditForm({
      ethPrice:
        nft.ethPrice && parseFloat(nft.ethPrice) > 0 ? nft.ethPrice : "",
      usdcPrice:
        nft.usdcPrice && parseFloat(nft.usdcPrice) > 0 ? nft.usdcPrice : "",
      usdtPrice:
        nft.usdtPrice && parseFloat(nft.usdtPrice) > 0 ? nft.usdtPrice : "",
    });
    setShowEditModal(true);
  };

  const handleResell = (nft) => {
    setEditingNFT(nft);
    setEditForm({
      ethPrice: "",
      usdcPrice: "",
      usdtPrice: "",
    });
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!walletClient || !editingNFT) return;

    if (!editForm.ethPrice && !editForm.usdcPrice && !editForm.usdtPrice) {
      toast.error("Please set at least one price");
      return;
    }

    // Validate price inputs
    const ethPrice = editForm.ethPrice ? parseFloat(editForm.ethPrice) : 0;
    const usdcPrice = editForm.usdcPrice ? parseFloat(editForm.usdcPrice) : 0;
    const usdtPrice = editForm.usdtPrice ? parseFloat(editForm.usdtPrice) : 0;

    if (ethPrice < 0 || usdcPrice < 0 || usdtPrice < 0) {
      toast.error("Prices must be positive numbers");
      return;
    }

    if (ethPrice === 0 && usdcPrice === 0 && usdtPrice === 0) {
      toast.error("At least one price must be greater than 0");
      return;
    }

    try {
      setReselling(true);

      const prices = {
        ethPrice: editForm.ethPrice || "0",
        usdcPrice: editForm.usdcPrice || "0",
        usdtPrice: editForm.usdtPrice || "0",
      };

      let tx;

      // Check if NFT is currently listed or owned by user
      const isListed =
        editingNFT.owner.toLowerCase() ===
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase();

      if (isListed) {
        // Update existing listing
        toast.loading("Updating listing prices...", { id: "update-listing" });
        tx = await updateItemPrices(walletClient, editingNFT.tokenId, prices);
      } else {
        // Create new listing (resell)
        toast.loading("Creating new listing...", { id: "update-listing" });
        tx = await resellToken(walletClient, editingNFT.tokenId, prices);
      }

      toast.loading("Waiting for confirmation...", { id: "update-listing" });
      await tx.wait();

      toast.success(
        isListed ? "Prices updated successfully!" : "NFT listed for sale!",
        { id: "update-listing" }
      );

      setShowEditModal(false);
      setEditingNFT(null);
      await loadMyNFTs();
    } catch (error) {
      console.error("Error updating NFT:", error);

      // Handle specific error types
      if (
        error.message.includes("user rejected") ||
        error.message.includes("User rejected")
      ) {
        toast.error("Transaction was rejected by user", {
          id: "update-listing",
        });
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction", {
          id: "update-listing",
        });
      } else if (error.message.includes("execution reverted")) {
        toast.error("Transaction failed - please check your inputs", {
          id: "update-listing",
        });
      } else {
        toast.error("Failed to update NFT. Please try again.", {
          id: "update-listing",
        });
      }
    } finally {
      setReselling(false);
    }
  };

  const filteredNFTs = myNFTs.filter((nft) => {
    // First apply category filter
    let passesFilter = true;

    if (filter === "listed") {
      passesFilter =
        nft.owner.toLowerCase() ===
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() && !nft.sold;
    } else if (filter === "owned") {
      passesFilter = nft.owner.toLowerCase() === address?.toLowerCase();
    } else if (filter === "sold") {
      passesFilter =
        nft.sold && nft.seller.toLowerCase() === address?.toLowerCase();
    }

    // Then apply search filter
    if (passesFilter && searchQuery) {
      const query = searchQuery.toLowerCase();
      passesFilter =
        nft.tokenId.includes(searchQuery) ||
        nft.seller.toLowerCase().includes(query) ||
        nft.owner.toLowerCase().includes(query);
    }

    return passesFilter;
  });

  const getFilterCounts = () => {
    return {
      all: myNFTs.length,
      owned: myNFTs.filter(
        (nft) => nft.owner.toLowerCase() === address?.toLowerCase()
      ).length,
      listed: myNFTs.filter(
        (nft) =>
          nft.owner.toLowerCase() ===
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() && !nft.sold
      ).length,
      sold: myNFTs.filter(
        (nft) => nft.sold && nft.seller.toLowerCase() === address?.toLowerCase()
      ).length,
    };
  };

  const getPortfolioStats = () => {
    const owned = myNFTs.filter(
      (nft) => nft.owner.toLowerCase() === address?.toLowerCase()
    );
    const listed = myNFTs.filter(
      (nft) =>
        nft.owner.toLowerCase() ===
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() && !nft.sold
    );
    const sold = myNFTs.filter(
      (nft) => nft.sold && nft.seller.toLowerCase() === address?.toLowerCase()
    );

    // Calculate portfolio value (only from listed items)
    const portfolioValue = listed.reduce((total, nft) => {
      const ethPrice = parseFloat(nft.ethPrice) || 0;
      const usdcPrice = parseFloat(nft.usdcPrice) || 0;
      const usdtPrice = parseFloat(nft.usdtPrice) || 0;
      return total + Math.max(ethPrice, usdcPrice, usdtPrice);
    }, 0);

    return {
      owned: owned.length,
      listed: listed.length,
      sold: sold.length,
      portfolioValue: portfolioValue.toFixed(4),
    };
  };

  const counts = getFilterCounts();
  const stats = getPortfolioStats();

  if (!isConnected) {
    return (
      <Layout title="My NFTs" subtitle="Manage your NFT collection">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FiUser className="w-16 h-16 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Please connect your wallet to view and manage your NFT collection
          </p>
          <motion.button
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiZap className="w-5 h-5" />
            <span>Connect Wallet</span>
          </motion.button>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout
      title="My NFTs"
      subtitle="Manage your digital art collection and track your creative journey"
    >
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 rounded-3xl p-6 lg:p-8 mb-8 border border-purple-200/50 dark:border-purple-700/30 backdrop-blur-sm overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-400 to-cyan-600 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-3 mb-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <FiPackage className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  My NFT Collection
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 mb-4 lg:mb-0 max-w-2xl"
              >
                Track your digital assets, manage listings, and monitor your
                creative portfolio performance
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: FiShield, text: "Secure Storage", color: "blue" },
                { icon: FiActivity, text: "Live Tracking", color: "green" },
                { icon: FiAward, text: "Creator Verified", color: "purple" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-3 py-2 rounded-xl border ${
                    feature.color === "blue"
                      ? "border-blue-200/50 dark:border-blue-700/50"
                      : feature.color === "green"
                      ? "border-green-200/50 dark:border-green-700/50"
                      : "border-purple-200/50 dark:border-purple-700/50"
                  }`}
                >
                  <feature.icon
                    className={`w-4 h-4 ${
                      feature.color === "blue"
                        ? "text-blue-500"
                        : feature.color === "green"
                        ? "text-green-500"
                        : "text-purple-500"
                    }`}
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                    {feature.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Portfolio Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
      >
        <StatsCard
          title="Owned NFTs"
          value={stats.owned.toString()}
          subtitle="In your wallet"
          icon={FiUser}
          color="blue"
          isLoading={loading}
        />
        <StatsCard
          title="Active Listings"
          value={stats.listed.toString()}
          subtitle="Currently for sale"
          icon={FiShoppingBag}
          color="green"
          isLoading={loading}
        />
        <StatsCard
          title="Total Sold"
          value={stats.sold.toString()}
          subtitle="Successfully traded"
          icon={FiTrendingUp}
          color="purple"
          isLoading={loading}
        />
        <StatsCard
          title="Portfolio Value"
          value={`${stats.portfolioValue} ETH`}
          subtitle="Listed items value"
          icon={FiDollarSign}
          color="orange"
          isLoading={loading}
        />
      </motion.div>

      {/* Enhanced Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 mb-8 border border-gray-200/50 dark:border-purple-900/20 shadow-xl"
      >
        <div className="flex flex-col space-y-6">
          {/* Enhanced Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search by token ID, address, name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              />
            </div>
          </div>

          {/* Enhanced Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {[
              {
                key: "all",
                label: "All NFTs",
                count: counts.all,
                icon: FiLayers,
                color: "gray",
              },
              {
                key: "owned",
                label: "Owned",
                count: counts.owned,
                icon: FiUser,
                color: "blue",
              },
              {
                key: "listed",
                label: "Listed",
                count: counts.listed,
                icon: FiTag,
                color: "green",
              },
              {
                key: "sold",
                label: "Sold",
                count: counts.sold,
                icon: FiTrendingUp,
                color: "purple",
              },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  filter === tab.key
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                    : "bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/60 border border-gray-200/50 dark:border-gray-700/50"
                }`}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    filter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Enhanced Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <motion.a
                href="/create"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-4 h-4" />
                <span>Create NFT</span>
              </motion.a>

              <motion.a
                href="/"
                className="bg-gray-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiGlobe className="w-4 h-4" />
                <span>Marketplace</span>
              </motion.a>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50">
                <motion.button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiGrid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiList className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 disabled:opacity-50 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={refreshing ? { rotate: 360 } : {}}
                transition={
                  refreshing
                    ? { duration: 1, repeat: Infinity, ease: "linear" }
                    : {}
                }
              >
                <FiRefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
              </motion.button>
            </div>
          </div>

          {/* Active Filters Display */}
          <AnimatePresence>
            {(searchQuery || filter !== "all") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/30"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <FiSliders className="w-4 h-4" />
                  <span>Active filters:</span>
                </span>

                {searchQuery && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-xl text-sm flex items-center space-x-2 border border-blue-200/50 dark:border-blue-700/50"
                  >
                    <span>Search: "{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filter !== "all" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-300 px-3 py-1.5 rounded-xl text-sm flex items-center space-x-2 border border-purple-200/50 dark:border-purple-700/50"
                  >
                    <span>Filter: {filter}</span>
                    <button
                      onClick={() => setFilter("all")}
                      className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                <motion.button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiX className="w-3 h-3" />
                  <span>Clear all</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Showing{" "}
          <span className="text-purple-600 dark:text-purple-400 font-semibold">
            {filteredNFTs.length}
          </span>{" "}
          of <span className="font-semibold">{myNFTs.length}</span> NFTs
        </p>
        {refreshing && (
          <div className="flex items-center space-x-2 text-purple-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FiRefreshCw className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        )}
      </div>

      {/* NFT Grid */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading your NFTs...
          </p>
        </motion.div>
      ) : filteredNFTs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            {searchQuery || filter !== "all" ? (
              <FiSearch className="w-16 h-16 text-purple-500 dark:text-purple-400" />
            ) : (
              <FiImage className="w-16 h-16 text-purple-500 dark:text-purple-400" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {searchQuery || filter !== "all"
              ? "No NFTs Found"
              : filter === "all"
              ? "No NFTs in Collection"
              : `No ${filter} NFTs`}
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search criteria or filters to discover your NFTs"
              : filter === "all"
              ? "You don't own any NFTs yet. Start by creating or buying your first digital asset!"
              : `You don't have any ${filter} NFTs at the moment.`}
          </p>
          {searchQuery || filter !== "all" ? (
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All Filters
            </motion.button>
          ) : (
            filter === "all" && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/create"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Create Your First NFT</span>
                </motion.a>
                <motion.a
                  href="/"
                  className="bg-gray-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiGlobe className="w-5 h-5" />
                  <span>Browse Marketplace</span>
                </motion.a>
              </div>
            )
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {filteredNFTs.map((nft, index) => {
            const isOwned = nft.owner.toLowerCase() === address?.toLowerCase();
            const isListed =
              nft.owner.toLowerCase() ===
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() &&
              !nft.sold;

            return (
              <motion.div
                key={`${nft.tokenId}-${nft.seller}-${nft.owner}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <NFTCard
                  item={nft}
                  isOwner={true}
                  showActions={true}
                  onView={handleViewNFT}
                  onEdit={isListed ? handleEditPrices : handleResell}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Enhanced Edit/Resell Modal */}
      <AnimatePresence>
        {showEditModal && editingNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl rounded-3xl max-w-lg w-full p-8 border border-gray-200/50 dark:border-purple-900/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <FiTag className="w-6 h-6 mr-3 text-purple-500" />
                    {editingNFT.owner.toLowerCase() ===
                    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase()
                      ? "Edit Listing Prices"
                      : "List NFT for Sale"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {editingNFT.owner.toLowerCase() ===
                    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase()
                      ? "Update your NFT pricing across multiple currencies"
                      : "Set competitive prices to attract buyers"}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-6 mb-8">
                {/* ETH Price */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">ETH</span>
                    </div>
                    Ethereum (ETH)
                  </label>
                  <motion.div className="relative">
                    <motion.input
                      type="number"
                      value={editForm.ethPrice}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          ethPrice: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="w-full px-5 py-4 pl-14 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                      Ξ
                    </div>
                  </motion.div>
                  {editForm.ethPrice && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      ≈ ${(parseFloat(editForm.ethPrice) * 2000).toFixed(2)} USD
                    </p>
                  )}
                </div>

                {/* USDC Price */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">USD</span>
                    </div>
                    USD Coin (USDC)
                  </label>
                  <motion.div className="relative">
                    <motion.input
                      type="number"
                      value={editForm.usdcPrice}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          usdcPrice: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-5 py-4 pl-14 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 font-semibold">
                      $
                    </div>
                  </motion.div>
                </div>

                {/* USDT Price */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">USD</span>
                    </div>
                    Tether (USDT)
                  </label>
                  <motion.div className="relative">
                    <motion.input
                      type="number"
                      value={editForm.usdtPrice}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          usdtPrice: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-5 py-4 pl-14 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 font-semibold">
                      $
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Listing Fee Info */}
              {editingNFT.owner.toLowerCase() !==
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FiZap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Listing Fee: {listingPrice} ETH
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300 leading-relaxed">
                        This one-time fee covers blockchain transaction costs
                        and ensures your NFT is securely listed on the
                        marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={reselling}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveChanges}
                  disabled={
                    reselling ||
                    (!editForm.ethPrice &&
                      !editForm.usdcPrice &&
                      !editForm.usdtPrice)
                  }
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                  whileHover={{ scale: reselling ? 1 : 1.02 }}
                  whileTap={{ scale: reselling ? 1 : 0.98 }}
                >
                  {reselling ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiTag className="w-5 h-5" />
                      <span>
                        {editingNFT.owner.toLowerCase() ===
                        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase()
                          ? "Update Listing"
                          : "List for Sale"}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NFT Detail Modal */}
      <NFTDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNFT(null);
        }}
        nft={selectedNFT}
      />

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <motion.a
          href="/create"
          className="w-14 h-14 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl shadow-xl flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <FiPlus className="w-6 h-6" />
        </motion.a>
      </div>
    </Layout>
  );
}
