import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiUpload,
  FiImage,
  FiDollarSign,
  FiPercent,
  FiUser,
  FiTag,
  FiInfo,
  FiCheck,
  FiAlertCircle,
  FiZap,
  FiStar,
  FiGift,
  FiTrendingUp,
  FiShield,
  FiCpu,
  FiGlobe,
  FiAward,
  FiLayers,
  FiCodesandbox,
  FiPlusCircle,
  FiMinusCircle,
  FiArrowRight,
  FiArrowLeft,
  FiEye,
  FiHeart,
} from "react-icons/fi";

import Layout from "../components/Layout/Layout";
import LoadingSpinner from "../components/UI/LoadingSpinner";

import { createToken, getListingPrice } from "../lib/contracts/functions";
import { uploadToPinata, uploadMetadataToPinata } from "../lib/ipfs/pinata";

export default function CreateNFT() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    collection: "",
    attributes: [],
    royaltyPercentage: 0,
    royaltyRecipient: "",
    ethPrice: "",
    usdcPrice: "",
    usdtPrice: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [listingPrice, setListingPrice] = useState("0.001");
  const [currentStep, setCurrentStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);

  // Load listing price when component mounts
  useEffect(() => {
    const loadListingPrice = async () => {
      try {
        if (publicClient) {
          const price = await getListingPrice(publicClient);
          setListingPrice(price);
        }
      } catch (error) {
        console.error("Error loading listing price:", error);
        setListingPrice("0.001");
      }
    };

    loadListingPrice();
  }, [publicClient]);

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    // File size validation (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // File type validation
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF, WebP)");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);

    toast.success("Image uploaded successfully!");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAttribute = () => {
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: "", value: "" }],
    }));
  };

  const removeAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const updateAttribute = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      ),
    }));
  };

  const validateForm = () => {
    const ethPrice = parseFloat(formData.ethPrice);
    const usdcPrice = parseFloat(formData.usdcPrice);
    const usdtPrice = parseFloat(formData.usdtPrice);

    return true;
  };

  const handleCreate = async () => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Step 1: Upload image to IPFS
      toast.loading("Uploading image to IPFS...", { id: "create-nft" });
      const imageUpload = await uploadToPinata(file);

      // Step 2: Create metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: `ipfs://${imageUpload.hash}`,
        collection: formData.collection || "Unnamed Collection",
        attributes: formData.attributes.filter(
          (attr) => attr.trait_type && attr.value
        ),
        external_url: "",
        background_color: "",
        created_by: walletClient.account?.address || address || "",
        created_at: new Date().toISOString(),
      };

      // Step 3: Upload metadata to IPFS
      toast.loading("Uploading metadata to IPFS...", { id: "create-nft" });
      const metadataUpload = await uploadMetadataToPinata(metadata);

      // Step 4: Create NFT on blockchain
      toast.loading("Creating NFT on blockchain...", { id: "create-nft" });

      const prices = {
        ethPrice: formData.ethPrice || "0",
        usdcPrice: formData.usdcPrice || "0",
        usdtPrice: formData.usdtPrice || "0",
      };

      // Call the actual smart contract function
      const tx = await createToken(
        walletClient,
        `ipfs://${metadataUpload.hash}`,
        prices,
        Math.floor(formData.royaltyPercentage * 100), // Convert to basis points
        formData.royaltyRecipient || walletClient.account?.address || address
      );

      toast.loading("Waiting for confirmation...", { id: "create-nft" });

      // Wait for transaction confirmation
      if (tx && tx.wait) {
        await tx.wait();
      }

      toast.success("NFT created successfully!", { id: "create-nft" });

      // Show success details
      console.log("NFT created successfully:", {
        transactionHash: tx.hash,
        tokenURI: `ipfs://${metadataUpload.hash}`,
        metadata: metadata,
      });

      // Redirect to My NFTs page
      setTimeout(() => {
        router.push("/my-nfts");
      }, 1500);
    } catch (error) {
      console.error("Error creating NFT:", error);

      // Handle specific error types
      if (error.message.includes("user rejected")) {
        toast.error("Transaction was rejected by user", { id: "create-nft" });
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction", { id: "create-nft" });
      } else if (error.message.includes("Failed to create token")) {
        toast.error(`Smart contract error: ${error.message}`, {
          id: "create-nft",
        });
      } else {
        toast.error("Failed to create NFT. Please try again.", {
          id: "create-nft",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Upload & Details",
      subtitle: "Add your artwork and metadata",
      icon: FiUpload,
      color: "from-purple-500 to-blue-500",
    },
    {
      id: 2,
      title: "Pricing & Royalties",
      subtitle: "Set prices and royalty terms",
      icon: FiDollarSign,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Review & Create",
      subtitle: "Finalize and mint your NFT",
      icon: FiZap,
      color: "from-cyan-500 to-purple-500",
    },
  ];

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return file && formData.name.trim();
      case 2:
        return (
          (formData.ethPrice || formData.usdcPrice || formData.usdtPrice) &&
          formData.royaltyPercentage >= 0 &&
          formData.royaltyPercentage <= 10
        );
      case 3:
        return validateForm();
      default:
        return false;
    }
  };

  return (
    <Layout
      title="Create NFT"
      subtitle="Transform your digital art into unique NFTs and join the creator economy"
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 rounded-3xl p-6 lg:p-8 mb-8 border border-purple-200/50 dark:border-purple-700/30 backdrop-blur-sm overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-400 to-cyan-600 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full blur-2xl"></div>
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center space-x-3 mb-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                <FiStar className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Create Your Masterpiece
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              Upload your digital artwork, set your terms, and mint it as a
              unique NFT. Join thousands of creators earning from their digital
              assets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 text-sm"
            >
              {[
                { icon: FiShield, text: "Secure Minting" },
                { icon: FiTrendingUp, text: "Earn Royalties" },
                { icon: FiGlobe, text: "Global Marketplace" },
                { icon: FiAward, text: "Creator Verified" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <feature.icon className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Steps Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-[#13101A]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-gray-200/50 dark:border-purple-900/20 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center w-full lg:w-auto"
                >
                  {/* Step Circle and Content */}
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                        currentStep >= step.id
                          ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {currentStep > step.id ? (
                        <FiCheck className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                      {isStepValid(step.id) && currentStep === step.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <FiCheck className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.div>

                    <div className="hidden lg:block">
                      <h3
                        className={`font-semibold transition-colors duration-300 ${
                          currentStep >= step.id
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Step Title */}
                  <div className="lg:hidden ml-4 flex-1">
                    <h3
                      className={`font-semibold transition-colors duration-300 ${
                        currentStep >= step.id
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex flex-1 h-0.5 mx-6 relative">
                      <div
                        className={`w-full h-full transition-all duration-500 ${
                          currentStep > step.id
                            ? `bg-gradient-to-r ${step.color}`
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                      {currentStep > step.id && (
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/95 dark:bg-[#13101A]/95 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-purple-900/20 overflow-hidden shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Upload & Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-10"
              >
                <div className="mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FiUpload className="w-7 h-7 mr-3 text-purple-500" />
                    Upload Your Artwork
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Choose your digital file and add essential details to make
                    it discoverable
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
                  {/* Enhanced File Upload */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiImage className="w-5 h-5 mr-2 text-purple-500" />
                      Upload Image *
                    </label>

                    <motion.div
                      className={`relative border-2 border-dashed rounded-3xl p-8 lg:p-12 text-center transition-all duration-300 ${
                        file
                          ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                          : dragActive
                          ? "border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      whileHover={{ scale: file ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {preview ? (
                        <div className="space-y-6">
                          <div className="relative group">
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-48 h-48 lg:w-56 lg:h-56 object-cover rounded-2xl mx-auto shadow-2xl group-hover:shadow-3xl transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <FiEye className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400"
                          >
                            <FiCheck className="w-5 h-5" />
                            <span className="font-semibold text-lg">
                              Image uploaded successfully
                            </span>
                          </motion.div>
                          <div className="flex justify-center space-x-3">
                            <motion.button
                              onClick={() => {
                                setFile(null);
                                setPreview("");
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiMinusCircle className="w-4 h-4" />
                              <span>Remove</span>
                            </motion.button>
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-xl font-medium flex items-center space-x-2">
                              <span>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <motion.div
                            animate={{
                              y: dragActive ? [0, -10, 0] : 0,
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: dragActive ? Infinity : 0,
                            }}
                          >
                            <FiUpload
                              className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                                dragActive
                                  ? "text-purple-500"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            />
                          </motion.div>
                          <div>
                            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              {dragActive
                                ? "Drop your artwork here"
                                : "Drag and drop your artwork here"}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              or click to browse your files
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 text-sm">
                              {["JPG", "PNG", "GIF", "WebP"].map((format) => (
                                <span
                                  key={format}
                                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg font-medium"
                                >
                                  {format}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              Maximum file size: 10MB
                            </p>
                          </div>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </motion.div>
                  </div>

                  {/* Enhanced NFT Details */}
                  <div className="space-y-6 lg:space-y-8">
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <FiTag className="w-5 h-5 mr-2 text-purple-500" />
                        NFT Name *
                      </label>
                      <motion.input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter a catchy name for your NFT"
                        className="w-full px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                        maxLength={50}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formData.name.length}/50 characters
                        </p>
                        {formData.name.length > 30 && (
                          <span className="text-xs text-amber-500 flex items-center space-x-1">
                            <FiAlertCircle className="w-3 h-3" />
                            <span>Consider shorter name</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <FiInfo className="w-5 h-5 mr-2 text-purple-500" />
                        Description
                      </label>
                      <motion.textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell the story behind your NFT. What makes it special?"
                        rows={5}
                        className="w-full px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white resize-none backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                        maxLength={500}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {formData.description.length}/500 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <FiLayers className="w-5 h-5 mr-2 text-purple-500" />
                        Collection
                      </label>
                      <motion.input
                        type="text"
                        name="collection"
                        value={formData.collection}
                        onChange={handleInputChange}
                        placeholder="Group your NFTs in a collection (optional)"
                        className="w-full px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                        maxLength={30}
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>

                    {/* Enhanced Attributes */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <FiCodesandbox className="w-5 h-5 mr-2 text-purple-500" />
                          Attributes
                        </label>
                        <motion.button
                          onClick={addAttribute}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiPlusCircle className="w-4 h-4" />
                          <span>Add Trait</span>
                        </motion.button>
                      </div>

                      <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                          {formData.attributes.map((attr, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="flex space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                            >
                              <div className="flex-1">
                                <motion.input
                                  type="text"
                                  placeholder="Trait type (e.g., Color)"
                                  value={attr.trait_type}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "trait_type",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white text-sm backdrop-blur-sm transition-all duration-200"
                                  maxLength={20}
                                  whileFocus={{ scale: 1.02 }}
                                />
                              </div>
                              <div className="flex-1">
                                <motion.input
                                  type="text"
                                  placeholder="Value (e.g., Blue)"
                                  value={attr.value}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white text-sm backdrop-blur-sm transition-all duration-200"
                                  maxLength={20}
                                  whileFocus={{ scale: 1.02 }}
                                />
                              </div>
                              <motion.button
                                onClick={() => removeAttribute(index)}
                                className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FiMinusCircle className="w-5 h-5" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {formData.attributes.length === 0 && (
                          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl">
                            <FiCodesandbox className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                              No attributes added yet
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              Attributes help buyers discover and filter your
                              NFT
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-blue-200/50 dark:border-blue-700/30">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                          <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                            Pro Tips for Better Discovery
                          </p>
                          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li>
                              • Use descriptive names that capture your art's
                              essence
                            </li>
                            <li>
                              • Add relevant attributes (style, color, rarity,
                              etc.)
                            </li>
                            <li>
                              • Write compelling descriptions that tell a story
                            </li>
                            <li>
                              • Group related works in collections for better
                              visibility
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8 lg:mt-12">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    disabled={!isStepValid(1)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl"
                    whileHover={{
                      scale: isStepValid(1) ? 1.05 : 1,
                      y: isStepValid(1) ? -2 : 0,
                    }}
                    whileTap={{ scale: isStepValid(1) ? 0.95 : 1 }}
                  >
                    <span>Next: Set Pricing</span>
                    <FiArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pricing & Royalties */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-10"
              >
                <div className="mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FiDollarSign className="w-7 h-7 mr-3 text-blue-500" />
                    Set Your Pricing
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Choose your payment methods and set royalty terms for future
                    sales
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
                  {/* Enhanced Pricing Section */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FiTrendingUp className="w-6 h-6 mr-3 text-blue-500" />
                      Payment Options
                    </h4>

                    <div className="space-y-6">
                      {/* ETH Price */}
                      <div className="relative">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">
                              ETH
                            </span>
                          </div>
                          Ethereum (ETH)
                        </label>
                        <motion.div className="relative">
                          <motion.input
                            type="number"
                            name="ethPrice"
                            value={formData.ethPrice}
                            onChange={handleInputChange}
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
                        {formData.ethPrice && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            ≈ $
                            {(parseFloat(formData.ethPrice) * 2000).toFixed(2)}{" "}
                            USD
                          </p>
                        )}
                      </div>

                      {/* USDC Price */}
                      <div className="relative">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">
                              USD
                            </span>
                          </div>
                          USD Coin (USDC)
                        </label>
                        <motion.div className="relative">
                          <motion.input
                            type="number"
                            name="usdcPrice"
                            value={formData.usdcPrice}
                            onChange={handleInputChange}
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
                      <div className="relative">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">
                              USD
                            </span>
                          </div>
                          Tether (USDT)
                        </label>
                        <motion.div className="relative">
                          <motion.input
                            type="number"
                            name="usdtPrice"
                            value={formData.usdtPrice}
                            onChange={handleInputChange}
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
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/30">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            Platform Fee: {listingPrice} ETH
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-300 leading-relaxed">
                            This one-time fee covers blockchain transaction
                            costs and platform maintenance. It's required to
                            list your NFT on the marketplace and ensure secure
                            ownership transfer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Royalties Section */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FiPercent className="w-6 h-6 mr-3 text-purple-500" />
                      Creator Royalties
                    </h4>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FiGift className="w-5 h-5 mr-2 text-purple-500" />
                          Royalty Percentage (0-10%)
                        </label>
                        <motion.div className="relative">
                          <motion.input
                            type="number"
                            name="royaltyPercentage"
                            value={formData.royaltyPercentage}
                            onChange={handleInputChange}
                            placeholder="2.5"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full px-5 py-4 pr-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white text-lg backdrop-blur-sm transition-all duration-300"
                            whileFocus={{ scale: 1.02 }}
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-500 font-semibold">
                            %
                          </div>
                        </motion.div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            You'll earn {formData.royaltyPercentage}% from each
                            resale
                          </p>
                          {formData.royaltyPercentage > 7.5 && (
                            <span className="text-xs text-amber-500 flex items-center space-x-1">
                              <FiAlertCircle className="w-3 h-3" />
                              <span>High royalty may deter buyers</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FiUser className="w-5 h-5 mr-2 text-purple-500" />
                          Royalty Recipient (Optional)
                        </label>
                        <motion.input
                          type="text"
                          name="royaltyRecipient"
                          value={formData.royaltyRecipient}
                          onChange={handleInputChange}
                          placeholder="0x... (defaults to your wallet address)"
                          className="w-full px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-300 font-mono text-sm"
                          whileFocus={{ scale: 1.02 }}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Leave empty to receive royalties in your connected
                          wallet
                        </p>
                      </div>

                      {/* Royalty Calculator */}
                      {formData.royaltyPercentage > 0 &&
                        (formData.ethPrice ||
                          formData.usdcPrice ||
                          formData.usdtPrice) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-700/30"
                          >
                            <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                              <FiTrendingUp className="w-4 h-4 mr-2" />
                              Royalty Calculator
                            </h5>
                            <div className="space-y-2 text-sm">
                              {formData.ethPrice && (
                                <div className="flex justify-between">
                                  <span className="text-green-700 dark:text-green-300">
                                    ETH resale earnings:
                                  </span>
                                  <span className="font-semibold text-green-800 dark:text-green-200">
                                    {(
                                      (parseFloat(formData.ethPrice) *
                                        formData.royaltyPercentage) /
                                      100
                                    ).toFixed(4)}{" "}
                                    ETH
                                  </span>
                                </div>
                              )}
                              {formData.usdcPrice && (
                                <div className="flex justify-between">
                                  <span className="text-green-700 dark:text-green-300">
                                    USDC resale earnings:
                                  </span>
                                  <span className="font-semibold text-green-800 dark:text-green-200">
                                    $
                                    {(
                                      (parseFloat(formData.usdcPrice) *
                                        formData.royaltyPercentage) /
                                      100
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {formData.usdtPrice && (
                                <div className="flex justify-between">
                                  <span className="text-green-700 dark:text-green-300">
                                    USDT resale earnings:
                                  </span>
                                  <span className="font-semibold text-green-800 dark:text-green-200">
                                    $
                                    {(
                                      (parseFloat(formData.usdtPrice) *
                                        formData.royaltyPercentage) /
                                      100
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                    </div>

                    {/* Royalty Info */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/30">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <FiGift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                            About Creator Royalties
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
                            Royalties ensure you continue earning from your
                            art's success. Each time your NFT is resold, you
                            automatically receive the percentage you set here.
                          </p>
                          <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                            <p>• Typical range: 2.5% - 10%</p>
                            <p>• Industry standard: 5% - 7.5%</p>
                            <p>• Payments are automatic and immediate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8 lg:mt-12">
                  <motion.button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowLeft className="w-5 h-5" />
                    <span>Back to Details</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    disabled={!isStepValid(2)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl"
                    whileHover={{
                      scale: isStepValid(2) ? 1.05 : 1,
                      y: isStepValid(2) ? -2 : 0,
                    }}
                    whileTap={{ scale: isStepValid(2) ? 0.95 : 1 }}
                  >
                    <span>Review & Create</span>
                    <FiArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Create */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-10"
              >
                <div className="mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FiZap className="w-7 h-7 mr-3 text-purple-500" />
                    Review & Create
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Everything looks perfect? Let's mint your NFT and make it
                    live on the blockchain!
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
                  {/* Enhanced Preview */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FiEye className="w-6 h-6 mr-3 text-purple-500" />
                      NFT Preview
                    </h4>

                    <motion.div
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      {preview && (
                        <div className="relative group mb-6">
                          <img
                            src={preview}
                            alt="NFT Preview"
                            className="w-full aspect-square object-cover rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg">
                            <FiCheck className="w-3 h-3" />
                            <span>Ready to Mint</span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {(file?.size / 1024 / 1024).toFixed(2)} MB •{" "}
                                {file?.type?.split("/")[1]?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FiHeart className="w-5 h-5 mr-2 text-red-500" />
                          {formData.name}
                        </h5>
                        {formData.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed line-clamp-4">
                            {formData.description}
                          </p>
                        )}
                        {formData.collection && (
                          <div className="flex items-center space-x-2 mb-4">
                            <FiLayers className="w-4 h-4 text-purple-500" />
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                              {formData.collection}
                            </span>
                          </div>
                        )}

                        {/* Attributes Preview */}
                        {formData.attributes.filter(
                          (attr) => attr.trait_type && attr.value
                        ).length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Attributes
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {formData.attributes
                                .filter((attr) => attr.trait_type && attr.value)
                                .slice(0, 4)
                                .map((attr, index) => (
                                  <div
                                    key={index}
                                    className="bg-white/70 dark:bg-gray-600/70 rounded-lg p-3 border border-gray-200/50 dark:border-gray-500/50 backdrop-blur-sm"
                                  >
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                                      {attr.trait_type}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {attr.value}
                                    </p>
                                  </div>
                                ))}
                            </div>
                            {formData.attributes.filter(
                              (attr) => attr.trait_type && attr.value
                            ).length > 4 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                +
                                {formData.attributes.filter(
                                  (attr) => attr.trait_type && attr.value
                                ).length - 4}{" "}
                                more attributes
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Enhanced Details Summary */}
                  <div className="space-y-6">
                    {/* Pricing Summary */}
                    <motion.div
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <FiDollarSign className="w-6 h-6 mr-3 text-blue-500" />
                        Pricing Details
                      </h5>
                      <div className="space-y-3">
                        {formData.ethPrice && (
                          <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  ETH
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                Ethereum
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {formData.ethPrice} ETH
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                ≈ $
                                {(parseFloat(formData.ethPrice) * 2000).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        {formData.usdcPrice && (
                          <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  USD
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                USD Coin
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                ${formData.usdcPrice}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                USDC
                              </p>
                            </div>
                          </div>
                        )}
                        {formData.usdtPrice && (
                          <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  USD
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                Tether
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                ${formData.usdtPrice}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                USDT
                              </p>
                            </div>
                          </div>
                        )}
                        {!formData.ethPrice &&
                          !formData.usdcPrice &&
                          !formData.usdtPrice && (
                            <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                              <FiAlertCircle className="w-5 h-5" />
                              <span className="font-medium">
                                No prices set - NFT will be free to claim
                              </span>
                            </div>
                          )}
                      </div>
                    </motion.div>

                    {/* Royalty Summary */}
                    <motion.div
                      className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <FiPercent className="w-6 h-6 mr-3 text-purple-500" />
                        Royalty Settings
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Royalty Rate
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            {formData.royaltyPercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Recipient
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm font-mono">
                            {formData.royaltyRecipient
                              ? `${formData.royaltyRecipient.slice(
                                  0,
                                  6
                                )}...${formData.royaltyRecipient.slice(-4)}`
                              : "Your Wallet"}
                          </span>
                        </div>
                        {formData.royaltyPercentage > 0 && (
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                              You'll earn {formData.royaltyPercentage}% from
                              every future sale of this NFT
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Transaction Fees */}
                    <motion.div
                      className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/30"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <FiShield className="w-6 h-6 mr-3 text-amber-500" />
                        Transaction Fees
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                          <div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              Platform Fee
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              One-time listing cost
                            </p>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            {listingPrice} ETH
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
                          <div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              Gas Fee
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Blockchain transaction cost
                            </p>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Estimated at confirmation
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Final Validation */}
                    <motion.div
                      className={`rounded-2xl p-6 border ${
                        isStepValid(3)
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/30"
                          : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/30"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center space-x-3">
                        {isStepValid(3) ? (
                          <>
                            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                              <FiCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-green-800 dark:text-green-200 font-bold text-lg">
                                Ready to Mint!
                              </p>
                              <p className="text-green-600 dark:text-green-300 text-sm">
                                All requirements met. Your NFT is ready to be
                                created on the blockchain.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
                              <FiAlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-red-800 dark:text-red-200 font-bold text-lg">
                                Missing Requirements
                              </p>
                              <p className="text-red-600 dark:text-red-300 text-sm">
                                Please complete all required fields before
                                minting your NFT.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="flex justify-between mt-8 lg:mt-12">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowLeft className="w-5 h-5" />
                    <span>Back to Pricing</span>
                  </motion.button>
                  <motion.button
                    onClick={handleCreate}
                    disabled={loading || !isConnected || !isStepValid(3)}
                    className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-10 py-4 rounded-2xl font-bold hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-3 shadow-2xl hover:shadow-3xl"
                    whileHover={{
                      scale: loading ? 1 : 1.05,
                      y: loading ? 0 : -2,
                    }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Minting NFT...</span>
                      </>
                    ) : (
                      <>
                        <FiZap className="w-6 h-6" />
                        <span>Mint NFT</span>
                        <FiStar className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm"
        >
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Need Help Creating Your NFT?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FiImage,
                title: "Image Guidelines",
                description:
                  "Use high-quality images (JPG, PNG, GIF, WebP) under 10MB. Square format (1:1 ratio) works best for most marketplaces.",
                color: "blue",
              },
              {
                icon: FiDollarSign,
                title: "Pricing Strategy",
                description:
                  "Research similar NFTs for competitive pricing. You can always adjust prices later. Consider starting with modest prices to build reputation.",
                color: "green",
              },
              {
                icon: FiPercent,
                title: "Royalty Best Practices",
                description:
                  "Industry standard is 5-7.5%. Higher royalties may deter buyers. Remember, royalties apply to all future sales automatically.",
                color: "purple",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`text-center p-6 bg-gradient-to-br ${
                  item.color === "blue"
                    ? "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                    : item.color === "green"
                    ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                    : "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
                } rounded-2xl border ${
                  item.color === "blue"
                    ? "border-blue-200/50 dark:border-blue-700/30"
                    : item.color === "green"
                    ? "border-green-200/50 dark:border-green-700/30"
                    : "border-purple-200/50 dark:border-purple-700/30"
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${
                    item.color === "blue"
                      ? "from-blue-500 to-blue-600"
                      : item.color === "green"
                      ? "from-green-500 to-green-600"
                      : "from-purple-500 to-purple-600"
                  } rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h5 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  {item.title}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Connection Status Warning */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-3xl p-8 border border-red-200/50 dark:border-red-700/30 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FiAlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                  Wallet Connection Required
                </h4>
                <p className="text-red-600 dark:text-red-300 leading-relaxed">
                  Please connect your wallet to create and mint NFTs. Your
                  wallet is required to sign transactions and establish
                  ownership of your digital assets on the blockchain.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #2563eb);
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Layout>
  );
}
