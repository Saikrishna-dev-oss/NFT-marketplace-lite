import { motion } from "framer-motion";
import { FiLoader, FiZap, FiStar, FiHeart } from "react-icons/fi";

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  variant = "default",
  color = "purple",
  showIcon = false,
}) {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const iconSizes = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
    "2xl": "w-8 h-8",
  };

  const colorSchemes = {
    purple: {
      border:
        "border-purple-200/50 dark:border-purple-800/50 border-t-purple-500",
      gradient: "from-purple-500 via-blue-500 to-cyan-400",
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      ring: "ring-purple-500/20",
    },
    blue: {
      border: "border-blue-200/50 dark:border-blue-800/50 border-t-blue-500",
      gradient: "from-blue-500 via-cyan-500 to-teal-400",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      ring: "ring-blue-500/20",
    },
    green: {
      border: "border-green-200/50 dark:border-green-800/50 border-t-green-500",
      gradient: "from-green-500 via-emerald-500 to-teal-400",
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      ring: "ring-green-500/20",
    },
    orange: {
      border:
        "border-orange-200/50 dark:border-orange-800/50 border-t-orange-500",
      gradient: "from-orange-500 via-amber-500 to-yellow-400",
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      ring: "ring-orange-500/20",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.purple;

  const variants = {
    // Default spinner
    default: (
      <div
        className={`${sizes[size]} border-4 ${scheme.border} rounded-full animate-spin`}
      />
    ),

    // Gradient spinner with glow
    gradient: (
      <div className="relative">
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-r ${scheme.gradient} animate-spin`}
        >
          <div
            className={`${sizes[size]} rounded-full bg-white dark:bg-gray-900 m-1`}
            style={{
              width: "calc(100% - 8px)",
              height: "calc(100% - 8px)",
            }}
          />
        </div>
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full bg-gradient-to-r ${scheme.gradient} opacity-20 blur-lg animate-pulse`}
        />
      </div>
    ),

    // Dots animation
    dots: (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`bg-gradient-to-r ${scheme.gradient} rounded-full`}
            style={{
              width:
                size === "xs"
                  ? "4px"
                  : size === "sm"
                  ? "6px"
                  : size === "md"
                  ? "8px"
                  : size === "lg"
                  ? "10px"
                  : "12px",
              height:
                size === "xs"
                  ? "4px"
                  : size === "sm"
                  ? "6px"
                  : size === "md"
                  ? "8px"
                  : size === "lg"
                  ? "10px"
                  : "12px",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    ),

    // Pulse animation
    pulse: (
      <div className="relative">
        <motion.div
          className={`${sizes[size]} bg-gradient-to-r ${scheme.gradient} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <motion.div
          className={`absolute inset-0 ${sizes[size]} bg-gradient-to-r ${scheme.gradient} rounded-full opacity-30`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>
    ),

    // Ring animation
    ring: (
      <div className="relative">
        <motion.div
          className={`${sizes[size]} border-4 border-transparent rounded-full`}
          style={{
            background: `conic-gradient(from 0deg, transparent, rgb(139, 92, 246), transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div
          className={`absolute inset-1 bg-white dark:bg-gray-900 rounded-full`}
        />
      </div>
    ),

    // Premium animated spinner
    premium: (
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full border-4 border-transparent bg-gradient-to-r ${scheme.gradient} p-1`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className={`w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center`}
          >
            <motion.div
              className={`bg-gradient-to-r ${scheme.gradient} rounded-full`}
              style={{
                width:
                  size === "xs"
                    ? "6px"
                    : size === "sm"
                    ? "8px"
                    : size === "md"
                    ? "12px"
                    : size === "lg"
                    ? "16px"
                    : "20px",
                height:
                  size === "xs"
                    ? "6px"
                    : size === "sm"
                    ? "8px"
                    : size === "md"
                    ? "12px"
                    : size === "lg"
                    ? "16px"
                    : "20px",
              }}
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>
        <motion.div
          className={`absolute inset-0 ${sizes[size]} rounded-full bg-gradient-to-r ${scheme.gradient} opacity-20 blur-md`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>
    ),
  };

  const getIcon = () => {
    switch (color) {
      case "purple":
        return FiZap;
      case "blue":
        return FiLoader;
      case "green":
        return FiHeart;
      case "orange":
        return FiStar;
      default:
        return FiLoader;
    }
  };

  const IconComponent = getIcon();

  return (
    <motion.div
      className="flex flex-col items-center justify-center space-y-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Spinner */}
      <div className="relative">{variants[variant] || variants.default}</div>

      {/* Text and Icon */}
      {text && (
        <motion.div
          className="flex flex-col items-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {showIcon && (
            <div
              className={`${scheme.bg} p-2 rounded-xl ${scheme.ring} ring-4`}
            >
              <IconComponent className={`${iconSizes[size]} ${scheme.text}`} />
            </div>
          )}
          <p
            className={`${textSizes[size]} ${scheme.text} font-semibold text-center max-w-xs`}
          >
            {text}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Export specialized loading components for common use cases
export const NFTLoadingSpinner = ({ text = "Loading NFTs..." }) => (
  <LoadingSpinner
    size="lg"
    variant="premium"
    color="purple"
    text={text}
    showIcon={true}
  />
);

export const TransactionSpinner = ({ text = "Processing transaction..." }) => (
  <LoadingSpinner
    size="md"
    variant="gradient"
    color="blue"
    text={text}
    showIcon={true}
  />
);

export const MetadataSpinner = ({ text = "Loading metadata..." }) => (
  <LoadingSpinner size="md" variant="dots" color="green" text={text} />
);

export const ImageSpinner = ({ text = "Loading image..." }) => (
  <LoadingSpinner size="sm" variant="pulse" color="orange" text={text} />
);
