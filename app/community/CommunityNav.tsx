"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  {
    name: "Neural Signals",
    href: "/community",
    icon: MessageSquare,
    segment: null
  },
  {
    name: "Nexus Residents",
    href: "/community/members",
    icon: Users,
    segment: "members"
  },
  {
    name: "Protocol Events",
    href: "/community/events",
    icon: Zap,
    segment: "events"
  }
];

export default function CommunityNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-[20px] bg-white/[0.03] border border-white/5 w-fit max-w-full overflow-x-auto scrollbar-none">
      {navItems.map((item) => {
        const isActive = item.segment
          ? pathname.includes(item.segment)
          : pathname === "/community" || (pathname.startsWith("/community/") && !pathname.includes("members") && !pathname.includes("events"));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isActive
              ? "text-black"
              : "text-text-muted hover:text-white hover:bg-white/5"
              }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-community-tab"
                className="absolute inset-0 bg-somnia-cyan rounded-[14px] shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">
              <item.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-current opacity-60'}`} />
            </span>
            <span className="relative z-10 whitespace-nowrap">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
