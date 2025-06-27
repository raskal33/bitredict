"use client";

import Link from "next/link";
import Button from "@/components/button";
import { useSelectedLayoutSegment } from "next/navigation";
import { FaHome, FaHistory, FaChartBar, FaUsers } from "react-icons/fa";

export default function Nav() {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="flex flex-wrap justify-center gap-3 glass-card p-2 rounded-lg">
      {links.map((e, i) => (
        <Link key={i} href={e.href} className="flex-1 min-w-[120px]">
          <Button 
            variant={e.segment == segment ? "primary" : "ghost"} 
            fullWidth
            size="md"
            leftIcon={e.icon}
            className={`${e.segment == segment ? "" : "hover:bg-dark-2"}`}
          >
            {e.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}

const links = [
  { 
    label: "Overview", 
    href: "/profile", 
    segment: null,
    icon: <FaHome />
  },
  {
    label: "Betting History",
    href: "/profile/betting-history",
    segment: "betting-history",
    icon: <FaHistory />
  },
  {
    label: "Created Predictions",
    href: "/profile/created-predictions",
    segment: "created-predictions",
    icon: <FaChartBar />
  },
  {
    label: "Community Activity",
    href: "/profile/community-activity",
    segment: "community-activity",
    icon: <FaUsers />
  },
];
