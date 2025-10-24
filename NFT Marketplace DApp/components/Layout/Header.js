import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  FiBell,
  FiSun,
  FiMoon,
  FiSearch,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiHeart,
  FiShoppingBag,
} from "react-icons/fi";
import { formatAddress } from "../../lib/contracts/utils";

export default function Header({ title, subtitle }) {
  const { address, isConnected } = useAccount();
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-[#13101A]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-purple-900/30 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 transition-all duration-300">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo & Title Section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1 lg:flex-none">
            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showMobileMenu ? (
                <FiX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <FiMenu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>

            {/* Logo & Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl items-center justify-center shadow-lg">
                  <FiShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
                <input
                  type="text"
                  placeholder="Search NFTs, collections, creators..."
                  className="w-full pl-12 pr-6 py-3.5 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                />
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Actions - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Favorites */}
            </div>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-all duration-200 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDark ? (
                <FiSun className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform duration-200" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-600 group-hover:-rotate-12 transition-transform duration-200" />
              )}
            </motion.button>

            {/* Connect Wallet Button */}
            <div className="flex items-center">
              <div className="[&>button]:!bg-gradient-to-r [&>button]:!from-purple-600 [&>button]:!to-blue-600 [&>button]:!border-0 [&>button]:!rounded-xl [&>button]:!px-4 [&>button]:!py-2.5 [&>button]:!font-semibold [&>button]:!text-white [&>button]:!shadow-lg hover:[&>button]:!shadow-xl [&>button]:!transition-all [&>button]:!duration-200 hover:[&>button]:!scale-105">
                <ConnectButton
                  chainStatus="icon"
                  accountStatus={{
                    smallScreen: "avatar",
                    largeScreen: "full",
                  }}
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden mt-4">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search NFTs, collections..."
              className="w-full pl-12 pr-6 py-3 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowMobileMenu(false)}
        >
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 h-full bg-white dark:bg-[#13101A] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                    <FiShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Mobile Quick Actions */}
              <div className="flex space-x-4">
                <button className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FiHeart className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Favorites
                  </span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FiBell className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Alerts
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
