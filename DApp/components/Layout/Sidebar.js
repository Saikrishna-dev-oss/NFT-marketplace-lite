import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiShoppingBag,
  FiPlus,
  FiUser,
  FiList,
  FiBarChart,
  FiSettings,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiStar,
  FiHelpCircle,
  FiExternalLink,
  FiActivity,
  FiPackage,
  FiLayers,
} from "react-icons/fi";
import { TfiCrown } from "react-icons/tfi";

import { getOwner } from "../../lib/contracts/functions";

const baseMenuItems = [
  {
    id: "marketplace",
    label: "Marketplace",
    icon: FiHome,
    path: "/dashboard",
    color: "blue",
  },
  {
    id: "create",
    label: "Create NFT",
    icon: FiPlus,
    path: "/create",
    color: "purple",
  },
  {
    id: "my-nfts",
    label: "My Collection",
    icon: FiPackage,
    path: "/my-nfts",
    color: "green",
  },
  {
    id: "my-listings",
    label: "My Listings",
    icon: FiList,
    path: "/my-listings",
    color: "orange",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: FiBarChart,
    path: "/analytics",
    color: "cyan",
  },
  {
    id: "activity",
    label: "Activity",
    icon: FiActivity,
    path: "/activity",
    color: "pink",
  },
];

const adminMenuItem = {
  id: "admin",
  label: "Admin Panel",
  icon: FiShield,
  path: "/admin",
  adminOnly: true,
  color: "red",
};

export default function Sidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isConnected || !address || !publicClient) {
        setIsAdmin(false);
        return;
      }

      try {
        setCheckingAdmin(true);
        const owner = await getOwner(publicClient);
        const isOwner = owner.toLowerCase() === address.toLowerCase();
        setIsAdmin(isOwner);
      } catch (error) {
        console.error("Error checking admin access:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, [isConnected, address, publicClient]);

  // Create menu items based on admin status
  const menuItems = [...baseMenuItems];
  if (isAdmin) {
    menuItems.push(adminMenuItem);
  }

  const handleNavigation = (path) => {
    router.push(path);
    setIsOpen(false); // Close mobile sidebar after navigation
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.3, delay: 0.1 },
    },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-purple-900/20">
      {/* Enhanced Logo Section */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-purple-900/20">
        <a href="/">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
              <FiLayers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                NFT Market
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Premium Digital Assets
              </p>
            </div>
          </div>
        </a>
        <motion.button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </motion.button>
      </div>

      {/* Enhanced User Status */}
      {isConnected && (
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-purple-900/20">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connected"}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {isAdmin ? "Administrator" : "User Account"}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-100 to-pink-100 text-red-700 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border border-red-200/50 dark:border-red-700/30">
                    <FiShield className="w-3 h-3 mr-1" />
                    Admin
                  </span>
                )}
                {checkingAdmin && (
                  <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive =
            router.pathname === item.path ||
            (item.path !== "/" && router.pathname.startsWith(item.path));

          const isAdminItem = item.adminOnly;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left relative overflow-hidden group ${
                isActive
                  ? isAdminItem
                    ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 shadow-lg border border-red-200/50 dark:border-red-700/30"
                    : "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 text-purple-700 dark:text-purple-300 shadow-lg border border-purple-200/50 dark:border-purple-700/30"
                  : isAdminItem
                  ? "text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50 dark:hover:from-red-900/10 dark:hover:to-pink-900/10 border border-transparent hover:border-red-200/30 dark:hover:border-red-700/20"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 dark:hover:from-gray-800/50 dark:hover:to-purple-900/10 border border-transparent hover:border-gray-200/30 dark:hover:border-purple-700/20"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                  isAdminItem
                    ? "from-red-500/5 to-pink-500/5"
                    : "from-purple-500/5 to-blue-500/5"
                }`}
              ></div>

              <div
                className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center ${
                  isActive
                    ? isAdminItem
                      ? "bg-gradient-to-br from-red-500 to-pink-500 shadow-lg"
                      : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg"
                    : isAdminItem
                    ? "bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/40"
                    : "bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : isAdminItem
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
              </div>
              <span className="relative z-10 font-semibold">{item.label}</span>
              {isAdminItem && (
                <TfiCrown className="relative z-10 w-4 h-4 text-yellow-500 ml-auto" />
              )}
              {isActive && (
                <motion.div
                  className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-l-full ${
                    isAdminItem ? "bg-red-500" : "bg-purple-500"
                  }`}
                  layoutId="activeIndicator"
                />
              )}
            </motion.button>
          );
        })}

        {/* Admin Access Info */}
        {isConnected && !isAdmin && !checkingAdmin && (
          <motion.div
            className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/10 rounded-2xl border border-gray-200/50 dark:border-purple-700/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <FiShield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Admin Features
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Administrative features are only available to contract owners
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Enhanced Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-purple-900/20 space-y-4">
        {/* Help Section */}
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200/30 dark:border-purple-700/30"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <FiHelpCircle className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Need Help?
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
            Access documentation, tutorials, and community support
          </p>
          <motion.button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Get Support</span>
            <FiExternalLink className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Admin Status Footer */}
        {isAdmin && (
          <motion.div
            className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200/50 dark:border-red-700/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiShield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-300">
                  Admin Mode Active
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Full contract access granted
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-40">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Enhanced Mobile Sidebar */}
            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="lg:hidden fixed left-0 top-0 w-80 max-w-[85vw] h-screen z-[9999]"
              style={{ maxHeight: "100vh", maxHeight: "100dvh" }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile Menu Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[9997] p-3 bg-white/90 dark:bg-[#13101A]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-purple-900/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </motion.button>
    </>
  );
}
