import { motion } from "framer-motion";

interface PageTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({
  children,
  subtitle,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`text-center relative mb-6 ${className}`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[20%] left-[15%] w-6 h-6 bg-primary/20 rounded-full blur-sm"
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[60%] right-[20%] w-4 h-4 bg-secondary/30 rounded-full blur-sm"
          animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-[30%] left-[70%] w-5 h-5 bg-accent/25 rounded-full blur-sm"
          animate={{ y: [-8, 8, -8], x: [-3, 3, -3], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            {children}
          </span>
        </h1>
        <div className="w-24 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
        
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base text-text-secondary max-w-2xl mx-auto mt-2"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default PageTitle; 