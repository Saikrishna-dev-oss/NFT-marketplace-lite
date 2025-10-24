import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiExternalLink,
  FiCopy,
  FiShare2,
  FiDollarSign,
  FiUser,
  FiTag,
  FiCalendar,
  FiImage,
  FiHeart,
  FiZap,
  FiStar,
  FiShoppingBag,
  FiTrendingUp,
  FiBookmark,
  FiMaximize2,
  FiCheck,
  FiClock,
  FiShield,
  FiEye,
  FiGift,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { formatAddress } from "../../lib/contracts/utils";
import {
  fetchMetadataFromIPFS,
  validateMetadata,
  getImageUrl,
} from "../../lib/ipfs/pinata";

export default function NFTDetailModal({ isOpen, onClose, nft, onBuy }) {
  const [metadata, setMetadata] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [copied, setCopied] = useState({});
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      if (nft?.tokenURI) {
        try {
          const meta = await fetchMetadataFromIPFS(nft.tokenURI);
          const validatedMeta = validateMetadata(meta);
          setMetadata(validatedMeta);
        } catch (error) {
          console.error("Failed to load metadata:", error);
          setMetadata({
            name: `NFT #${nft.tokenId}`,
            description: "Metadata unavailable - please try refreshing",
            image: "",
            attributes: [],
            error: true,
          });
        }
      }
    };

    if (isOpen && nft) {
      setImageLoading(true);
      setImageError(false);
      setActiveTab("details");
      setCopied({});
      loadMetadata();
    }
  }, [isOpen, nft]);

  const getImageUrlSafe = (imageUri) => {
    return getImageUrl(imageUri);
  };

  const getAllPaymentMethods = () => {
    if (!nft) return [];

    const payments = [];

    if (parseFloat(nft.ethPrice) > 0) {
      payments.push({
        value: parseFloat(nft.ethPrice).toFixed(4),
        symbol: "ETH",
        type: "eth",
        color: "from-purple-500 to-blue-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-300",
        icon: "Ξ",
        usdValue: (parseFloat(nft.ethPrice) * 2000).toFixed(2),
      });
    }
    if (parseFloat(nft.usdcPrice) > 0) {
      payments.push({
        value: parseFloat(nft.usdcPrice).toFixed(2),
        symbol: "USDC",
        type: "usdc",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-300",
        icon: "$",
        usdValue: parseFloat(nft.usdcPrice).toFixed(2),
      });
    }
    if (parseFloat(nft.usdtPrice) > 0) {
      payments.push({
        value: parseFloat(nft.usdtPrice).toFixed(2),
        symbol: "USDT",
        type: "usdt",
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-700 dark:text-green-300",
        icon: "₮",
        usdValue: parseFloat(nft.usdtPrice).toFixed(2),
      });
    }

    return payments;
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [text]: true }));
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [text]: false }));
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareNFT = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata?.name || `NFT #${nft.tokenId}`,
          text: metadata?.description || "Check out this NFT!",
          url: window.location.href,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          copyToClipboard(window.location.href, "Link");
        }
      }
    } else {
      copyToClipboard(window.location.href, "Link");
    }
  };

  const paymentMethods = getAllPaymentMethods();
  const primaryPayment = paymentMethods[0];
  const imageUrl = getImageUrlSafe(metadata?.image);

  if (!isOpen || !nft) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl rounded-3xl max-w-6xl w-full h-full overflow-hidden border border-gray-200/50 dark:border-purple-900/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200/50 dark:border-purple-900/20 bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-cyan-900/10">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {metadata?.name || `NFT #${nft.tokenId}`}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {metadata?.collection || "Unknown Collection"} • #{nft.tokenId}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <motion.button
                onClick={() => setLiked(!liked)}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  liked
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiHeart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              </motion.button>
              <motion.button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  bookmarked
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiBookmark
                  className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`}
                />
              </motion.button>
              <motion.button
                onClick={shareNFT}
                className="p-3 rounded-2xl bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiShare2 className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={onClose}
                className="p-3 rounded-2xl bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 max-h-[calc(95vh-120px)] ">
            {/* Enhanced Image Section */}
            <div className="p-6 lg:p-8 flex flex-col">
              <div className="relative aspect-square bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 rounded-3xl overflow-hidden mb-6 group">
                {imageUrl && !imageError ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-gray-600 dark:text-gray-400 font-medium">
                            Loading image...
                          </p>
                        </div>
                      </div>
                    )}
                    <motion.img
                      src={imageUrl}
                      alt={metadata?.name || `NFT #${nft.tokenId}`}
                      className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.7 }}
                    />

                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <motion.button
                        onClick={() => setFullScreenImage(true)}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white p-3 rounded-2xl shadow-xl"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FiMaximize2 className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <FiImage className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        {imageError ? "Image unavailable" : "Loading image..."}
                      </p>
                      {metadata?.error && (
                        <p className="text-sm text-amber-500 dark:text-amber-400 mt-2">
                          Metadata service temporarily unavailable
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  {nft.sold && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm"
                    >
                      SOLD
                    </motion.span>
                  )}

                  {primaryPayment && parseFloat(primaryPayment.value) > 5 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm flex items-center space-x-1"
                    >
                      <FiStar className="w-4 h-4" />
                      <span>PREMIUM</span>
                    </motion.span>
                  )}
                </div>

                {/* Token ID Badge */}
                <div className="absolute top-4 right-4">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/60 backdrop-blur-xl text-white text-sm font-bold px-4 py-2 rounded-xl"
                  >
                    #{nft.tokenId}
                  </motion.span>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 py-3 px-4 rounded-2xl font-semibold hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 transition-all duration-300 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiEye className="w-5 h-5" />
                  <span>View Count</span>
                </motion.button>
                {imageUrl && (
                  <motion.a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 py-3 px-4 rounded-2xl font-semibold hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 transition-all duration-300 flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiExternalLink className="w-5 h-5" />
                    <span>Full Size</span>
                  </motion.a>
                )}
              </div>
            </div>

            {/* Enhanced Details Section */}
            <div className="p-6 lg:p-8 overflow-y-auto">
              {/* Enhanced Tabs */}
              <div className="flex space-x-2 mb-8 bg-gray-100/80 dark:bg-gray-800/50 rounded-2xl p-1 backdrop-blur-sm">
                {[
                  { key: "details", label: "Details", icon: FiZap },
                  { key: "attributes", label: "Traits", icon: FiTag },
                  { key: "history", label: "History", icon: FiClock },
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Enhanced Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Description */}
                    {metadata?.description && (
                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <FiZap className="w-5 h-5 text-purple-500" />
                          <span>Description</span>
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {metadata.description}
                        </p>
                      </div>
                    )}

                    {/* Collection */}
                    {metadata?.collection && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-purple-700/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <FiStar className="w-5 h-5 text-blue-500" />
                          <span>Collection</span>
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 text-lg font-semibold">
                          {metadata.collection}
                        </p>
                      </div>
                    )}

                    {/* Enhanced Owner/Creator Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                          <span>Owner</span>
                        </h3>
                        <div className="space-y-3">
                          <p className="text-gray-900 dark:text-white font-semibold text-lg">
                            {formatAddress(nft.owner)}
                          </p>
                          <motion.button
                            onClick={() =>
                              copyToClipboard(nft.owner, "Owner address")
                            }
                            className="w-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-2 px-4 rounded-xl font-medium hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-all duration-200 flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {copied[nft.owner] ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                            <span>
                              {copied[nft.owner] ? "Copied!" : "Copy Address"}
                            </span>
                          </motion.button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                          <span>Creator</span>
                        </h3>
                        <div className="space-y-3">
                          <p className="text-gray-900 dark:text-white font-semibold text-lg">
                            {formatAddress(nft.seller)}
                          </p>
                          <motion.button
                            onClick={() =>
                              copyToClipboard(nft.seller, "Creator address")
                            }
                            className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-2 px-4 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-800/40 transition-all duration-200 flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {copied[nft.seller] ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                            <span>
                              {copied[nft.seller] ? "Copied!" : "Copy Address"}
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Royalty Info */}
                    {nft.royaltyPercentage > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          <FiGift className="w-5 h-5 text-yellow-500" />
                          <span>Royalties</span>
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-yellow-700 dark:text-yellow-300 font-semibold">
                            {(nft.royaltyPercentage / 100).toFixed(1)}% royalty
                            to creator
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatAddress(nft.royaltyRecipient)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Timeline */}
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <FiClock className="w-5 h-5 text-gray-500" />
                        <span>Timeline</span>
                      </h3>
                      <div className="space-y-4">
                        {metadata?.created_at && (
                          <div className="flex items-center space-x-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                              <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Created
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(
                                  metadata.created_at
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                        {nft.listedAt && (
                          <div className="flex items-center space-x-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                              <FiTag className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Listed
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(nft.listedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "attributes" && (
                  <motion.div
                    key="attributes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {metadata?.attributes && metadata.attributes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {metadata.attributes.map((attr, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">
                                {attr.trait_type}
                              </p>
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <FiTag className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {attr.value}
                            </p>
                            {attr.rarity && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {attr.rarity}% rarity
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <FiTag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          No Traits Defined
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          This NFT doesn't have any custom attributes or traits
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <FiTrendingUp className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Transaction History
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Detailed transaction history and price analytics coming
                        soon
                      </p>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-purple-700/30">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          🚀 Feature in development - Stay tuned for
                          comprehensive transaction tracking!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Price & Buy Section */}
              {paymentMethods.length > 0 && !nft.sold && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-200/50 dark:border-purple-900/20 pt-8 mt-8"
                >
                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-6 lg:p-8 border border-purple-200/50 dark:border-purple-700/30">
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <FiZap className="w-6 h-6 text-purple-500" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Purchase Options
                        </h3>
                      </div>
                      {paymentMethods.length > 1 && (
                        <p className="text-gray-600 dark:text-gray-400">
                          Choose from {paymentMethods.length} payment methods
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      {paymentMethods.map((payment, index) => (
                        <motion.div
                          key={payment.type}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                            payment.bgColor
                          } border-2 ${
                            index === 0
                              ? "border-purple-300 dark:border-purple-600"
                              : "border-transparent"
                          } hover:scale-105`}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 bg-gradient-to-br ${payment.color} rounded-2xl flex items-center justify-center shadow-lg`}
                            >
                              <span className="text-white font-bold text-xl">
                                {payment.icon}
                              </span>
                            </div>
                            <div>
                              <p
                                className={`text-lg font-bold ${payment.textColor}`}
                              >
                                {payment.symbol}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {index === 0 ? "Primary option" : "Alternative"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${payment.textColor}`}
                            >
                              {payment.value}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ≈ ${payment.usdValue}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Primary Price Highlight */}
                    {primaryPayment && (
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl p-4 mb-6 border border-purple-200/50 dark:border-purple-700/30">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                            <FiDollarSign className="w-5 h-5 text-green-500" />
                            <span>Best Price:</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                              {primaryPayment.value}
                            </span>
                            <span
                              className={`text-xl font-bold ${primaryPayment.textColor}`}
                            >
                              {primaryPayment.symbol}
                            </span>
                          </div>
                        </div>
                        {paymentMethods.length > 1 && (
                          <p className="text-center text-purple-600 dark:text-purple-400 mt-2 text-sm font-medium">
                            +{paymentMethods.length - 1} more payment option
                            {paymentMethods.length > 2 ? "s" : ""} available
                          </p>
                        )}
                      </div>
                    )}

                    {onBuy && (
                      <motion.button
                        onClick={() => {
                          onBuy(nft);
                          onClose();
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiShoppingBag className="w-6 h-6" />
                        <span>
                          Purchase NFT{" "}
                          {paymentMethods.length > 1
                            ? `(${paymentMethods.length} options)`
                            : `for ${primaryPayment.value} ${primaryPayment.symbol}`}
                        </span>
                      </motion.button>
                    )}

                    {/* Security Notice */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/30">
                      <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                        <FiShield className="w-4 h-4" />
                        <p className="text-sm font-medium">
                          Secure transaction protected by smart contract
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sold NFT Message */}
              {nft.sold && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-200/50 dark:border-purple-900/20 pt-8 mt-8"
                >
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 text-center border border-red-200/50 dark:border-red-700/30">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiTag className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      This NFT Has Been Sold
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This digital asset is no longer available for purchase
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Full Screen Image Modal */}
        <AnimatePresence>
          {fullScreenImage && imageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setFullScreenImage(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={imageUrl}
                  alt={metadata?.name || `NFT #${nft.tokenId}`}
                  className="w-full h-full object-contain rounded-2xl"
                />
                <motion.button
                  onClick={() => setFullScreenImage(false)}
                  className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-sm text-white rounded-2xl hover:bg-black/80 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
