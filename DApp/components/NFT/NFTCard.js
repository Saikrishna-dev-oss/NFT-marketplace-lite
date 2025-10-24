import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiShare2,
  FiMoreVertical,
  FiEye,
  FiTag,
  FiDollarSign,
  FiClock,
  FiUser,
  FiImage,
  FiShoppingBag,
  FiStar,
  FiZap,
  FiTrendingUp,
  FiX,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiBookmark,
} from "react-icons/fi";
import { formatAddress } from "../../lib/contracts/utils";
import {
  fetchMetadataFromIPFS,
  validateMetadata,
  getImageUrl,
} from "../../lib/ipfs/pinata";

export default function NFTCard({
  item,
  onBuy,
  onView,
  onEdit,
  showActions = true,
  isOwner = false,
  buying = null,
}) {
  const [metadata, setMetadata] = useState({
    name: `NFT #${item.tokenId}`,
    description: "",
    image: "",
    attributes: [],
    collection: "Loading...",
  });
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!item.tokenURI) {
        // If no tokenURI, set basic metadata
        setMetadata({
          name: `NFT #${item.tokenId}`,
          description: "No metadata available",
          image: "",
          attributes: [],
          collection: "Unknown Collection",
        });
        setMetadataLoading(false);
        return;
      }

      try {
        setMetadataLoading(true);
        console.log(
          `Loading metadata for token ${item.tokenId} from:`,
          item.tokenURI
        );

        const meta = await fetchMetadataFromIPFS(item.tokenURI);
        const validatedMeta = validateMetadata(meta);

        console.log(
          `Loaded metadata for token ${item.tokenId}:`,
          validatedMeta
        );
        setMetadata(validatedMeta);

        // If metadata has error flag, show warning in console
        if (validatedMeta.error) {
          console.warn(
            `Metadata for token ${item.tokenId} loaded with fallback data`
          );
        }
      } catch (error) {
        console.error(
          `Failed to load metadata for token ${item.tokenId}:`,
          error
        );

        // Set fallback metadata
        setMetadata({
          name: `NFT #${item.tokenId}`,
          description: "Metadata unavailable - please try refreshing",
          image: "",
          attributes: [],
          collection: "Unknown Collection",
          error: true,
        });
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, [item.tokenURI, item.tokenId]);

  // Get all available payment methods
  const getPaymentMethods = () => {
    const payments = [];

    if (parseFloat(item.ethPrice) > 0) {
      payments.push({
        type: "ETH",
        price: parseFloat(item.ethPrice).toFixed(4),
        symbol: "ETH",
        color: "from-purple-500 to-blue-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-300",
        borderColor: "border-purple-200 dark:border-purple-700",
        icon: "Ξ",
      });
    }
    if (parseFloat(item.usdcPrice) > 0) {
      payments.push({
        type: "USDC",
        price: parseFloat(item.usdcPrice).toFixed(2),
        symbol: "USDC",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-300",
        borderColor: "border-blue-200 dark:border-blue-700",
        icon: "$",
      });
    }
    if (parseFloat(item.usdtPrice) > 0) {
      payments.push({
        type: "USDT",
        price: parseFloat(item.usdtPrice).toFixed(2),
        symbol: "USDT",
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-700 dark:text-green-300",
        borderColor: "border-green-200 dark:border-green-700",
        icon: "₮",
      });
    }

    return payments;
  };

  const getPrimaryPrice = () => {
    const payments = getPaymentMethods();
    return payments.length > 0 ? payments[0] : null;
  };

  const getImageUrlSafe = (imageUri) => {
    return getImageUrl(imageUri);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleCopyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const payments = getPaymentMethods();
  const primaryPrice = getPrimaryPrice();
  const imageUrl = getImageUrlSafe(metadata?.image);
  const isCurrentlyBuying = buying === item.tokenId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200/50 dark:border-purple-900/20 relative"
    >
      {/* Premium glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isCurrentlyBuying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 text-center shadow-2xl"
              >
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">
                  Processing Purchase
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Please confirm in your wallet
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-cyan-900/30">
          {imageUrl && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Loading image...
                    </p>
                  </div>
                </div>
              )}
              <motion.img
                src={imageUrl}
                alt={metadata?.name || `NFT #${item.tokenId}`}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                initial={{ scale: 1.1 }}
                animate={{ scale: imageLoading ? 1.1 : 1 }}
                transition={{ duration: 0.7 }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FiImage className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metadataLoading
                    ? "Loading..."
                    : imageError
                    ? "Image unavailable"
                    : "No image available"}
                </p>
                {metadata?.error && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 px-2">
                    Metadata service temporarily unavailable
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Overlay Actions */}
          <motion.div
            className="absolute top-4 right-4 flex flex-col space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0.7, x: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                isLiked
                  ? "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiHeart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </motion.button>

            <motion.button
              className="p-3 rounded-2xl bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: metadata?.name || `NFT #${item.tokenId}`,
                    text: metadata?.description || "Check out this NFT!",
                    url: window.location.href,
                  });
                }
              }}
            >
              <FiShare2 className="w-5 h-5" />
            </motion.button>

            {showActions && (
              <div className="relative">
                <motion.button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-3 rounded-2xl bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiMoreVertical className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="absolute right-0 top-14 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 min-w-[160px] z-10"
                    >
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onView?.(item);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => handleCopyAddress(item.seller)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
                      >
                        {copied ? (
                          <FiCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <FiCopy className="w-4 h-4" />
                        )}
                        <span>{copied ? "Copied!" : "Copy Address"}</span>
                      </button>
                      {isOwner && onEdit && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEdit?.(item);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
                        >
                          <FiTag className="w-4 h-4" />
                          <span>Edit Listing</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Enhanced Status Badges */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            {item.sold && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm"
              >
                SOLD
              </motion.span>
            )}

            {payments.length > 1 && !item.sold && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm"
              >
                {payments.length} PAYMENT OPTIONS
              </motion.span>
            )}

            {isOwner && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm flex items-center space-x-1"
              >
                <FiStar className="w-3 h-3" />
                <span>OWNED</span>
              </motion.span>
            )}
          </div>

          {/* Token ID Badge */}
          <div className="absolute bottom-4 left-4">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 backdrop-blur-xl text-white text-sm font-bold px-3 py-1.5 rounded-xl"
            >
              #{item.tokenId}
            </motion.span>
          </div>

          {/* Trending Badge */}
          {primaryPrice && parseFloat(primaryPrice.price) > 1 && (
            <div className="absolute bottom-4 right-4">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm flex items-center space-x-1"
              >
                <FiTrendingUp className="w-3 h-3" />
                <span>PREMIUM</span>
              </motion.span>
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <div className="p-6">
          {/* Title and Collection */}
          <div className="mb-4">
            <motion.h3
              className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
              title={metadata?.name || `NFT #${item.tokenId}`}
              whileHover={{ scale: 1.02 }}
            >
              {metadata?.name || `NFT #${item.tokenId}`}
            </motion.h3>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium"
              title={metadata?.collection || "Unnamed Collection"}
            >
              {metadata?.collection || "Unnamed Collection"}
            </p>
          </div>

          {/* Description */}
          {metadata?.description && (
            <div className="mb-4">
              <p
                className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed"
                title={metadata.description}
              >
                {metadata.description}
              </p>
            </div>
          )}

          {/* Enhanced Attributes Preview */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {metadata.attributes.slice(0, 3).map((attr, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-700/50"
                    title={`${attr.trait_type}: ${attr.value}`}
                  >
                    {attr.trait_type}
                  </motion.span>
                ))}
                {metadata.attributes.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1">
                    +{metadata.attributes.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Creator/Owner Section */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {isOwner ? "Owner" : "Creator"}
              </p>
              <div className="flex items-center space-x-3 mt-1">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
                <motion.button
                  onClick={() =>
                    handleCopyAddress(isOwner ? item.owner : item.seller)
                  }
                  className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center space-x-1"
                  title={isOwner ? item.owner : item.seller}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>
                    {formatAddress(isOwner ? item.owner : item.seller)}
                  </span>
                  {copied ? (
                    <FiCheck className="w-3 h-3 text-green-500" />
                  ) : (
                    <FiCopy className="w-3 h-3" />
                  )}
                </motion.button>
              </div>
            </div>

            {item.royaltyPercentage > 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Royalty
                </p>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {(item.royaltyPercentage / 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Payment Methods Display */}
          {payments.length > 0 && !item.sold && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <FiZap className="w-4 h-4 text-purple-500" />
                  <span>Payment Options</span>
                </p>
                {payments.length > 1 && (
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                    {payments.length} options
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${
                      payment.bgColor
                    } ${payment.borderColor} border ${
                      index === 0
                        ? "ring-2 ring-blue-300/50 dark:ring-blue-600/50"
                        : ""
                    } hover:scale-105`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${payment.color} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-white font-bold text-lg">
                          {payment.icon}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-sm font-bold ${payment.textColor}`}
                        >
                          {payment.symbol}
                        </span>
                        {index === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Primary
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${payment.textColor}`}
                      >
                        {payment.price}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ≈ $
                        {(
                          parseFloat(payment.price) *
                          (payment.type === "ETH" ? 2000 : 1)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Enhanced Primary Price Highlight */}
                {primaryPrice && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                        <FiDollarSign className="w-4 h-4 text-green-500" />
                        <span>Starting from:</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {primaryPrice.price}
                        </span>
                        <span
                          className={`text-lg font-bold ${primaryPrice.textColor}`}
                        >
                          {primaryPrice.symbol}
                        </span>
                      </div>
                    </div>
                    {payments.length > 1 && (
                      <p className="text-xs text-center text-purple-600 dark:text-purple-400 mt-2 font-medium">
                        +{payments.length - 1} more payment option
                        {payments.length > 2 ? "s" : ""} available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No price display for sold items */}
          {(payments.length === 0 || item.sold) && (
            <div className="mb-6 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl text-center">
              <FiTag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {item.sold ? "This NFT has been sold" : "Not currently listed"}
              </p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Enhanced Buy Button */}
            {payments.length > 0 && !item.sold && !isOwner && onBuy && (
              <motion.button
                onClick={() => onBuy(item)}
                disabled={isCurrentlyBuying}
                className="flex-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white py-3.5 rounded-2xl font-bold hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCurrentlyBuying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiShoppingBag className="w-5 h-5" />
                    <span>
                      {payments.length > 1
                        ? `Buy `
                        : `Buy with ${payments[0]?.symbol || "N/A"}`}
                    </span>
                  </>
                )}
              </motion.button>
            )}

            {/* Enhanced View Button */}
            {onView && (
              <motion.button
                onClick={() => onView(item)}
                className="px-6 py-3.5 bg-gray-100/80 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600/60 transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiEye className="w-5 h-5" />
                <span className="hidden sm:inline">View</span>
              </motion.button>
            )}

            {/* Enhanced Edit Button for Owner */}
            {isOwner && onEdit && (
              <motion.button
                onClick={() => onEdit(item)}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3.5 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiTag className="w-5 h-5" />
                <span>{item.sold ? "ReSale" : "Edit Listing"}</span>
              </motion.button>
            )}
          </div>

          {/* Enhanced Listed Time */}
          {item.listedAt && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FiClock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">
                    Listed {new Date(item.listedAt).toLocaleDateString()}
                  </span>
                </div>
                {metadata?.created_at && (
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <FiStar className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span
                      className="font-medium"
                      title={`Created: ${new Date(
                        metadata.created_at
                      ).toLocaleString()}`}
                    >
                      Created{" "}
                      {new Date(metadata.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Metadata Loading State */}
          {metadataLoading && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center justify-center space-x-3 text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Loading metadata...</span>
              </div>
            </div>
          )}

          {/* Enhanced Error State */}
          {metadata?.error && !metadataLoading && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-3">
                <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiZap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-medium">
                  Some metadata may be temporarily unavailable
                </p>
              </div>
            </div>
          )}

          {/* Premium Features Badge */}
          {primaryPrice && parseFloat(primaryPrice.price) > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400">
                <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <FiStar className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">
                  Premium NFT
                </span>
              </div>
            </div>
          )}

          {/* Rarity Indicator */}
          {metadata?.attributes && metadata.attributes.length > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <FiZap className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">
                  Rich Metadata
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside handler for menu */}
      {showMenu && (
        <div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />
      )}
    </motion.div>
  );
}
