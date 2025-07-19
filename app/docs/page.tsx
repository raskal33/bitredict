"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  DocumentTextIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CogIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  BeakerIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const docCategories = [
    {
      id: "all",
      name: "All Documentation",
      icon: DocumentTextIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "guides",
      name: "Guides",
      icon: BookOpenIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "technical",
      name: "Technical",
      icon: CogIcon,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "api",
      name: "API Reference",
      icon: AcademicCapIcon,
      color: "from-orange-500 to-red-500"
    }
  ];

  const documentation = [
    {
      title: "Introduction",
      description: "Get started with BitRedict prediction markets",
      href: "/docs/intro.html",
      category: "guides",
      icon: BookOpenIcon,
      featured: true
    },
    {
      title: "Architecture Overview",
      description: "Understanding the system architecture and components",
      href: "/docs/architecture.html",
      category: "technical",
      icon: CogIcon,
      featured: true
    },
    {
      title: "Prediction Markets",
      description: "How prediction markets work and how to participate",
      href: "/docs/prediction-markets.html",
      category: "guides",
      icon: ChartBarIcon,
      featured: true
    },
    {
      title: "Oracle System",
      description: "Understanding the decentralized oracle infrastructure",
      href: "/docs/oracle-system.html",
      category: "technical",
      icon: ShieldCheckIcon,
      featured: false
    },
    {
      title: "Reputation System",
      description: "How reputation and scoring works in the platform",
      href: "/docs/reputation-system.html",
      category: "guides",
      icon: UserGroupIcon,
      featured: false
    },
    {
      title: "Tokenomics",
      description: "Token economics and distribution mechanisms",
      href: "/docs/tokenomics/",
      category: "technical",
      icon: CurrencyDollarIcon,
      featured: false
    },
    {
      title: "API Documentation",
      description: "Complete API reference for developers",
      href: "/docs/api/",
      category: "api",
      icon: AcademicCapIcon,
      featured: false
    },
    {
      title: "Contract Integration",
      description: "Smart contract integration guide",
      href: "/docs/contracts/",
      category: "technical",
      icon: BeakerIcon,
      featured: false
    },
    {
      title: "Examples",
      description: "Practical examples and use cases",
      href: "/docs/examples.html",
      category: "guides",
      icon: RocketLaunchIcon,
      featured: false
    },
    {
      title: "Vision & Roadmap",
      description: "Future plans and development roadmap",
      href: "/docs/vision.html",
      category: "guides",
      icon: RocketLaunchIcon,
      featured: false
    },
    {
      title: "Glossary",
      description: "Key terms and definitions",
      href: "/docs/glossary.html",
      category: "guides",
      icon: BookOpenIcon,
      featured: false
    }
  ];

  const filteredDocs = selectedCategory === "all" 
    ? documentation 
    : documentation.filter(doc => doc.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-white">Documentation</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Comprehensive guides, API references, and technical documentation for the BitRedict platform
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {docCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              selectedCategory === category.id
                ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/30"
            }`}
          >
            <category.icon className="w-5 h-5" />
            {category.name}
          </button>
        ))}
      </motion.div>

      {/* Documentation Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredDocs.map((doc, index) => (
          <motion.div
            key={doc.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="group"
          >
            <Link href={doc.href} target="_blank" rel="noopener noreferrer">
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 h-full hover:bg-gray-700/30 transition-all duration-300 hover:border-cyan-500/30 group-hover:shadow-lg group-hover:shadow-cyan-500/10">
                <div className="flex items-start justify-between mb-4">
                  <doc.icon className="w-8 h-8 text-cyan-400" />
                  {doc.featured && (
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {doc.description}
                </p>
                <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
                  Read more
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/docs/intro.html" 
            target="_blank"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all"
          >
            <BookOpenIcon className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="font-medium text-white">Getting Started</div>
              <div className="text-sm text-gray-400">Quick setup guide</div>
            </div>
          </Link>
          <Link 
            href="/docs/api/" 
            target="_blank"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all"
          >
            <AcademicCapIcon className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="font-medium text-white">API Reference</div>
              <div className="text-sm text-gray-400">Developer documentation</div>
            </div>
          </Link>
          <Link 
            href="/docs/examples.html" 
            target="_blank"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all"
          >
            <RocketLaunchIcon className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="font-medium text-white">Examples</div>
              <div className="text-sm text-gray-400">Practical use cases</div>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 