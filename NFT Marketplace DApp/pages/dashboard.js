import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiTrendingUp,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiFilter,
  FiGrid,
  FiList,
  FiSearch,
  FiRefreshCw,
  FiStar,
  FiEye,
  FiZap,
  FiHeart,
  FiBookmark,
  FiArrowUp,
  FiChevronDown,
  FiX,
  FiSliders,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import NFTCard from "../components/NFT/NFTCard";
import NFTDetailModal from "../components/NFT/NFTDetailModal";
import StatsCard from "../components/UI/StatsCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";

import {
  fetchMarketItems,
  getTotalStats,
  createMarketSaleETH,
  createMarketSaleUSDC,
  createMarketSaleUSDT,
} from "../lib/contracts/functions";

export default function Marketplace() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Add these state variables to your marketplace component
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (publicClient) {
      loadMarketplace();
    }
  }, [publicClient]);

  const loadMarketplace = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [items, marketStats] = await Promise.all([
        fetchMarketItems(publicClient),
        getTotalStats(publicClient),
      ]);

      setMarketItems(items);
      setStats(marketStats);
    } catch (error) {
      console.error("Error loading marketplace:", error);
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadMarketplace(true);
  };

  const handleBuyNFT = async (item, paymentMethod = null) => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    // Get available payment methods
    const availablePayments = [];
    if (parseFloat(item.ethPrice) > 0) {
      availablePayments.push({
        type: "ETH",
        price: item.ethPrice,
        symbol: "ETH",
      });
    }
    if (parseFloat(item.usdcPrice) > 0) {
      availablePayments.push({
        type: "USDC",
        price: item.usdcPrice,
        symbol: "USDC",
      });
    }
    if (parseFloat(item.usdtPrice) > 0) {
      availablePayments.push({
        type: "USDT",
        price: item.usdtPrice,
        symbol: "USDT",
      });
    }

    // If multiple payment methods available and none specified, show modal
    if (availablePayments.length > 1 && !paymentMethod) {
      setSelectedPaymentItem(item);
      setShowPaymentModal(true);
      return;
    }

    // Use specified payment method or the only available one
    const payment = paymentMethod || availablePayments[0];

    try {
      setBuying(item.tokenId);
      let tx;

      switch (payment.type) {
        case "ETH":
          tx = await createMarketSaleETH(
            walletClient,
            item.tokenId,
            payment.price
          );
          toast.loading("Processing ETH payment...", { id: "buy-tx" });
          break;
        case "USDC":
          tx = await createMarketSaleUSDC(
            walletClient,
            item.tokenId,
            payment.price
          );
          toast.loading("Processing USDC payment...", { id: "buy-tx" });
          break;
        case "USDT":
          tx = await createMarketSaleUSDT(
            walletClient,
            item.tokenId,
            payment.price
          );
          toast.loading("Processing USDT payment...", { id: "buy-tx" });
          break;
        default:
          throw new Error("Invalid payment method");
      }

      await tx.wait();
      toast.success(`NFT purchased successfully with ${payment.symbol}!`, {
        id: "buy-tx",
      });

      // Close modal and reload marketplace
      setShowPaymentModal(false);
      setSelectedPaymentItem(null);
      await loadMarketplace();
    } catch (error) {
      console.error("Error buying NFT:", error);

      if (
        error.message.includes("user rejected") ||
        error.message.includes("User rejected")
      ) {
        toast.error("Transaction was rejected", { id: "buy-tx" });
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction", { id: "buy-tx" });
      } else {
        toast.error("Failed to purchase NFT", { id: "buy-tx" });
      }
    } finally {
      setBuying(null);
    }
  };

  const handlePaymentSelection = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    handleBuyNFT(selectedPaymentItem, paymentMethod);
  };

  const handleViewNFT = (item) => {
    setSelectedNFT(item);
    setShowDetailModal(true);
  };

  const getHighestPrice = (item) => {
    const ethPrice = parseFloat(item.ethPrice) || 0;
    const usdcPrice = parseFloat(item.usdcPrice) || 0;
    const usdtPrice = parseFloat(item.usdtPrice) || 0;
    return Math.max(ethPrice, usdcPrice, usdtPrice);
  };

  const filteredAndSortedItems = marketItems
    .filter((item) => {
      // Filter by payment token
      if (filter === "eth" && parseFloat(item.ethPrice) === 0) return false;
      if (filter === "usdc" && parseFloat(item.usdcPrice) === 0) return false;
      if (filter === "usdt" && parseFloat(item.usdtPrice) === 0) return false;

      // Filter by price range
      if (priceRange !== "all") {
        const price = getHighestPrice(item);
        switch (priceRange) {
          case "low":
            if (price >= 1) return false;
            break;
          case "mid":
            if (price < 1 || price >= 5) return false;
            break;
          case "high":
            if (price < 5) return false;
            break;
        }
      }

      // Filter by search query - search in metadata too
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.tokenId.includes(searchQuery) ||
          item.seller.toLowerCase().includes(query) ||
          item.owner.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return getHighestPrice(a) - getHighestPrice(b);
        case "price-high":
          return getHighestPrice(b) - getHighestPrice(a);
        case "oldest":
          return new Date(a.listedAt) - new Date(b.listedAt);
        case "newest":
        default:
          return new Date(b.listedAt) - new Date(a.listedAt);
      }
    });

  const getFilterCounts = () => {
    return {
      all: marketItems.length,
      eth: marketItems.filter((item) => parseFloat(item.ethPrice) > 0).length,
      usdc: marketItems.filter((item) => parseFloat(item.usdcPrice) > 0).length,
      usdt: marketItems.filter((item) => parseFloat(item.usdtPrice) > 0).length,
    };
  };

  const counts = getFilterCounts();

  return (
    <Layout
      title="NFT Marketplace"
      subtitle="Discover, collect, and sell extraordinary NFTs"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 rounded-3xl p-8 lg:p-12 mb-8 border border-purple-200/50 dark:border-purple-700/30 backdrop-blur-sm overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-gradient-to-tl from-blue-400 to-cyan-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center space-x-2 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Premium NFT Marketplace
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Discover unique digital assets, connect with talented creators, and
            build your exclusive NFT collection in the most advanced marketplace
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={() => (window.location.href = "/create")}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar className="w-5 h-5" />
              <span>Create Your First NFT</span>
            </motion.button>
            <motion.button
              onClick={() => setSearchQuery("")}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEye className="w-5 h-5" />
              <span>Explore Collection</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
      >
        <StatsCard
          title="Total NFTs"
          value={stats.totalTokens?.toLocaleString() || "0"}
          subtitle="Created on platform"
          icon={FiShoppingBag}
          color="blue"
          isLoading={loading}
        />
        <StatsCard
          title="Items Sold"
          value={stats.totalSold?.toLocaleString() || "0"}
          subtitle="Successfully traded"
          icon={FiTrendingUp}
          color="green"
          isLoading={loading}
        />
        <StatsCard
          title="Active Listings"
          value={stats.totalListed?.toLocaleString() || "0"}
          subtitle="Available to buy"
          icon={FiDollarSign}
          color="purple"
          isLoading={loading}
        />
        <StatsCard
          title="Active Users"
          value={
            marketItems.length > 0
              ? new Set(marketItems.map((item) => item.seller)).size.toString()
              : "0"
          }
          subtitle="Unique sellers"
          icon={FiUsers}
          color="orange"
          isLoading={loading}
        />
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 mb-8 border border-gray-200/50 dark:border-purple-900/20 shadow-xl"
      >
        <div className="flex flex-col space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search by token ID, seller address, name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            {[
              {
                key: "all",
                label: "All Payments",
                count: counts.all,
                icon: FiZap,
              },
              {
                key: "eth",
                label: "ETH",
                count: counts.eth,
                icon: FiDollarSign,
              },
              {
                key: "usdc",
                label: "USDC",
                count: counts.usdc,
                icon: FiDollarSign,
              },
              {
                key: "usdt",
                label: "USDT",
                count: counts.usdt,
                icon: FiDollarSign,
              },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
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

          {/* Advanced Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
            <div className="flex flex-wrap items-center gap-4">
              {/* Price Range Filter */}
              <div className="relative">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm appearance-none pr-10"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Under 1 ETH</option>
                  <option value="mid">1-5 ETH</option>
                  <option value="high">5+ ETH</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm appearance-none pr-10"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
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
            {(searchQuery || filter !== "all" || priceRange !== "all") && (
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
                    <span>Payment: {filter.toUpperCase()}</span>
                    <button
                      onClick={() => setFilter("all")}
                      className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {priceRange !== "all" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-xl text-sm flex items-center space-x-2 border border-green-200/50 dark:border-green-700/50"
                  >
                    <span>Price: {priceRange}</span>
                    <button
                      onClick={() => setPriceRange("all")}
                      className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                <motion.button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setPriceRange("all");
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
            {filteredAndSortedItems.length}
          </span>{" "}
          of <span className="font-semibold">{marketItems.length}</span> NFTs
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
            Loading marketplace...
          </p>
        </motion.div>
      ) : filteredAndSortedItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiShoppingBag className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No NFTs Found
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filter !== "all" || priceRange !== "all"
              ? "Try adjusting your search criteria or filters to discover more NFTs"
              : "No NFTs are currently listed in the marketplace. Be the first to list your digital asset!"}
          </p>
          {searchQuery || filter !== "all" || priceRange !== "all" ? (
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
                setPriceRange("all");
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All Filters
            </motion.button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => (window.location.href = "/create")}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiStar className="w-5 h-5" />
                <span>Create First NFT</span>
              </motion.button>
              <motion.button
                onClick={handleRefresh}
                className="bg-gray-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw className="w-5 h-5" />
                <span>Refresh Data</span>
              </motion.button>
            </div>
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
          {filteredAndSortedItems.map((item, index) => (
            <motion.div
              key={item.tokenId}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <NFTCard
                item={item}
                onBuy={handleBuyNFT}
                onView={handleViewNFT}
                showActions={true}
                isOwner={
                  address && item.seller.toLowerCase() === address.toLowerCase()
                }
                buying={buying}
              />
              {buying === item.tokenId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10"
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      Processing purchase...
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Please confirm in your wallet
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Load More Button */}
      {!loading &&
        filteredAndSortedItems.length > 0 &&
        filteredAndSortedItems.length >= 12 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-10 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 mx-auto shadow-xl hover:shadow-2xl"
            >
              <FiEye className="w-5 h-5" />
              <span>Load More NFTs</span>
            </motion.button>
          </motion.div>
        )}

      {/* Floating Action Buttons for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <div className="flex flex-col space-y-3">
          {/* Scroll to Top */}
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-14 h-14 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl shadow-lg flex items-center justify-center backdrop-blur-sm border border-gray-300/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <FiArrowUp className="w-6 h-6" />
          </motion.button>

          {/* Create NFT */}
          <motion.button
            onClick={() => (window.location.href = "/create")}
            className="w-14 h-14 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl shadow-xl flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <FiStar className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* NFT Detail Modal */}
      <NFTDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNFT(null);
        }}
        nft={selectedNFT}
        onBuy={handleBuyNFT}
      />

      {/* Payment Method Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPaymentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 border border-gray-200/50 dark:border-purple-900/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Choose Payment Method
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Select your preferred payment option
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-4 mb-8">
                {/* ETH Payment Option */}
                {parseFloat(selectedPaymentItem.ethPrice) > 0 && (
                  <motion.button
                    onClick={() =>
                      handlePaymentSelection({
                        type: "ETH",
                        price: selectedPaymentItem.ethPrice,
                        symbol: "ETH",
                      })
                    }
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all duration-300 border-2 border-transparent hover:border-purple-500/30 group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={buying === selectedPaymentItem.tokenId}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <span className="text-white font-bold text-sm">
                          ETH
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          Ethereum
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Native currency
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {selectedPaymentItem.ethPrice} ETH
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ≈ $
                        {(
                          parseFloat(selectedPaymentItem.ethPrice) * 2000
                        ).toFixed(2)}
                      </p>
                    </div>
                  </motion.button>
                )}

                {/* USDC Payment Option */}
                {parseFloat(selectedPaymentItem.usdcPrice) > 0 && (
                  <motion.button
                    onClick={() =>
                      handlePaymentSelection({
                        type: "USDC",
                        price: selectedPaymentItem.usdcPrice,
                        symbol: "USDC",
                      })
                    }
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 transition-all duration-300 border-2 border-transparent hover:border-blue-500/30 group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={buying === selectedPaymentItem.tokenId}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <span className="text-white font-bold text-xs">
                          USDC
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          USD Coin
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Stablecoin
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {selectedPaymentItem.usdcPrice} USDC
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ≈ $
                        {parseFloat(selectedPaymentItem.usdcPrice).toFixed(2)}
                      </p>
                    </div>
                  </motion.button>
                )}

                {/* USDT Payment Option */}
                {parseFloat(selectedPaymentItem.usdtPrice) > 0 && (
                  <motion.button
                    onClick={() =>
                      handlePaymentSelection({
                        type: "USDT",
                        price: selectedPaymentItem.usdtPrice,
                        symbol: "USDT",
                      })
                    }
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 transition-all duration-300 border-2 border-transparent hover:border-green-500/30 group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={buying === selectedPaymentItem.tokenId}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <span className="text-white font-bold text-xs">
                          USDT
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          Tether USD
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Stablecoin
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {selectedPaymentItem.usdtPrice} USDT
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ≈ $
                        {parseFloat(selectedPaymentItem.usdtPrice).toFixed(2)}
                      </p>
                    </div>
                  </motion.button>
                )}
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-700/30">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiZap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                      Payment Security
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
                      Ensure you have sufficient balance and token allowances
                      for your chosen payment method before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <motion.button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
