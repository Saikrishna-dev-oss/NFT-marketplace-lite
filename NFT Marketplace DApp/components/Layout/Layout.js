import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on route change (optional)
  useEffect(() => {
    setSidebarOpen(false);
  }, [title]); // Close sidebar when navigating to new page

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#13101A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:bg-gradient-to-br dark:from-[#13101A] dark:via-[#1a1525] dark:to-[#1f1a2e] transition-colors duration-300">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:pl-64 relative">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Page Content */}
        <motion.main
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Content Container */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Background Card for Content */}
            <div className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-purple-900/20 min-h-[calc(100vh-12rem)] relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-purple-50/30 dark:from-purple-900/10 dark:via-transparent dark:to-blue-900/10 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={title} // Re-animate when title changes (page navigation)
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                      staggerChildren: 0.1,
                    }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Floating Action Elements (Optional) */}
          <div className="fixed bottom-6 right-6 z-30 lg:hidden">
            {/* Quick Actions for Mobile */}
            <div className="flex flex-col space-y-3">
              {/* Scroll to Top */}
              <motion.button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.main>
      </div>

      {/* Global Loading Overlay (for transitions) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Toast/Notification Container (Optional) */}
      <div
        id="toast-container"
        className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none"
      >
        {/* Toasts will be rendered here by other components */}
      </div>
    </div>
  );
}
