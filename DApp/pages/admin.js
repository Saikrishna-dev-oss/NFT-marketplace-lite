import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiShield,
  FiSettings,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiPause,
  FiPlay,
  FiTrash2,
  FiEdit,
  FiEye,
  FiClock,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiSave,
  FiX,
  FiCheck,
  FiInfo,
  FiZap,
  FiCpu,
  FiBarChart,
  FiGlobe,
  FiLayers,
  FiPackage,
  FiActivity,
  FiStar,
  FiHeart,
  FiBox,
  FiGift,
  FiTrendingUp,
  FiAward,
  FiPercent,
  FiUser,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import LoadingSpinner from "../components/UI/LoadingSpinner";

import {
  // Admin functions
  updateListingPrice,
  updatePlatformFee,
  updateFeeRecipient,
  updateTokenListingFee,
  setUserBlacklisted,
  setTokenBlacklisted,
  pauseContract,
  unpauseContract,
  initiateEmergencyWithdraw,
  cancelEmergencyWithdraw,
  emergencyWithdrawETH,
  emergencyWithdrawToken,

  // View functions
  getListingPrice,
  getPlatformFeePercentage,
  getFeeRecipient,
  getTokenListingFee,
  isUserBlacklisted,
  isTokenBlacklisted,
  getEmergencyWithdrawStatus,
  getContractConstants,
  getContractAddresses,
  getOwner,
  isPaused,
  getTotalStats,
} from "../lib/contracts/functions";

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Contract state
  const [contractOwner, setContractOwner] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contractPaused, setContractPaused] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState({});
  const [contractStats, setContractStats] = useState({});

  // Settings state
  const [settings, setSettings] = useState({
    listingPrice: "",
    platformFee: "",
    feeRecipient: "",
    ethListingFee: "",
    usdcListingFee: "",
    usdtListingFee: "",
  });

  // Form states
  const [activeTab, setActiveTab] = useState("overview");
  const [formLoading, setFormLoading] = useState(false);
  const [blacklistForm, setBlacklistForm] = useState({
    userAddress: "",
    tokenId: "",
    action: "blacklist",
  });

  // Modals
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState("");

  useEffect(() => {
    if (isConnected && publicClient) {
      checkAdminAccess();
      loadContractData();
    }
  }, [isConnected, publicClient, address]);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const owner = await getOwner(publicClient);
      setContractOwner(owner);

      const isOwner = address && owner.toLowerCase() === address.toLowerCase();
      setIsAdmin(isOwner);

      if (!isOwner) {
        toast.error("Access denied: Admin privileges required");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async () => {
    try {
      const [
        listingPrice,
        platformFee,
        feeRecipient,
        ethFee,
        usdcFee,
        usdtFee,
        paused,
        emergencyStatus,
        stats,
      ] = await Promise.all([
        getListingPrice(publicClient),
        getPlatformFeePercentage(publicClient),
        getFeeRecipient(publicClient),
        getTokenListingFee(publicClient, 0), // ETH
        getTokenListingFee(publicClient, 1), // USDC
        getTokenListingFee(publicClient, 2), // USDT
        isPaused(publicClient),
        getEmergencyWithdrawStatus(publicClient),
        getTotalStats(publicClient),
      ]);

      setSettings({
        listingPrice,
        platformFee: platformFee.toString(),
        feeRecipient,
        ethListingFee: ethFee,
        usdcListingFee: usdcFee,
        usdtListingFee: usdtFee,
      });

      setContractPaused(paused);
      setEmergencyStatus(emergencyStatus);
      setContractStats(stats);
    } catch (error) {
      console.error("Error loading contract data:", error);
      toast.error("Failed to load contract data");
    }
  };

  const handleUpdateListingPrice = async () => {
    if (!walletClient || !settings.listingPrice) return;

    try {
      setFormLoading(true);
      toast.loading("Updating listing price...", {
        id: "update-listing-price",
      });

      const tx = await updateListingPrice(walletClient, settings.listingPrice);
      await tx.wait();

      toast.success("Listing price updated successfully!", {
        id: "update-listing-price",
      });
      await loadContractData();
    } catch (error) {
      console.error("Error updating listing price:", error);
      toast.error("Failed to update listing price", {
        id: "update-listing-price",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePlatformFee = async () => {
    if (!walletClient || !settings.platformFee) return;

    try {
      setFormLoading(true);
      toast.loading("Updating platform fee...", { id: "update-platform-fee" });

      const tx = await updatePlatformFee(
        walletClient,
        parseInt(settings.platformFee)
      );
      await tx.wait();

      toast.success("Platform fee updated successfully!", {
        id: "update-platform-fee",
      });
      await loadContractData();
    } catch (error) {
      console.error("Error updating platform fee:", error);
      toast.error("Failed to update platform fee", {
        id: "update-platform-fee",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFeeRecipient = async () => {
    if (!walletClient || !settings.feeRecipient) return;

    try {
      setFormLoading(true);
      toast.loading("Updating fee recipient...", {
        id: "update-fee-recipient",
      });

      const tx = await updateFeeRecipient(walletClient, settings.feeRecipient);
      await tx.wait();

      toast.success("Fee recipient updated successfully!", {
        id: "update-fee-recipient",
      });
      await loadContractData();
    } catch (error) {
      console.error("Error updating fee recipient:", error);
      toast.error("Failed to update fee recipient", {
        id: "update-fee-recipient",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTokenListingFee = async (tokenType) => {
    if (!walletClient) return;

    const fees = {
      0: settings.ethListingFee,
      1: settings.usdcListingFee,
      2: settings.usdtListingFee,
    };

    const fee = fees[tokenType];
    if (!fee) return;

    try {
      setFormLoading(true);
      const tokenNames = { 0: "ETH", 1: "USDC", 2: "USDT" };
      toast.loading(`Updating ${tokenNames[tokenType]} listing fee...`, {
        id: "update-token-fee",
      });

      const tx = await updateTokenListingFee(walletClient, tokenType, fee);
      await tx.wait();

      toast.success(
        `${tokenNames[tokenType]} listing fee updated successfully!`,
        { id: "update-token-fee" }
      );
      await loadContractData();
    } catch (error) {
      console.error("Error updating token listing fee:", error);
      toast.error("Failed to update token listing fee", {
        id: "update-token-fee",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleBlacklistUser = async () => {
    if (!walletClient || !blacklistForm.userAddress) return;

    try {
      setFormLoading(true);
      const isBlacklisting = blacklistForm.action === "blacklist";
      toast.loading(
        `${isBlacklisting ? "Blacklisting" : "Unblacklisting"} user...`,
        { id: "blacklist-user" }
      );

      const tx = await setUserBlacklisted(
        walletClient,
        blacklistForm.userAddress,
        isBlacklisting
      );
      await tx.wait();

      toast.success(
        `User ${
          isBlacklisting ? "blacklisted" : "unblacklisted"
        } successfully!`,
        { id: "blacklist-user" }
      );
      setBlacklistForm({ ...blacklistForm, userAddress: "" });
    } catch (error) {
      console.error("Error updating user blacklist:", error);
      toast.error("Failed to update user blacklist", { id: "blacklist-user" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleBlacklistToken = async () => {
    if (!walletClient || !blacklistForm.tokenId) return;

    try {
      setFormLoading(true);
      const isBlacklisting = blacklistForm.action === "blacklist";
      toast.loading(
        `${isBlacklisting ? "Blacklisting" : "Unblacklisting"} token...`,
        { id: "blacklist-token" }
      );

      const tx = await setTokenBlacklisted(
        walletClient,
        blacklistForm.tokenId,
        isBlacklisting
      );
      await tx.wait();

      toast.success(
        `Token ${
          isBlacklisting ? "blacklisted" : "unblacklisted"
        } successfully!`,
        { id: "blacklist-token" }
      );
      setBlacklistForm({ ...blacklistForm, tokenId: "" });
    } catch (error) {
      console.error("Error updating token blacklist:", error);
      toast.error("Failed to update token blacklist", {
        id: "blacklist-token",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handlePauseContract = async () => {
    if (!walletClient) return;

    try {
      setFormLoading(true);
      const action = contractPaused ? "Unpausing" : "Pausing";
      toast.loading(`${action} contract...`, { id: "pause-contract" });

      const tx = contractPaused
        ? await unpauseContract(walletClient)
        : await pauseContract(walletClient);
      await tx.wait();

      toast.success(
        `Contract ${contractPaused ? "unpaused" : "paused"} successfully!`,
        { id: "pause-contract" }
      );
      await loadContractData();
    } catch (error) {
      console.error("Error pausing/unpausing contract:", error);
      toast.error("Failed to update contract state", { id: "pause-contract" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEmergencyAction = async () => {
    if (!walletClient) return;

    try {
      setFormLoading(true);
      let tx;

      switch (emergencyAction) {
        case "initiate":
          toast.loading("Initiating emergency withdraw...", {
            id: "emergency-action",
          });
          tx = await initiateEmergencyWithdraw(walletClient);
          break;
        case "cancel":
          toast.loading("Canceling emergency withdraw...", {
            id: "emergency-action",
          });
          tx = await cancelEmergencyWithdraw(walletClient);
          break;
        case "withdraw-eth":
          toast.loading("Withdrawing ETH...", { id: "emergency-action" });
          tx = await emergencyWithdrawETH(walletClient);
          break;
        default:
          throw new Error("Invalid emergency action");
      }

      await tx.wait();
      toast.success("Emergency action completed successfully!", {
        id: "emergency-action",
      });
      setShowEmergencyModal(false);
      await loadContractData();
    } catch (error) {
      console.error("Error executing emergency action:", error);
      toast.error("Failed to execute emergency action", {
        id: "emergency-action",
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Layout title="Admin Dashboard" subtitle="Contract Administration">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FiShield className="w-16 h-16 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Please connect your wallet to access the admin dashboard
          </p>
          <motion.button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-300 flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl"
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

  if (loading) {
    return (
      <Layout title="Admin Dashboard" subtitle="Contract Administration">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Checking admin access...
          </p>
        </motion.div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Admin Dashboard" subtitle="Contract Administration">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FiLock className="w-16 h-16 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Only the contract owner can access this dashboard
          </p>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 max-w-lg mx-auto border border-red-200/50 dark:border-red-700/30">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-800 dark:text-red-300">
                  Contract Owner:
                </span>
                <span className="font-mono text-red-700 dark:text-red-300 text-sm">
                  {contractOwner
                    ? `${contractOwner.slice(0, 6)}...${contractOwner.slice(
                        -4
                      )}`
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-800 dark:text-red-300">
                  Your Address:
                </span>
                <span className="font-mono text-red-700 dark:text-red-300 text-sm">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "Not connected"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Admin Dashboard"
      subtitle="Advanced contract administration and marketplace management"
    >
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 dark:from-red-500/20 dark:via-orange-500/20 dark:to-yellow-500/20 rounded-3xl p-6 lg:p-8 mb-8 border border-red-200/50 dark:border-red-700/30 backdrop-blur-sm overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-400 to-orange-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-orange-400 to-yellow-600 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full blur-2xl"></div>
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
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <FiShield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                  Admin Control Center
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 mb-4 lg:mb-0 max-w-2xl"
              >
                Comprehensive contract administration with advanced security
                controls and real-time monitoring
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: FiCpu, text: "Smart Contract", color: "red" },
                {
                  icon: FiBarChart,
                  text: "Real-time Analytics",
                  color: "orange",
                },
                { icon: FiAward, text: "Admin Verified", color: "yellow" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-3 py-2 rounded-xl border ${
                    feature.color === "red"
                      ? "border-red-200/50 dark:border-red-700/50"
                      : feature.color === "orange"
                      ? "border-orange-200/50 dark:border-orange-700/50"
                      : "border-yellow-200/50 dark:border-yellow-700/50"
                  }`}
                >
                  <feature.icon
                    className={`w-4 h-4 ${
                      feature.color === "red"
                        ? "text-red-500"
                        : feature.color === "orange"
                        ? "text-orange-500"
                        : "text-yellow-500"
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

      {/* Enhanced Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
      >
        <motion.div
          className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Contract Status
              </p>
              <p
                className={`text-2xl font-bold ${
                  contractPaused
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {contractPaused ? "Paused" : "Active"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {contractPaused ? "Contract is paused" : "Contract is running"}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                contractPaused
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-green-500 to-green-600"
              }`}
            >
              {contractPaused ? (
                <FiPause className="w-6 h-6 text-white" />
              ) : (
                <FiPlay className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Total NFTs
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contractStats.totalTokens || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minted on platform
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Platform Fee
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(parseInt(settings.platformFee) / 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current fee rate
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Emergency Status
              </p>
              <p
                className={`text-2xl font-bold ${
                  emergencyStatus.enabled
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {emergencyStatus.enabled ? "Active" : "Inactive"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Emergency withdraw mode
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                emergencyStatus.enabled
                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                  : "bg-gradient-to-r from-gray-500 to-gray-600"
              }`}
            >
              <FiAlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-purple-900/20 mb-8 shadow-xl overflow-hidden"
      >
        <div className="border-b border-gray-200/50 dark:border-gray-700/30">
          <nav className="flex space-x-0 px-2">
            {[
              {
                key: "overview",
                label: "Overview",
                icon: FiEye,
                color: "blue",
              },
              {
                key: "settings",
                label: "Settings",
                icon: FiSettings,
                color: "purple",
              },
              {
                key: "moderation",
                label: "Moderation",
                icon: FiShield,
                color: "red",
              },
              {
                key: "emergency",
                label: "Emergency",
                icon: FiAlertTriangle,
                color: "orange",
              },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-3 py-4 px-6 m-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${
                        tab.color === "blue"
                          ? "from-blue-500 to-cyan-500"
                          : tab.color === "purple"
                          ? "from-purple-500 to-pink-500"
                          : tab.color === "red"
                          ? "from-red-500 to-orange-500"
                          : "from-orange-500 to-yellow-500"
                      } text-white shadow-lg`
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="p-6 lg:p-10">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <FiEye className="w-6 h-6 text-blue-500" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Contract Overview
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <FiSettings className="w-5 h-5 mr-2 text-blue-500" />
                    Current Settings
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Listing Price",
                        value: `${settings.listingPrice} ETH`,
                        icon: FiDollarSign,
                      },
                      {
                        label: "Platform Fee",
                        value: `${(
                          parseInt(settings.platformFee) / 100
                        ).toFixed(1)}%`,
                        icon: FiPercent,
                      },
                      {
                        label: "Fee Recipient",
                        value: `${settings.feeRecipient.slice(
                          0,
                          6
                        )}...${settings.feeRecipient.slice(-4)}`,
                        icon: FiUser,
                      },
                    ].map((setting, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <setting.icon className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {setting.label}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {setting.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <FiBarChart className="w-5 h-5 mr-2 text-green-500" />
                    Platform Statistics
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Total Tokens",
                        value: contractStats.totalTokens || 0,
                        icon: FiPackage,
                      },
                      {
                        label: "Items Sold",
                        value: contractStats.totalSold || 0,
                        icon: FiTrendingUp,
                      },
                      {
                        label: "Active Listings",
                        value: contractStats.totalListed || 0,
                        icon: FiGlobe,
                      },
                    ].map((stat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <stat.icon className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {stat.label}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  onClick={handlePauseContract}
                  disabled={formLoading}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                    contractPaused
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                  } disabled:opacity-50`}
                  whileHover={{
                    scale: formLoading ? 1 : 1.05,
                    y: formLoading ? 0 : -2,
                  }}
                  whileTap={{ scale: formLoading ? 1 : 0.95 }}
                >
                  {contractPaused ? (
                    <FiPlay className="w-5 h-5" />
                  ) : (
                    <FiPause className="w-5 h-5" />
                  )}
                  <span>
                    {contractPaused ? "Unpause Contract" : "Pause Contract"}
                  </span>
                </motion.button>

                <motion.button
                  onClick={loadContractData}
                  className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiRefreshCw className="w-5 h-5" />
                  <span>Refresh Data</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <FiSettings className="w-6 h-6 text-purple-500" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Contract Settings
                </h3>
              </div>

              {/* Listing Price */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiDollarSign className="w-5 h-5 mr-2 text-purple-500" />
                  Listing Price Configuration
                </h4>
                <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Price (ETH)
                    </label>
                    <motion.input
                      type="number"
                      value={settings.listingPrice}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          listingPrice: e.target.value,
                        })
                      }
                      step="0.001"
                      min="0"
                      className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300 text-lg"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                  <motion.button
                    onClick={handleUpdateListingPrice}
                    disabled={formLoading}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: formLoading ? 1 : 1.05 }}
                    whileTap={{ scale: formLoading ? 1 : 0.95 }}
                  >
                    <FiSave className="w-5 h-5" />
                    <span>Update</span>
                  </motion.button>
                </div>
              </div>

              {/* Platform Fee */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiPercent className="w-5 h-5 mr-2 text-blue-500" />
                  Platform Fee Configuration
                </h4>
                <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Fee (basis points, 100 = 1%)
                    </label>
                    <motion.input
                      type="number"
                      value={settings.platformFee}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          platformFee: e.target.value,
                        })
                      }
                      min="0"
                      max="1000"
                      className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-300 text-lg"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Current:{" "}
                      {(parseInt(settings.platformFee) / 100).toFixed(1)}%
                    </p>
                  </div>
                  <motion.button
                    onClick={handleUpdatePlatformFee}
                    disabled={formLoading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: formLoading ? 1 : 1.05 }}
                    whileTap={{ scale: formLoading ? 1 : 0.95 }}
                  >
                    <FiSave className="w-5 h-5" />
                    <span>Update</span>
                  </motion.button>
                </div>
              </div>

              {/* Fee Recipient */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiUsers className="w-5 h-5 mr-2 text-green-500" />
                  Fee Recipient Configuration
                </h4>
                <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Recipient Address
                    </label>
                    <motion.input
                      type="text"
                      value={settings.feeRecipient}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          feeRecipient: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-sm transition-all duration-300 font-mono text-sm"
                      placeholder="0x..."
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                  <motion.button
                    onClick={handleUpdateFeeRecipient}
                    disabled={formLoading}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: formLoading ? 1 : 1.05 }}
                    whileTap={{ scale: formLoading ? 1 : 0.95 }}
                  >
                    <FiSave className="w-5 h-5" />
                    <span>Update</span>
                  </motion.button>
                </div>
              </div>

              {/* Token Listing Fees */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiLayers className="w-5 h-5 mr-2 text-yellow-500" />
                  Token Listing Fees
                </h4>
                <div className="space-y-6">
                  {/* ETH Fee */}
                  <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="flex-1">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center mr-2">
                          <span className="text-white font-bold text-xs">
                            ETH
                          </span>
                        </div>
                        ETH Listing Fee
                      </label>
                      <motion.input
                        type="number"
                        value={settings.ethListingFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ethListingFee: e.target.value,
                          })
                        }
                        step="0.001"
                        min="0"
                        className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 backdrop-blur-sm transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>
                    <motion.button
                      onClick={() => handleUpdateTokenListingFee(0)}
                      disabled={formLoading}
                      className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: formLoading ? 1 : 1.05 }}
                      whileTap={{ scale: formLoading ? 1 : 0.95 }}
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Update</span>
                    </motion.button>
                  </div>

                  {/* USDC Fee */}
                  <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="flex-1">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                          <span className="text-white font-bold text-xs">
                            USD
                          </span>
                        </div>
                        USDC Listing Fee
                      </label>
                      <motion.input
                        type="number"
                        value={settings.usdcListingFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            usdcListingFee: e.target.value,
                          })
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 backdrop-blur-sm transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>
                    <motion.button
                      onClick={() => handleUpdateTokenListingFee(1)}
                      disabled={formLoading}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: formLoading ? 1 : 1.05 }}
                      whileTap={{ scale: formLoading ? 1 : 0.95 }}
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Update</span>
                    </motion.button>
                  </div>

                  {/* USDT Fee */}
                  <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="flex-1">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                          <span className="text-white font-bold text-xs">
                            USD
                          </span>
                        </div>
                        USDT Listing Fee
                      </label>
                      <motion.input
                        type="number"
                        value={settings.usdtListingFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            usdtListingFee: e.target.value,
                          })
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 backdrop-blur-sm transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>
                    <motion.button
                      onClick={() => handleUpdateTokenListingFee(2)}
                      disabled={formLoading}
                      className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: formLoading ? 1 : 1.05 }}
                      whileTap={{ scale: formLoading ? 1 : 0.95 }}
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Update</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Moderation Tab */}
          {activeTab === "moderation" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <FiShield className="w-6 h-6 text-red-500" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Moderation Tools
                </h3>
              </div>

              {/* User Blacklist */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200/50 dark:border-red-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiUsers className="w-5 h-5 mr-2 text-red-500" />
                  User Blacklist Management
                </h4>
                <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      User Address
                    </label>
                    <motion.input
                      type="text"
                      value={blacklistForm.userAddress}
                      onChange={(e) =>
                        setBlacklistForm({
                          ...blacklistForm,
                          userAddress: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 backdrop-blur-sm transition-all duration-300 font-mono text-sm"
                      placeholder="0x..."
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                  <select
                    value={blacklistForm.action}
                    onChange={(e) =>
                      setBlacklistForm({
                        ...blacklistForm,
                        action: e.target.value,
                      })
                    }
                    className="px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm"
                  >
                    <option value="blacklist">Blacklist</option>
                    <option value="unblacklist">Unblacklist</option>
                  </select>
                  <motion.button
                    onClick={handleBlacklistToken}
                    disabled={formLoading || !blacklistForm.tokenId}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{
                      scale: formLoading || !blacklistForm.tokenId ? 1 : 1.05,
                    }}
                    whileTap={{
                      scale: formLoading || !blacklistForm.tokenId ? 1 : 0.95,
                    }}
                  >
                    <FiShield className="w-5 h-5" />
                    <span>Apply</span>
                  </motion.button>
                </div>
              </div>

              {/* Token Blacklist */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiPackage className="w-5 h-5 mr-2 text-orange-500" />
                  Token Blacklist Management
                </h4>
                <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Token ID
                    </label>
                    <motion.input
                      type="number"
                      value={blacklistForm.tokenId}
                      onChange={(e) =>
                        setBlacklistForm({
                          ...blacklistForm,
                          tokenId: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-300"
                      placeholder="Token ID"
                      min="1"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                  <select
                    value={blacklistForm.action}
                    onChange={(e) =>
                      setBlacklistForm({
                        ...blacklistForm,
                        action: e.target.value,
                      })
                    }
                    className="px-5 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm"
                  >
                    <option value="blacklist">Blacklist</option>
                    <option value="unblacklist">Unblacklist</option>
                  </select>
                  <motion.button
                    onClick={handleBlacklistToken}
                    disabled={formLoading || !blacklistForm.tokenId}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{
                      scale: formLoading || !blacklistForm.tokenId ? 1 : 1.05,
                    }}
                    whileTap={{
                      scale: formLoading || !blacklistForm.tokenId ? 1 : 0.95,
                    }}
                  >
                    <FiShield className="w-5 h-5" />
                    <span>Apply</span>
                  </motion.button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-yellow-50 to-red-50 dark:from-yellow-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiAlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-4">
                  <motion.button
                    onClick={handlePauseContract}
                    disabled={formLoading}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      contractPaused
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                    } disabled:opacity-50`}
                    whileHover={{
                      scale: formLoading ? 1 : 1.05,
                      y: formLoading ? 0 : -2,
                    }}
                    whileTap={{ scale: formLoading ? 1 : 0.95 }}
                  >
                    {contractPaused ? (
                      <FiPlay className="w-5 h-5" />
                    ) : (
                      <FiPause className="w-5 h-5" />
                    )}
                    <span>
                      {contractPaused ? "Unpause Contract" : "Pause Contract"}
                    </span>
                  </motion.button>
                </div>

                <div className="mt-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-700/50">
                  <div className="flex items-start space-x-3">
                    <FiInfo className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      <p className="font-semibold mb-2">
                        Moderation Guidelines:
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>
                          Use blacklist features responsibly to maintain
                          platform integrity
                        </li>
                        <li>
                          Always verify addresses and token IDs before applying
                          moderation actions
                        </li>
                        <li>
                          Document reasons for blacklisting for future reference
                        </li>
                        <li>
                          Contract pausing should only be used in emergency
                          situations
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Emergency Tab */}
          {activeTab === "emergency" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <FiAlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Emergency Controls
                </h3>
              </div>

              {/* Emergency Status */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200/50 dark:border-red-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiAlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Emergency Withdraw Status
                </h4>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                        Current Status:
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          emergencyStatus.enabled
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {emergencyStatus.enabled ? "ACTIVE" : "Inactive"}
                      </p>
                    </div>
                    {emergencyStatus.enabled && (
                      <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                          Ready At:
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {emergencyStatus.readyAt
                            ? new Date(emergencyStatus.readyAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    )}
                  </div>

                  {emergencyStatus.enabled && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-700/50">
                      <div className="flex items-start space-x-3">
                        <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Warning:</strong> Emergency withdraw is
                          active. You can execute withdrawals{" "}
                          {emergencyStatus.isReady
                            ? "now"
                            : "after the delay period"}
                          .
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Actions */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FiZap className="w-5 h-5 mr-2 text-orange-500" />
                  Emergency Actions
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {!emergencyStatus.enabled && (
                    <motion.button
                      onClick={() => {
                        setEmergencyAction("initiate");
                        setShowEmergencyModal(true);
                      }}
                      className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiClock className="w-5 h-5" />
                      <span>Initiate Emergency</span>
                    </motion.button>
                  )}

                  {emergencyStatus.enabled && (
                    <>
                      <motion.button
                        onClick={() => {
                          setEmergencyAction("cancel");
                          setShowEmergencyModal(true);
                        }}
                        className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiX className="w-5 h-5" />
                        <span>Cancel Emergency</span>
                      </motion.button>

                      {emergencyStatus.isReady && (
                        <motion.button
                          onClick={() => {
                            setEmergencyAction("withdraw-eth");
                            setShowEmergencyModal(true);
                          }}
                          className="flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiTrash2 className="w-5 h-5" />
                          <span>Withdraw ETH</span>
                        </motion.button>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-red-100 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200/50 dark:border-red-700/50">
                  <div className="flex items-start space-x-3">
                    <FiInfo className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <p className="font-bold mb-3 text-lg">
                        Emergency Withdraw Information:
                      </p>
                      <ul className="space-y-2 list-disc list-inside">
                        <li>
                          Emergency withdraw has a 7-day delay for security
                          purposes
                        </li>
                        <li>
                          Once initiated, there's a mandatory waiting period
                          before execution
                        </li>
                        <li>
                          Emergency withdraw can be canceled at any time before
                          execution
                        </li>
                        <li>
                          Only use in case of smart contract vulnerabilities or
                          critical security issues
                        </li>
                        <li>
                          All actions are logged and irreversible once executed
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Emergency Action Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmergencyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl rounded-3xl max-w-lg w-full p-8 border border-gray-200/50 dark:border-red-900/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                      <FiAlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <span>Confirm Emergency Action</span>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    This action requires careful consideration
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowEmergencyModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="mb-8">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 mb-6 border border-red-200/50 dark:border-red-700/50">
                  <p className="text-red-700 dark:text-red-300 leading-relaxed">
                    {emergencyAction === "initiate" &&
                      "This will initiate emergency withdraw mode with a 7-day security delay. This action should only be used in case of critical security vulnerabilities."}
                    {emergencyAction === "cancel" &&
                      "This will cancel the emergency withdraw process and return the contract to normal operation."}
                    {emergencyAction === "withdraw-eth" &&
                      "This will withdraw all ETH from the contract to the owner address. This action is irreversible."}
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-700/50">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                    Are you absolutely sure you want to proceed? This action
                    cannot be undone and will be permanently recorded on the
                    blockchain.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={formLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleEmergencyAction}
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
                  whileHover={{ scale: formLoading ? 1 : 1.02 }}
                  whileTap={{ scale: formLoading ? 1 : 0.98 }}
                >
                  {formLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      <span>Confirm Action</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <motion.button
          onClick={loadContractData}
          className="w-14 h-14 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-white/10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <FiRefreshCw className="w-6 h-6" />
        </motion.button>
      </div>
    </Layout>
  );
}
