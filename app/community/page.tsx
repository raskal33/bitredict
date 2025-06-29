"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AnimatedTitle from "@/components/AnimatedTitle";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  HeartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  UsersIcon as UsersSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
} from "@heroicons/react/24/solid";

const statsData = [
  {
    title: "Active Discussions",
    value: "12",
    subtitle: "Live conversations",
    icon: ChatBubbleLeftRightIcon,
    gradient: "from-primary to-blue-500",
    iconColor: "text-primary",
    glowColor: "glow-cyan"
  },
  {
    title: "Community Members",
    value: "48",
    subtitle: "Growing strong",
    icon: UsersIcon,
    gradient: "from-secondary to-purple-500", 
    iconColor: "text-secondary",
    glowColor: "glow-magenta"
  },
  {
    title: "Total Comments",
    value: "156",
    subtitle: "Engaging content",
    icon: SparklesIcon,
    gradient: "from-green-400 to-blue-500",
    iconColor: "text-green-400", 
    glowColor: "glow-violet"
  },
];

const guidelinesData = [
  {
    icon: HeartIcon,
    title: "Be Respectful",
    description: "Treat all community members with respect and consideration",
    color: "text-red-400"
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Stay On Topic",
    description: "Contribute meaningfully to discussions and stay relevant",
    color: "text-blue-400"
  },
  {
    icon: StarIcon,
    title: "No Spam",
    description: "Avoid spam, advertising, or excessive self-promotion",
    color: "text-yellow-400"
  },
  {
    icon: TrophyIcon,
    title: "Respect Privacy",
    description: "Maintain privacy and confidentiality at all times",
    color: "text-green-400"
  }
];

export default function Page() {
  const [activeSection, setActiveSection] = useState<"overview" | "guidelines">("overview");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
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

        <div className="relative z-10 mb-8">
          <AnimatedTitle 
            size="lg"
            leftIcon={UsersSolid}
            rightIcon={ChatSolid}
          >
            Community Hub
          </AnimatedTitle>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-text-secondary max-w-2xl mx-auto text-center"
          >
            Join discussions, share insights, and connect with fellow members of the BitRedict community.
          </motion.p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`glass-card text-center bg-gradient-to-br ${stat.gradient}/10 border-2 border-transparent hover:border-white/10 hover:${stat.glowColor} transition-all duration-300`}
            >
              <IconComponent className={`h-12 w-12 mx-auto mb-4 ${stat.iconColor}`} />
              <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">{stat.title}</p>
              <p className="text-sm text-text-muted">{stat.subtitle}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-4"
      >
        <button
          onClick={() => setActiveSection("overview")}
          className={`px-6 py-3 rounded-button font-medium transition-all duration-200 ${
            activeSection === "overview"
              ? "bg-gradient-primary text-black shadow-button"
              : "glass-card text-text-secondary hover:text-text-primary"
          }`}
        >
          Community Overview
        </button>
        <button
          onClick={() => setActiveSection("guidelines")}
          className={`px-6 py-3 rounded-button font-medium transition-all duration-200 ${
            activeSection === "guidelines"
              ? "bg-gradient-primary text-black shadow-button"
              : "glass-card text-text-secondary hover:text-text-primary"
          }`}
        >
          Community Guidelines
        </button>
      </motion.div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold gradient-text mb-4">Welcome to Our Community</h3>
              <p className="text-text-secondary max-w-3xl mx-auto">
                Our vibrant community is the heart of BitRedict. Here, predictors, analysts, and enthusiasts come together to share knowledge, discuss strategies, and celebrate wins. Whether you&apos;re a seasoned predictor or just starting your journey, you&apos;ll find your place here.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/20"
              >
                <ChartBarIcon className="h-8 w-8 text-primary mb-3" />
                <h4 className="text-lg font-semibold text-text-primary mb-2">Market Discussions</h4>
                <p className="text-text-muted text-sm">
                  Engage in deep discussions about market trends, prediction strategies, and upcoming events.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card bg-gradient-to-br from-secondary/5 to-purple-500/5 border border-secondary/20"
              >
                <TrophyIcon className="h-8 w-8 text-secondary mb-3" />
                <h4 className="text-lg font-semibold text-text-primary mb-2">Success Stories</h4>
                <p className="text-text-muted text-sm">
                  Share your biggest wins and learn from the experiences of top performers.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeSection === "guidelines" && (
          <motion.div
            key="guidelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <h3 className="text-2xl font-bold gradient-text text-center mb-6">Community Guidelines</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guidelinesData.map((guideline, index) => {
                const IconComponent = guideline.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card bg-gradient-to-br from-white/5 to-white/10 border border-white/10"
                  >
                    <IconComponent className={`h-8 w-8 ${guideline.color} mb-3`} />
                    <h4 className="text-lg font-semibold text-text-primary mb-2">{guideline.title}</h4>
                    <p className="text-text-muted text-sm">{guideline.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center glass-card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-transparent hover:border-white/20 transition-all duration-300"
      >
        <FireIcon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold gradient-text mb-2">Ready to Join the Conversation?</h3>
        <p className="text-text-muted mb-4">
          Select a discussion thread to get started or create your own topic to engage with the community.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-primary text-black font-medium rounded-button shadow-button hover:shadow-button-hover transition-all duration-200"
        >
          Start Engaging
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
