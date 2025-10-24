import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useForm, ValidationError } from "@formspree/react";
import {
  FiArrowRight,
  FiStar,
  FiShield,
  FiZap,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiEye,
  FiHeart,
  FiShoppingBag,
  FiPlus,
  FiGlobe,
  FiLayers,
  FiAward,
  FiTarget,
  FiPlay,
  FiChevronRight,
  FiChevronDown,
  FiCheck,
  FiX,
  FiMail,
  FiTwitter,
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiMessageSquare,
  FiCpu,
  FiBarChart,
  FiActivity,
  FiImage,
  FiPieChart,
  FiTool,
  FiLock,
  FiUser,
} from "react-icons/fi";

const stats = [
  { label: "Total NFTs", value: "10.2K+", icon: FiImage },
  { label: "Active Users", value: "5.8K+", icon: FiUsers },
  { label: "Total Volume", value: "2.4M ETH", icon: FiDollarSign },
  { label: "Collections", value: "850+", icon: FiLayers },
];

const features = [
  {
    icon: FiShield,
    title: "Secure Trading",
    description:
      "Enterprise-grade security with smart contract verification and multi-signature protection",
    color: "blue",
  },
  {
    icon: FiZap,
    title: "Lightning Fast",
    description:
      "Instant transactions with low gas fees on our optimized blockchain infrastructure",
    color: "purple",
  },
  {
    icon: FiTrendingUp,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights and real-time market data to make informed trading decisions",
    color: "green",
  },
  {
    icon: FiAward,
    title: "Creator Rewards",
    description:
      "Earn royalties forever with our creator-first approach and fair revenue sharing",
    color: "orange",
  },
  {
    icon: FiGlobe,
    title: "Global Marketplace",
    description:
      "Connect with collectors worldwide in our vibrant and diverse NFT ecosystem",
    color: "cyan",
  },
  {
    icon: FiLock,
    title: "Full Ownership",
    description:
      "True ownership with complete control over your digital assets and metadata",
    color: "pink",
  },
];

const faqs = [
  {
    question: "What is an NFT?",
    answer:
      "NFTs (Non-Fungible Tokens) are unique digital assets that represent ownership of digital or physical items on the blockchain. Each NFT has a unique identifier that makes it one-of-a-kind and impossible to replicate.",
  },
  {
    question: "How do I create my first NFT?",
    answer:
      "Simply connect your wallet, click 'Create NFT', upload your digital artwork, add metadata like title and description, set your price, and mint it to the blockchain. Our platform guides you through each step.",
  },
  {
    question: "What are the fees?",
    answer:
      "We charge a 2.5% marketplace fee on successful sales. Creators also earn 5-10% royalties on secondary sales. Gas fees depend on network congestion and are paid directly to the blockchain.",
  },
  {
    question: "Which wallets are supported?",
    answer:
      "We support all major wallets including MetaMask, WalletConnect, Coinbase Wallet, and more. Simply connect your preferred wallet to start trading.",
  },
  {
    question: "How do royalties work?",
    answer:
      "Creators can set royalty percentages (typically 5-10%) when minting. These royalties are automatically paid to the original creator on every secondary sale, providing ongoing income.",
  },
];

const testimonials = [
  {
    name: "Alex Chen",
    role: "Digital Artist",
    image: "/api/placeholder/60/60",
    content:
      "This platform transformed my art career. The royalty system ensures I continue earning from my work, and the community is incredibly supportive.",
    rating: 5,
  },
  {
    name: "Sarah Martinez",
    role: "NFT Collector",
    image: "/api/placeholder/60/60",
    content:
      "The best marketplace I've used. Clean interface, fast transactions, and amazing discovery features. Found some incredible pieces here.",
    rating: 5,
  },
  {
    name: "Michael Roberts",
    role: "Crypto Investor",
    image: "/api/placeholder/60/60",
    content:
      "Impressive analytics and market insights. The platform makes it easy to track portfolio performance and discover trending collections.",
    rating: 5,
  },
];

const FORMSPREE_API = process.env.NEXT_PUBLIC_FORMSPREE_API;

