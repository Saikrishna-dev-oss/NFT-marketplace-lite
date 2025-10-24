import { motion } from "framer-motion";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  isLoading = false,
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  const bgColorClasses = {
    blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    purple:
      "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
    green:
      "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    orange:
      "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
    red: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    indigo:
      "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-gradient-to-br ${bgColorClasses[color]} p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {trend && trendValue && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            <span>{trend === "up" ? "↗" : "↘"}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </h3>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
