"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion } from "framer-motion";
import {
  Terminal,
  History,
  LayoutGrid,
  Users
} from "lucide-react";

export default function Nav() {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="flex flex-wrap justify-center gap-2 lg:gap-3 p-1.5 lg:p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-somnia-cyan/20 to-transparent"></div>

      {links.map((link, i) => {
        const isActive = link.segment === segment;
        const Icon = link.icon;

        return (
          <Link key={i} href={link.href} className="flex-1 min-w-[140px] relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${isActive
                ? "bg-gradient-to-r from-somnia-cyan/20 to-somnia-blue/10 text-white border border-somnia-cyan/30 shadow-[0_0_20px_rgba(34,199,255,0.1)]"
                : "text-text-muted hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-somnia-cyan text-black shadow-[0_0_15px_rgba(34,199,255,0.5)]' : 'text-text-muted group-hover:text-somnia-cyan'
                }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span>{link.label}</span>

              {isActive && (
                <motion.div
                  layoutId="active-profile-nav"
                  className="absolute inset-0 bg-somnia-cyan/5 rounded-xl -z-10"
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}

const links = [
  {
    label: "Neural Hub",
    href: "/profile",
    segment: null,
    icon: Terminal
  },
  {
    label: "Signal Log",
    href: "/profile/betting-history",
    segment: "betting-history",
    icon: History
  },
  {
    label: "Managed Nodes",
    href: "/profile/created-predictions",
    segment: "created-predictions",
    icon: LayoutGrid
  },
  {
    label: "Social Mesh",
    href: "/profile/community-activity",
    segment: "community-activity",
    icon: Users
  },
];
