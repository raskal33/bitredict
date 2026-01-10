"use client";

import Link from "next/link";
import Image from "next/image";
import { SocialIcons } from "@/components/icons/SocialIcons";
import { Zap, ShieldCheck } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navGroups = [
    {
      title: "Neural Streams",
      links: [
        { name: "All Sectors", href: "/markets" },
        { name: "Initiate Pool", href: "/create-prediction" },
        { name: "Yield Module", href: "/staking" },
        { name: "Oddyssey", href: "/oddyssey" },
      ]
    },
    {
      title: "System Nodes",
      links: [
        { name: "Terminal Hub", href: "/dashboard" },
        { name: "Neural Identity", href: "/profile" },
        { name: "Neural Rank", href: "/leaderboard" },
        { name: "Signal Pulses", href: "/community" },
      ]
    },
    {
      title: "Protocols",
      links: [
        { name: "Documentation", href: "#" },
        { name: "Audit Reports", href: "#" },
        { name: "Somnia Scan", href: "#" },
        { name: "Governance", href: "#" },
      ]
    }
  ];

  return (
    <footer className="relative mt-24 border-t border-white/5 bg-[#0A0A1A]">
      {/* Background Cybernetic elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #22C7FF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="container-nav py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 pb-16">
          {/* Brand Engine */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
            <Link href="/" className="inline-block group">
              <div className="relative">
                <div className="absolute -inset-2 bg-somnia-cyan/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Image
                  src="/logo.png"
                  alt="BitRedict"
                  width={180}
                  height={45}
                  className="relative z-10 logo-color-shift h-auto opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>

            <p className="text-text-muted text-xs font-medium max-w-sm leading-relaxed uppercase tracking-wider opacity-60 italic">
              Synchronizing global prediction streams on the Somnia Network. Your decentralized gateway to future outcomes.
            </p>

            <div className="flex items-center gap-6">
              <SocialIcons />
            </div>

            <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="p-2 bg-somnia-cyan/10 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-somnia-cyan" />
              </div>
              <div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest">Protocol Secured</p>
                <p className="text-[8px] text-text-muted/40 uppercase tracking-widest">Neural Protection v1.4.2</p>
              </div>
            </div>
          </div>

          {/* Grid Navigation */}
          <div className="lg:col-span-12 xl:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-6">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap className="w-3 h-3 text-somnia-cyan" />
                    {group.title}
                  </h3>
                  <ul className="space-y-4">
                    {group.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-[10px] text-text-muted/60 hover:text-somnia-cyan transition-all duration-300 uppercase tracking-widest font-black block group"
                        >
                          <span className="group-hover:translate-x-1 transition-transform inline-block">
                            {link.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-[9px] font-black text-text-muted/40 uppercase tracking-widest">
            <span>© {currentYear} BitRedict Terminal</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <Link href="#" className="hover:text-white transition-colors">Neural Assets Policy</Link>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <Link href="#" className="hover:text-white transition-colors">System Disclosure</Link>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
            <span className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest">Powered by</span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-gradient-to-r from-somnia-cyan to-somnia-violet bg-clip-text text-transparent">Somnia Network</span>
            <div className="w-1.5 h-1.5 rounded-full bg-somnia-cyan animate-pulse shadow-[0_0_8px_rgba(34,199,255,1)]"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
