import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiActivity,
  FiShoppingBag,
  FiTag,
  FiDollarSign,
  FiUser,
  FiClock,
  FiTrendingUp,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiExternalLink,
  FiEye,
  FiArrowRight,
  FiPlus,
  FiEdit,
  FiZap,
  FiStar,
  FiBox,
  FiBarChart,
  FiGlobe,
  FiShield,
  FiAward,
  FiPackage,
  FiSliders,
  FiX,
  FiChevronDown,
  FiImage,
  FiHeart,
  FiCpu,
  FiGift,
  FiLayers,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import {
  fetchMarketItems,
  fetchMyNFTs,
  getTotalStats,
} from "../lib/contracts/functions";
import { fetchMetadataFromIPFS, getImageUrl } from "../lib/ipfs/pinata";

const ACTIVITY_TYPES = {
  LISTED: {
    label: "Listed",
    icon: FiTag,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  SOLD: {
    label: "Sold",
    icon: FiShoppingBag,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    textColor: "text-green-700 dark:text-green-300",
  },
  PRICE_UPDATED: {
    label: "Price Updated",
    icon: FiEdit,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  CREATED: {
    label: "Minted",
    icon: FiPlus,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    textColor: "text-purple-700 dark:text-purple-300",
  },
};

const PAYMENT_TOKENS = {
  ETH: {
    symbol: "ETH",
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700",
    icon: "Ξ",
  },
  USDC: {
    symbol: "USDC",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20",
    icon: "$",
  },
  USDT: {
    symbol: "USDT",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20",
    icon: "$",
  },
};

export default function Activity() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({});

  // Metadata cache to prevent repeated fetches
  const [metadataCache, setMetadataCache] = useState({});
  const [loadingMetadata, setLoadingMetadata] = useState(new Set());

  useEffect(() => {
    if (publicClient) {
      loadActivities();
    }
  }, [publicClient]);

  useEffect(() => {
    filterActivities();
  }, [activities, filter, searchQuery]);

  const loadActivities = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Fetch market data and stats
      const [marketItems, userNFTs, totalStats] = await Promise.all([
        fetchMarketItems(publicClient),
        isConnected && address
          ? fetchMyNFTs(publicClient)
          : Promise.resolve([]),
        getTotalStats(publicClient),
      ]);

      setStats(totalStats);

      // Generate activities from market items and user NFTs
      const generatedActivities = generateActivitiesFromData(
        marketItems,
        userNFTs,
        address
      );

      // Sort by most recent first
      const sortedActivities = generatedActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setActivities(sortedActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
      toast.error("Failed to load activity data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateActivitiesFromData = (marketItems, userNFTs, userAddress) => {
    const activities = [];
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase();

    // Process market items (active listings)
    marketItems.forEach((item) => {
      activities.push({
        id: `listed-${item.tokenId}`,
        type: "LISTED",
        tokenId: item.tokenId,
        user: item.seller,
        timestamp: item.listedAt,
        price: getPrimaryPrice(item),
        nft: {
          tokenId: item.tokenId,
          tokenURI: item.tokenURI,
          seller: item.seller,
          owner: item.owner,
        },
        description: `NFT #${item.tokenId} listed for sale`,
      });
    });

    // Process user NFTs for additional context
    if (userNFTs.length > 0) {
      userNFTs.forEach((item) => {
        // Add sold items
        if (item.sold) {
          activities.push({
            id: `sold-${item.tokenId}`,
            type: "SOLD",
            tokenId: item.tokenId,
            user: item.seller,
            buyer: item.owner,
            timestamp: item.listedAt,
            price: getPrimaryPrice(item),
            nft: {
              tokenId: item.tokenId,
              tokenURI: item.tokenURI,
              seller: item.seller,
              owner: item.owner,
            },
            description: `NFT #${item.tokenId} was sold`,
          });
        }

        // Add created/minted items (for user's own NFTs)
        if (
          userAddress &&
          (item.seller.toLowerCase() === userAddress.toLowerCase() ||
            item.owner.toLowerCase() === userAddress.toLowerCase())
        ) {
          activities.push({
            id: `created-${item.tokenId}`,
            type: "CREATED",
            tokenId: item.tokenId,
            user: item.seller,
            timestamp: item.listedAt,
            nft: {
              tokenId: item.tokenId,
              tokenURI: item.tokenURI,
              seller: item.seller,
              owner: item.owner,
            },
            description: `NFT #${item.tokenId} was minted`,
          });
        }
      });
    }

    // Remove duplicates based on tokenId and type
    const uniqueActivities = activities.filter(
      (activity, index, self) =>
        index ===
        self.findIndex(
          (a) => a.tokenId === activity.tokenId && a.type === activity.type
        )
    );

    return uniqueActivities;
  };

  const getPrimaryPrice = (item) => {
    if (parseFloat(item.ethPrice) > 0) {
      return { amount: item.ethPrice, token: "ETH" };
    }
    if (parseFloat(item.usdcPrice) > 0) {
      return { amount: item.usdcPrice, token: "USDC" };
    }
    if (parseFloat(item.usdtPrice) > 0) {
      return { amount: item.usdtPrice, token: "USDT" };
    }
    return null;
  };

  // Memoized metadata loading function to prevent infinite calls
  const loadNFTMetadata = useCallback(
    async (tokenURI, tokenId) => {
      // Check if already cached
      if (metadataCache[tokenId]) {
        return metadataCache[tokenId];
      }

      // Check if already loading
      if (loadingMetadata.has(tokenId) || !tokenURI) {
        return null;
      }

      // Add to loading set
      setLoadingMetadata((prev) => new Set([...prev, tokenId]));

      try {
        const metadata = await fetchMetadataFromIPFS(tokenURI);

        // Cache the result
        setMetadataCache((prev) => ({
          ...prev,
          [tokenId]: metadata,
        }));

        // Remove from loading set
        setLoadingMetadata((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });

        return metadata;
      } catch (error) {
        console.error(`Error loading metadata for token ${tokenId}:`, error);

        // Cache error result to prevent retries
        setMetadataCache((prev) => ({
          ...prev,
          [tokenId]: null,
        }));

        // Remove from loading set
        setLoadingMetadata((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });

        return null;
      }
    },
    [metadataCache, loadingMetadata]
  );

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type
    if (filter !== "all") {
      filtered = filtered.filter((activity) => activity.type === filter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.tokenId.toString().includes(query) ||
          activity.user.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query)
      );
    }

    setFilteredActivities(filtered);
  };

  const handleRefresh = () => {
    // Clear metadata cache on refresh
    setMetadataCache({});
    setLoadingMetadata(new Set());
    loadActivities(true);
  };

  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const getActivityCounts = () => {
    return {
      all: activities.length,
      LISTED: activities.filter((a) => a.type === "LISTED").length,
      SOLD: activities.filter((a) => a.type === "SOLD").length,
      CREATED: activities.filter((a) => a.type === "CREATED").length,
    };
  };

  const activityCounts = getActivityCounts();

  const ActivityCard = ({ activity, index }) => {
    const [localMetadata, setLocalMetadata] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const activityConfig = ACTIVITY_TYPES[activity.type];
    const paymentConfig = activity.price
      ? PAYMENT_TOKENS[activity.price.token]
      : null;

    // Use effect with proper dependencies to load metadata only once
    useEffect(() => {
      const loadMetadata = async () => {
        if (activity.nft?.tokenURI && activity.tokenId) {
          // Check cache first
          if (metadataCache[activity.tokenId]) {
            setLocalMetadata(metadataCache[activity.tokenId]);
            return;
          }

          // Load if not in cache and not currently loading
          if (!loadingMetadata.has(activity.tokenId)) {
            const metadata = await loadNFTMetadata(
              activity.nft.tokenURI,
              activity.tokenId
            );
            if (metadata) {
              setLocalMetadata(metadata);
            }
          }
        }
      };

      loadMetadata();
    }, [
      activity.nft?.tokenURI,
      activity.tokenId,
      metadataCache,
      loadingMetadata,
      loadNFTMetadata,
    ]);

    const imageUrl = localMetadata?.image
      ? getImageUrl(localMetadata.image)
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-purple-900/20 p-6 hover:shadow-xl transition-all duration-300 group"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-start space-x-4">
          {/* Enhanced NFT Image */}
          <div className="relative w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={localMetadata?.name || `NFT #${activity.tokenId}`}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoading ? "opacity-0 scale-110" : "opacity-100 scale-100"
                } group-hover:scale-105`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <FiImage className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-gray-400 text-xs font-bold">
                    #{activity.tokenId}
                  </span>
                </div>
              </div>
            )}

            {/* Activity Type Badge */}
            <div className="absolute -top-2 -right-2">
              <div
                className={`w-8 h-8 bg-gradient-to-r ${activityConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <activityConfig.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Enhanced Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Activity Type and Timestamp */}
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${activityConfig.bgColor} ${activityConfig.textColor} border border-current/20`}
                  >
                    <activityConfig.icon className="w-4 h-4" />
                    <span>{activityConfig.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>

                {/* NFT Name and Description */}
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate">
                  {localMetadata?.name || `NFT #${activity.tokenId}`}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                  {activity.description}
                </p>

                {/* Enhanced User Info */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
                    <FiUser className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatAddress(activity.user)}
                    </span>
                  </div>

                  {activity.buyer && (
                    <>
                      <FiArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
                        <FiUser className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-700 dark:text-green-300">
                          {formatAddress(activity.buyer)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Price Display */}
              {activity.price && paymentConfig && (
                <div className="text-right flex-shrink-0">
                  <div
                    className={`${paymentConfig.bg} ${paymentConfig.color} px-4 py-3 rounded-2xl font-bold text-lg shadow-lg border border-current/20`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{paymentConfig.icon}</span>
                      <span>
                        {parseFloat(activity.price.amount).toFixed(4)}
                      </span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {paymentConfig.symbol}
                    </div>
                  </div>
                  {activity.price.token === "ETH" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      ≈ ${(parseFloat(activity.price.amount) * 2000).toFixed(0)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Layout
        title="Activity Feed"
        subtitle="Latest marketplace activities and transactions"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading activity feed...
          </p>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Activity Feed"
      subtitle="Track marketplace trends and discover the latest NFT activities"
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
                  <FiActivity className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Live Activity Feed
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 mb-4 lg:mb-0 max-w-2xl"
              >
                Stay updated with real-time marketplace activities, track
                trending NFTs, and discover new opportunities
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: FiBarChart, text: "Real-time Data", color: "blue" },
                {
                  icon: FiShield,
                  text: "Verified Transactions",
                  color: "green",
                },
                { icon: FiAward, text: "Premium Analytics", color: "purple" },
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

      {/* Enhanced Filters and Search */}
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
                placeholder="Search by token ID, address, or description..."
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
                label: "All Activity",
                count: activityCounts.all,
                icon: FiLayers,
                color: "gray",
              },
              {
                key: "LISTED",
                label: "Listed",
                count: activityCounts.LISTED,
                icon: FiTag,
                color: "blue",
              },
              {
                key: "SOLD",
                label: "Sold",
                count: activityCounts.SOLD,
                icon: FiShoppingBag,
                color: "green",
              },
              {
                key: "CREATED",
                label: "Minted",
                count: activityCounts.CREATED,
                icon: FiPlus,
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
              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
                whileHover={{
                  scale: refreshing ? 1 : 1.05,
                  y: refreshing ? 0 : -1,
                }}
                whileTap={{ scale: refreshing ? 1 : 0.95 }}
                animate={refreshing ? { rotate: 360 } : {}}
                transition={
                  refreshing
                    ? { duration: 1, repeat: Infinity, ease: "linear" }
                    : {}
                }
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
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
                    <span>Type: {ACTIVITY_TYPES[filter]?.label || filter}</span>
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
            {filteredActivities.length}
          </span>{" "}
          of <span className="font-semibold">{activities.length}</span>{" "}
          activities
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

      {/* Enhanced Activity Feed */}
      {filteredActivities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            {searchQuery || filter !== "all" ? (
              <FiSearch className="w-16 h-16 text-purple-500 dark:text-purple-400" />
            ) : (
              <FiActivity className="w-16 h-16 text-purple-500 dark:text-purple-400" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {searchQuery || filter !== "all"
              ? "No Activities Found"
              : "No Activity Yet"}
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search criteria or filters to discover activities"
              : "Start creating and trading NFTs to see activity here"}
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
                <FiEye className="w-5 h-5" />
                <span>Browse Marketplace</span>
              </motion.a>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load More Section */}
      {filteredActivities.length > 0 && filteredActivities.length >= 20 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <motion.button
            className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-10 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 mx-auto shadow-xl hover:shadow-2xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiEye className="w-5 h-5" />
            <span>Load More Activities</span>
          </motion.button>
        </motion.div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <div className="flex flex-col space-y-3">
          <motion.button
            onClick={handleRefresh}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            animate={refreshing ? { rotate: 360 } : {}}
          >
            <FiRefreshCw className="w-6 h-6" />
          </motion.button>

          <motion.a
            href="/create"
            className="w-14 h-14 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl shadow-xl flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <FiPlus className="w-6 h-6" />
          </motion.a>
        </div>
      </div>
    </Layout>
  );
}
