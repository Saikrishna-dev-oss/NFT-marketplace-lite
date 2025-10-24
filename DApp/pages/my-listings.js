import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiList,
  FiTag,
  FiDollarSign,
  FiClock,
  FiEye,
  FiEdit3,
  FiX,
  FiTrendingUp,
  FiShoppingBag,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiPlus,
  FiBarChart,
  FiZap,
  FiStar,
  FiActivity,
  FiShield,
  FiAward,
  FiGlobe,
  FiPackage,
  FiSliders,
  FiChevronDown,
  FiArrowUp,
  FiHeart,
  FiBox,
  FiCpu,
  FiGift,
  FiTrendingDown,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import NFTCard from "../components/NFT/NFTCard";
import NFTDetailModal from "../components/NFT/NFTDetailModal";
import StatsCard from "../components/UI/StatsCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";

import {
  fetchMarketItems,
  fetchMyNFTs,
  updateItemPrices,
  resellToken,
  getListingPrice,
} from "../lib/contracts/functions";

export default function MyListings() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNFT, setEditingNFT] = useState(null);
  const [listingPrice, setListingPrice] = useState("0");
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    ethPrice: "",
    usdcPrice: "",
    usdtPrice: "",
  });

  useEffect(() => {
    if (isConnected && publicClient && address) {
      loadMyListings();
      loadListingPrice();
    }
  }, [isConnected, publicClient, address]);

  const loadMyListings = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      console.log("Loading listings for address:", address);

      // Get all market items and user NFTs
      const [marketItems, myNFTs] = await Promise.all([
        fetchMarketItems(publicClient),
        fetchMyNFTs(publicClient),
      ]);

      console.log("Market items:", marketItems);
      console.log("My NFTs:", myNFTs);

      // Filter to get only items where the user is the seller
      const userListings = [];
      const contractAddress =
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase();

      // From market items (active listings)
      marketItems.forEach((item) => {
        if (item.seller.toLowerCase() === address.toLowerCase()) {
          userListings.push({
            ...item,
            isActiveListing: true,
            status: "active",
          });
        }
      });

      // From user NFTs (including sold items)
      myNFTs.forEach((item) => {
        // If it's sold and user was the seller
        if (item.sold && item.seller.toLowerCase() === address.toLowerCase()) {
          // Check if not already in userListings (avoid duplicates)
          const exists = userListings.find(
            (listing) => listing.tokenId === item.tokenId
          );
          if (!exists) {
            userListings.push({
              ...item,
              isActiveListing: false,
              status: "sold",
            });
          }
        }
      });

      console.log("User listings found:", userListings);
      setListings(userListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      toast.error("Failed to load your listings");
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

  const getListingStats = () => {
    const activeListings = listings.filter((item) => !item.sold);
    const soldListings = listings.filter((item) => item.sold);

    const totalValue = activeListings.reduce((acc, item) => {
      const ethPrice = parseFloat(item.ethPrice) || 0;
      const usdcPrice = parseFloat(item.usdcPrice) || 0;
      const usdtPrice = parseFloat(item.usdtPrice) || 0;
      return acc + Math.max(ethPrice, usdcPrice, usdtPrice);
    }, 0);

    const totalSoldValue = soldListings.reduce((acc, item) => {
      const ethPrice = parseFloat(item.ethPrice) || 0;
      const usdcPrice = parseFloat(item.usdcPrice) || 0;
      const usdtPrice = parseFloat(item.usdtPrice) || 0;
      return acc + Math.max(ethPrice, usdcPrice, usdtPrice);
    }, 0);

    const avgSalePrice =
      soldListings.length > 0 ? totalSoldValue / soldListings.length : 0;

    return {
      total: listings.length,
      active: activeListings.length,
      sold: soldListings.length,
      totalValue: totalValue.toFixed(4),
      soldValue: totalSoldValue.toFixed(4),
      avgSalePrice: avgSalePrice.toFixed(4),
    };
  };

  const getPaymentMethodCounts = () => {
    return {
      eth: listings.filter((l) => parseFloat(l.ethPrice) > 0).length,
      usdc: listings.filter((l) => parseFloat(l.usdcPrice) > 0).length,
      usdt: listings.filter((l) => parseFloat(l.usdtPrice) > 0).length,
    };
  };

  const filteredAndSortedListings = listings
    .filter((item) => {
      // Filter by status
      if (filter === "active") return !item.sold;
      if (filter === "sold") return item.sold;
      if (filter === "eth") return parseFloat(item.ethPrice) > 0;
      if (filter === "usdc") return parseFloat(item.usdcPrice) > 0;
      if (filter === "usdt") return parseFloat(item.usdtPrice) > 0;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.tokenId.toString().includes(query) ||
          item.seller.toLowerCase().includes(query) ||
          item.owner.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      const getPriceForSort = (item) => {
        return Math.max(
          parseFloat(item.ethPrice) || 0,
          parseFloat(item.usdcPrice) || 0,
          parseFloat(item.usdtPrice) || 0
        );
      };

      switch (sortBy) {
        case "price-low":
          return getPriceForSort(a) - getPriceForSort(b);
        case "price-high":
          return getPriceForSort(b) - getPriceForSort(a);
        case "oldest":
          return new Date(a.listedAt) - new Date(b.listedAt);
        case "newest":
        default:
          return new Date(b.listedAt) - new Date(a.listedAt);
      }
    });

  const handleRefresh = () => {
    loadMyListings(true);
  };

  const handleViewNFT = (item) => {
    setSelectedNFT(item);
    setShowDetailModal(true);
  };

  const handleEditPrices = (item) => {
    setEditingNFT(item);
    setEditForm({
      ethPrice:
        item.ethPrice && parseFloat(item.ethPrice) > 0 ? item.ethPrice : "",
      usdcPrice:
        item.usdcPrice && parseFloat(item.usdcPrice) > 0 ? item.usdcPrice : "",
      usdtPrice:
        item.usdtPrice && parseFloat(item.usdtPrice) > 0 ? item.usdtPrice : "",
    });
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!walletClient || !editingNFT) return;

    if (!editForm.ethPrice && !editForm.usdcPrice && !editForm.usdtPrice) {
      toast.error("Please set at least one price");
      return;
    }

    try {
      setUpdating(true);

      const prices = {
        ethPrice: editForm.ethPrice || "0",
        usdcPrice: editForm.usdcPrice || "0",
        usdtPrice: editForm.usdtPrice || "0",
      };

      let tx;

      // Check if NFT is currently listed (active) or owned by user
      if (editingNFT.isActiveListing) {
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
        editingNFT.isActiveListing
          ? "Prices updated successfully!"
          : "NFT listed for sale!",
        { id: "update-listing" }
      );

      setShowEditModal(false);
      setEditingNFT(null);
      await loadMyListings();
    } catch (error) {
      console.error("Error updating listing:", error);

      if (
        error.message.includes("user rejected") ||
        error.message.includes("User rejected")
      ) {
        toast.error("Transaction was rejected", { id: "update-listing" });
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction", {
          id: "update-listing",
        });
      } else {
        toast.error("Failed to update listing. Please try again.", {
          id: "update-listing",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const stats = getListingStats();
  const paymentCounts = getPaymentMethodCounts();

  if (!isConnected) {
    return (
      <Layout title="My Listings" subtitle="Manage your NFT listings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FiList className="w-16 h-16 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Please connect your wallet to view and manage your NFT listings
          </p>
          <motion.button
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl"
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
      title="My Listings"
      subtitle="Track performance and manage your NFT marketplace presence"
    >
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-cyan-500/20 rounded-3xl p-6 lg:p-8 mb-8 border border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-400 to-cyan-600 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-2xl"></div>
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <FiBarChart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  My Listings Dashboard
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 mb-4 lg:mb-0 max-w-2xl"
              >
                Monitor your sales performance, manage active listings, and
                optimize your marketplace strategy
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: FiActivity, text: "Live Analytics", color: "blue" },
                { icon: FiShield, text: "Secure Trading", color: "green" },
                { icon: FiAward, text: "Seller Verified", color: "purple" },
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

      {/* Enhanced Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
      >
        <StatsCard
          title="Total Listings"
          value={stats.total.toString()}
          subtitle="All time activity"
          icon={FiList}
          color="blue"
          isLoading={loading}
        />
        <StatsCard
          title="Active Listings"
          value={stats.active.toString()}
          subtitle="Currently for sale"
          icon={FiShoppingBag}
          color="green"
          isLoading={loading}
        />
        <StatsCard
          title="Successfully Sold"
          value={stats.sold.toString()}
          subtitle="Completed transactions"
          icon={FiTrendingUp}
          color="purple"
          isLoading={loading}
        />
        <StatsCard
          title="Active Value"
          value={`${stats.totalValue} ETH`}
          subtitle="Listed inventory worth"
          icon={FiDollarSign}
          color="orange"
          isLoading={loading}
        />
      </motion.div>

      {/* Enhanced Revenue Summary */}
      {parseFloat(stats.soldValue) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 lg:p-8 mb-8 border border-green-200/50 dark:border-green-700/30 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  Sales Performance
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                You've earned{" "}
                <span className="font-bold text-green-600 dark:text-green-400 text-xl">
                  {stats.soldValue} ETH
                </span>{" "}
                from {stats.sold} successful sales
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {((stats.sold / stats.total) * 100).toFixed(1)}% conversion
                    rate
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.active} active listings
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <p className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.avgSalePrice} ETH
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Average sale price
              </p>
              <div className="flex items-center justify-center lg:justify-end space-x-1 text-green-600 dark:text-green-400">
                <FiArrowUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  ≈ ${(parseFloat(stats.avgSalePrice) * 2000).toFixed(0)} USD
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 mb-8 border border-gray-200/50 dark:border-purple-900/20 shadow-xl"
      >
        <div className="flex flex-col space-y-6">
          {/* Enhanced Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search listings by token ID, address, or metadata..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              />
            </div>
          </div>

          {/* Enhanced Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {[
              {
                key: "all",
                label: "All Listings",
                count: stats.total,
                icon: FiList,
                color: "gray",
              },
              {
                key: "active",
                label: "Active",
                count: stats.active,
                icon: FiZap,
                color: "green",
              },
              {
                key: "sold",
                label: "Sold",
                count: stats.sold,
                icon: FiTrendingUp,
                color: "purple",
              },
              {
                key: "eth",
                label: "ETH",
                count: paymentCounts.eth,
                icon: FiDollarSign,
                color: "blue",
              },
              {
                key: "usdc",
                label: "USDC",
                count: paymentCounts.usdc,
                icon: FiDollarSign,
                color: "cyan",
              },
              {
                key: "usdt",
                label: "USDT",
                count: paymentCounts.usdt,
                icon: FiDollarSign,
                color: "emerald",
              },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  filter === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
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
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-4 h-4" />
                <span>Create NFT</span>
              </motion.a>

              <motion.a
                href="/my-nfts"
                className="bg-gray-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPackage className="w-4 h-4" />
                <span>My NFTs</span>
              </motion.a>
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm appearance-none pr-10"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
                <FiRefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
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
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {filteredAndSortedListings.length}
          </span>{" "}
          of <span className="font-semibold">{listings.length}</span> listings
        </p>
        {refreshing && (
          <div className="flex items-center space-x-2 text-blue-500">
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

      {/* Listings Grid */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading your listings...
          </p>
        </motion.div>
      ) : filteredAndSortedListings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            {searchQuery || filter !== "all" ? (
              <FiSearch className="w-16 h-16 text-blue-500 dark:text-blue-400" />
            ) : (
              <FiList className="w-16 h-16 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {searchQuery || filter !== "all"
              ? "No Listings Found"
              : "No Listings Yet"}
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search criteria or filters to find your listings"
              : "You haven't listed any NFTs yet. Create or list your first NFT to start earning!"}
          </p>
          {searchQuery || filter !== "all" ? (
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All Filters
            </motion.button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/create"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Your First NFT</span>
              </motion.a>
              <motion.a
                href="/my-nfts"
                className="bg-gray-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEye className="w-5 h-5" />
                <span>View My NFTs</span>
              </motion.a>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
        >
          {filteredAndSortedListings.map((item, index) => (
            <motion.div
              key={`${item.tokenId}-${item.status}`}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <NFTCard
                item={item}
                isOwner={true}
                showActions={true}
                onView={handleViewNFT}
                onEdit={handleEditPrices}
              />

              {/* Enhanced Listing Status Badge */}
              <motion.div
                className="absolute top-3 left-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                    item.sold
                      ? "bg-green-100/90 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200/50 dark:border-green-700/50"
                      : "bg-blue-100/90 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50"
                  } flex items-center space-x-1`}
                >
                  {item.sold ? (
                    <FiTrendingUp className="w-3 h-3" />
                  ) : (
                    <FiZap className="w-3 h-3" />
                  )}
                  <span>{item.sold ? "Sold" : "Active"}</span>
                </span>
              </motion.div>

              {/* Enhanced Time Listed Badge */}
              <motion.div
                className="absolute bottom-3 right-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 border border-white/10">
                  <FiClock className="w-3 h-3" />
                  <span>{new Date(item.listedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>

              {/* Price Performance Indicator */}
              {item.sold && (
                <motion.div
                  className="absolute top-3 right-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
                    <FiDollarSign className="w-3 h-3" />
                    <span>Sold</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Enhanced Edit/Update Modal */}
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
                    <FiEdit3 className="w-6 h-6 mr-3 text-blue-500" />
                    {editingNFT.isActiveListing
                      ? "Update Listing Prices"
                      : "Create New Listing"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {editingNFT.isActiveListing
                      ? "Modify your current listing prices"
                      : "Set competitive prices for your NFT"}
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
                      className="w-full px-5 py-4 pl-14 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300"
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
              {!editingNFT.isActiveListing && (
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
                        One-time fee to cover blockchain transaction costs and
                        secure listing on the marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={updating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveChanges}
                  disabled={
                    updating ||
                    (!editForm.ethPrice &&
                      !editForm.usdcPrice &&
                      !editForm.usdtPrice)
                  }
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                  whileHover={{ scale: updating ? 1 : 1.02 }}
                  whileTap={{ scale: updating ? 1 : 0.98 }}
                >
                  {updating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiTag className="w-5 h-5" />
                      <span>
                        {editingNFT.isActiveListing
                          ? "Update Listing"
                          : "Create Listing"}
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

      {/* Enhanced Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <div className="flex flex-col space-y-3">
          <motion.a
            href="/create"
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            title="Create New NFT"
          >
            <FiPlus className="w-6 h-6" />
          </motion.a>

          <motion.a
            href="/my-nfts"
            className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            title="View My NFTs"
          >
            <FiPackage className="w-6 h-6" />
          </motion.a>
        </div>
      </div>
    </Layout>
  );
}
