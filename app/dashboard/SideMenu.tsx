"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  BellIcon,
  Cog6ToothIcon,
  UserIcon,
  WalletIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarSolid,
  BanknotesIcon as BanknotesIconSolid,
  PresentationChartLineIcon as PresentationChartLineSolid,
  BellIcon as BellSolid,
  Cog6ToothIcon as Cog6ToothSolid,
  UserIcon as UserSolid,
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid,
  WalletIcon as WalletSolid
} from "@heroicons/react/24/solid";

export default function SideMenu() {
  const segment = useSelectedLayoutSegment();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full xl:w-80 shrink-0"
    >
      <div className="glass-card p-6 sticky top-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Dashboard</h2>
          <p className="text-sm text-text-muted">Manage your prediction portfolio</p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {links.map((link, index) => {
            const isActive = link.segment === segment;
            const IconOutline = link.icon;
            const IconSolid = link.iconSolid;
            
            return (
              <motion.div
                key={link.segment || 'overview'}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={link.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-primary text-black shadow-button`
                      : `text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)] hover:border-primary/20`
                  }`}
                >
                  <div className={`transition-colors duration-200 ${
                    isActive ? 'text-black' : 'text-text-muted group-hover:text-primary'
                  }`}>
                    {isActive ? (
                      <IconSolid className="h-5 w-5" />
                    ) : (
                      <IconOutline className="h-5 w-5" />
                    )}
                  </div>
                  
                  <span className="font-medium">{link.label}</span>
                  
                  {link.badge && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive 
                        ? 'bg-black/20 text-black' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-border-card"
        >
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrophySolid className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-text-muted">Win Rate</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">68.1%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BanknotesIconSolid className="h-4 w-4 text-green-400" />
                <span className="text-xs text-text-muted">Total P&L</span>
              </div>
              <span className="text-sm font-semibold text-green-400">+640 SOL</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FireSolid className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-text-muted">Active Pools</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">5</span>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6"
        >
          <Link
            href="/create-prediction"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-primary text-black rounded-button font-semibold shadow-button hover:brightness-110 hover:scale-105 transition-all duration-200"
          >
            <BeakerIcon className="h-4 w-4" />
            Create Pool
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

const links = [
  { 
    label: "Overview", 
    href: "/dashboard", 
    segment: null,
    icon: ChartBarIcon,
    iconSolid: ChartBarSolid,
    badge: null
  },
  {
    label: "Portfolio",
    href: "/dashboard/financial-summary",
    segment: "financial-summary",
    icon: WalletIcon,
    iconSolid: WalletSolid,
    badge: "5"
  },
  {
    label: "Analytics",
    href: "/dashboard/performance-charts",
    segment: "performance-charts",
    icon: PresentationChartLineIcon,
    iconSolid: PresentationChartLineSolid,
    badge: null
  },
  {
    label: "Activity",
    href: "/dashboard/notifications",
    segment: "notifications",
    icon: BellIcon,
    iconSolid: BellSolid,
    badge: "3"
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    segment: "profile",
    icon: UserIcon,
    iconSolid: UserSolid,
    badge: null
  },
  { 
    label: "Settings", 
    href: "/dashboard/settings", 
    segment: "settings",
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothSolid,
    badge: null
  },
];
