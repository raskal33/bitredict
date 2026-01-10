"use client";

import { usePathname } from "next/navigation";
import CommunityNav from "./CommunityNav";
import { motion } from "framer-motion";
import { Users, MessageSquare, Shield, Zap } from "lucide-react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Thematic titles based on path
  const getHeaderInfo = () => {
    if (pathname.includes("/members")) return { title: "Nexus Residents", icon: Users, subtitle: "Verified node operators and community leaders." };
    if (pathname.includes("/events")) return { title: "Protocol Events", icon: Zap, subtitle: "Neural synchronization windows and community challenges." };
    return { title: "Neural Collective", icon: MessageSquare, subtitle: "Encrypted community signal exchange and collective intelligence." };
  };

  const { title, icon: Icon, subtitle } = getHeaderInfo();

  return (
    <section className="container mx-auto px-4 py-8 lg:py-16 space-y-10">
      {/* Community Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#0A0A1A] border border-white/5 p-8 lg:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-somnia-blue/10 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-somnia-violet/10 blur-[120px] rounded-full -ml-64 -mb-64" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-somnia-cyan">
              <div className="p-2 rounded-lg bg-somnia-cyan/10 border border-somnia-cyan/20">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sector: Intelligence</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">
              {title.split(' ')[0]} <span className="text-somnia-cyan">{title.split(' ')[1]}</span>
            </h1>
            <p className="text-text-muted text-sm max-w-xl font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-6 pb-2">
            <div className="text-right">
              <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2 text-somnia-cyan">
                <div className="w-1.5 h-1.5 rounded-full bg-somnia-cyan animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Live Node</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mb-1">Security</div>
              <div className="flex items-center gap-2 text-somnia-violet">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-black uppercase tracking-widest">Level 4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <CommunityNav />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[500px]"
        >
          {children}
        </motion.main>
      </div>
    </section>
  );
}