export default function LandingPage() {
  const { isConnected } = useAccount();
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // Formspree hook - Replace 'YOUR_FORM_ID' with your actual Formspree form ID
  const [state, handleSubmit] = useForm(FORMSPREE_API);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:from-[#0A0A0F] dark:via-[#13101A] dark:to-[#1A1625] dark:bg-gradient-to-br">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-purple-600/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl px-6 py-3 rounded-2xl border border-gray-200 dark:border-purple-700/30 mb-8 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✨ New: Analytics Dashboard Now Live
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Create, Collect & Trade
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Premium NFTs
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The world's premier NFT marketplace where creativity meets
              technology. Discover unique digital assets, support amazing
              creators, and join a thriving community.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <motion.button
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-purple-500/25"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiZap className="w-6 h-6" />
                <a href="/dashboard">
                  <span>
                    {isConnected ? "Explore Marketplace" : "Connect Wallet"}
                  </span>
                </a>
                <FiArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.button
                className="w-full sm:w-auto bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-300 dark:border-purple-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlay className="w-5 h-5" />
                <span>Watch Demo</span>
              </motion.button>
            </div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Why Choose Our Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built for creators, collectors, and traders with cutting-edge
              technology and user-first design
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border ${
                    activeFeature === index
                      ? "bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl border-purple-200/50 dark:border-purple-700/30 shadow-2xl"
                      : "bg-white/40 dark:bg-[#13101A]/40 border-gray-200/30 dark:border-gray-700/30 hover:bg-white/60 dark:hover:bg-[#13101A]/60"
                  }`}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        feature.color === "blue"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : feature.color === "purple"
                          ? "bg-gradient-to-br from-purple-500 to-blue-500"
                          : feature.color === "green"
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : feature.color === "orange"
                          ? "bg-gradient-to-br from-orange-500 to-yellow-500"
                          : feature.color === "cyan"
                          ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                          : "bg-gradient-to-br from-pink-500 to-purple-500"
                      }`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    {activeFeature === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
                      >
                        <FiCheck className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Visualization */}
            <div className="relative">
              <motion.div
                className="bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-purple-700/30 shadow-2xl"
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center">
                  <div
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${
                      features[activeFeature].color === "blue"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                        : features[activeFeature].color === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-blue-500"
                        : features[activeFeature].color === "green"
                        ? "bg-gradient-to-br from-green-500 to-emerald-500"
                        : features[activeFeature].color === "orange"
                        ? "bg-gradient-to-br from-orange-500 to-yellow-500"
                        : features[activeFeature].color === "cyan"
                        ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                        : "bg-gradient-to-br from-pink-500 to-purple-500"
                    }`}
                  ></div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                </div>
              </motion.div>

              {/* Progress indicators */}
              <div className="flex justify-center space-x-2 mt-6">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeFeature === index
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 scale-125"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gray-50/50 dark:bg-[#13101A]/30 dark:backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Loved by Creators
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join thousands of satisfied artists, collectors, and traders who
              trust our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-purple-900/20 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Frequently Asked
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Questions</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about our NFT marketplace
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-purple-900/20 shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-r from-purple-50/30 via-blue-50/30 to-cyan-50/30 dark:bg-gradient-to-r dark:from-purple-500/10 dark:via-blue-500/10 dark:to-cyan-500/10">
        {/* Background */}
        <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-purple-500/10 dark:via-blue-500/10 dark:to-cyan-500/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Ready to Start Your
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                NFT Journey?
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Join our community of creators and collectors. Start creating,
              trading, and discovering amazing NFTs today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <motion.a
                href="/create"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-purple-500/25"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-6 h-6" />
                <span>Create Your First NFT</span>
              </motion.a>

              <motion.a
                href="/dashboard"
                className="w-full sm:w-auto bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-300 dark:border-purple-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiGlobe className="w-6 h-6" />
                <span>Explore Marketplace</span>
              </motion.a>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-white dark:bg-[#13101A]/80 dark:backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-purple-900/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get the latest news and exclusive drops
              </p>

              {state.succeeded ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Successfully Subscribed!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for joining our community. Check your email for
                    confirmation.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      required
                    />
                    <ValidationError
                      prefix="Email"
                      field="email"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Optional: Add a message field */}
                  <input
                    type="hidden"
                    name="source"
                    value="NFT Marketplace Landing Page Newsletter"
                  />

                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    whileHover={{ scale: state.submitting ? 1 : 1.02 }}
                    whileTap={{ scale: state.submitting ? 1 : 0.98 }}
                    disabled={state.submitting}
                  >
                    {state.submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <FiMail className="w-4 h-4" />
                        <span>Subscribe to Newsletter</span>
                      </>
                    )}
                  </motion.button>

                  {state.errors && state.errors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm text-center"
                    >
                      Oops! There was an error. Please try again.
                    </motion.div>
                  )}
                </form>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                By subscribing, you agree to our Privacy Policy and Terms of
                Service
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#13101A]/50 dark:backdrop-blur-xl border-t border-gray-200 dark:border-purple-900/20 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <FiLayers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    NFT Market
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Premium Digital Assets
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 max-w-md">
                The world's premier NFT marketplace where creativity meets
                technology. Create, collect, and trade unique digital assets
                with confidence.
              </p>
              <div className="flex items-center space-x-4">
                {[
                  { icon: FiTwitter, href: "#" },
                  { icon: FiInstagram, href: "#" },
                  { icon: FiGithub, href: "#" },
                  { icon: FiLinkedin, href: "#" },
                  { icon: FiMessageSquare, href: "#" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 hover:text-white transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Marketplace
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Explore NFTs", href: "/" },
                  { label: "Create NFT", href: "/create" },
                  { label: "My Collection", href: "/my-nfts" },
                  { label: "Activity", href: "/activity" },
                  { label: "Analytics", href: "/analytics" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.label}</span>
                      <FiChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Support
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Help Center", href: "#" },
                  { label: "Documentation", href: "#" },
                  { label: "Community", href: "#" },
                  { label: "Contact Us", href: "#" },
                  { label: "Bug Reports", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.label}</span>
                      <FiChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/30 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <span>© 2024 NFT Market. All rights reserved.</span>
                <div className="flex items-center space-x-4">
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Cookies
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          className="w-14 h-14 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:shadow-purple-500/25"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FiArrowRight className="w-6 h-6 transform -rotate-90" />
        </motion.button>
      </div>

      {/* Background Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
