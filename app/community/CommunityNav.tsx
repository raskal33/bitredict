"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiMessageSquare, FiUsers, FiCalendar } from "react-icons/fi";

const navItems = [
  {
    name: "Discussions",
    href: "/community",
    icon: <FiMessageSquare />
  },
  {
    name: "Members",
    href: "/community/members",
    icon: <FiUsers />
  },
  {
    name: "Events",
    href: "/community/events",
    icon: <FiCalendar />
  }
];

export default function CommunityNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 overflow-x-auto">
      <nav className="flex min-w-max gap-1 rounded-lg bg-bg-card p-1">
        {navItems.map((item) => {
          const isActive = 
            item.href === "/community" 
              ? pathname === "/community" || pathname.startsWith("/community/") && !navItems.find(ni => ni.href !== "/community" && pathname.startsWith(ni.href))
              : pathname.startsWith(item.href);
              
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-black shadow-glow-cyan"
                  : "text-text-muted hover:bg-bg-card hover:text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
