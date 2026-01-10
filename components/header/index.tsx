"use client";

import { useWindowScroll } from "@uidotdev/usehooks";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Coins,
  User,
  Flame,
  Trophy,
  ChevronDown,
  Wallet,
  TestTube2,
  FileText,
  Zap,
  TrendingUp,
  Lock,
  LayoutGrid,
  Settings,
  Gift,
  MoreHorizontal,
  Terminal,
  Activity
} from "lucide-react";
import { useProfileStore } from '@/stores/useProfileStore';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import NotificationBadge from "@/components/NotificationBadge";
import { SettingsModal } from "@/components/SettingsModal";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMarketsOpen, setIsMarketsOpen] = useState<boolean>(false);
  const [isBitredictorOpen, setIsBitredictorOpen] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [{ y }] = useWindowScroll();
  const segment = useSelectedLayoutSegment();
  const [isRender, setIsRender] = useState<boolean>(false);

  // Refs for dropdown positioning
  const marketsButtonRef = useRef<HTMLButtonElement>(null);
  const bitredictorButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const walletButtonRef = useRef<HTMLButtonElement>(null);

  // Get dropdown positions for fixed positioning
  const getDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left,
    };
  };

  // Custom wallet connection hook
  const {
    isConnected,
    address,
    isOnSomnia,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToSomnia,
  } = useWalletConnection();
  const { setCurrentProfile } = useProfileStore();

  useEffect(() => {
    setIsRender(true);
  }, []);

  // Update current profile when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      setCurrentProfile(address);
    } else {
      setCurrentProfile(null);
    }
  }, [address, isConnected, setCurrentProfile]);

  const newY = y || 1;
  const isScrolled = newY > 100;

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setIsMarketsOpen(false);
    setIsBitredictorOpen(false);
    setIsMoreOpen(false);
    setIsWalletDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      closeAllDropdowns();
    };

    if (isMarketsOpen || isBitredictorOpen || isMoreOpen || isWalletDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMarketsOpen, isBitredictorOpen, isMoreOpen, isWalletDropdownOpen]);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      closeAllDropdowns();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  if (segment !== "/_not-found") {
    return (
      <>
        <motion.header
          animate={{
            backgroundColor: isScrolled ? "rgba(10, 10, 26, 0.98)" : "rgba(10, 10, 26, 0.4)",
            backdropFilter: isScrolled ? "blur(24px)" : "blur(12px)",
          }}
          className={`${isScrolled ? "fixed shadow-[0_8px_32px_rgba(0,0,0,0.8)]" : "relative"
            } inset-x-0 top-0 z-[100] border-b border-white/5 transition-all duration-500`}
        >
          <div className="container-nav">
            <div className="flex items-center justify-between py-2 min-w-0 gap-3">
              {/* Left Side - Logo */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Neural Hub"
                    width={120}
                    height={40}
                    className="logo-color-shift navbar-logo"
                    priority
                  />
                </Link>
              </div>

              {/* Center - Desktop Navigation - Primary Items */}
              <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center">
                {/* Markets Dropdown */}
                <div className="relative" style={{ zIndex: 1000 }}>
                  <motion.button
                    ref={marketsButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMarketsOpen(!isMarketsOpen);
                      setIsBitredictorOpen(false);
                      setIsMoreOpen(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${segment?.startsWith('markets') || segment === 'markets'
                      ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                      : "text-text-muted hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Markets</span>
                    <motion.div
                      animate={{ rotate: isMarketsOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isMarketsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bg-[#0A0A1A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden min-w-[240px] p-2"
                        style={{
                          zIndex: 1001,
                          top: `${getDropdownPosition(marketsButtonRef).top}px`,
                          left: `${getDropdownPosition(marketsButtonRef).left}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-2">
                          {marketsLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMarketsOpen(false)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group ${segment === link.segment
                                ? "bg-somnia-cyan/10 text-somnia-cyan border border-somnia-cyan/20"
                                : "text-text-muted hover:text-white hover:bg-white/5"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <link.icon className={`h-4 w-4 ${segment === link.segment ? 'text-somnia-cyan' : 'text-text-muted group-hover:text-somnia-cyan'
                                  }`} />
                                <span>{link.label}</span>
                              </div>
                              <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-40 -rotate-90 transition-all font-black" />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Primary Links - Most Important */}
                <Link
                  href="/oddyssey"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${segment === "oddyssey"
                    ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Flame className="h-4 w-4" />
                  <span className="hidden 2xl:inline">Oddyssey</span>
                </Link>

                <Link
                  href="/rewards"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${segment === "rewards"
                    ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span className="hidden 2xl:inline">Rewards</span>
                </Link>

                <Link
                  href="/faucet"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${segment === "faucet"
                    ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <TestTube2 className="h-4 w-4" />
                  <span className="hidden 2xl:inline">Faucet</span>
                </Link>

                <Link
                  href="/airdrop"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${segment === "airdrop"
                    ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Gift className="h-4 w-4" />
                  <span className="hidden 2xl:inline">Airdrop</span>
                </Link>

                {/* Bitredictor Dropdown */}
                <div className="relative" style={{ zIndex: 1000 }}>
                  <motion.button
                    ref={bitredictorButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBitredictorOpen(!isBitredictorOpen);
                      setIsMarketsOpen(false);
                      setIsMoreOpen(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${bitredictorLinks.some(link => segment === link.segment)
                      ? "bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                      : "text-text-muted hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Terminal className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Terminal</span>
                    <motion.div
                      animate={{ rotate: isBitredictorOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isBitredictorOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bg-[#0A0A1A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden min-w-[240px] p-2"
                        style={{
                          zIndex: 1001,
                          top: `${getDropdownPosition(bitredictorButtonRef).top}px`,
                          left: `${getDropdownPosition(bitredictorButtonRef).left}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-2">
                          {bitredictorLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsBitredictorOpen(false)}
                              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 group ${segment === link.segment
                                ? "bg-gradient-primary/20 text-primary border-l-2 border-primary"
                                : "text-text-secondary hover:text-primary hover:bg-bg-card"
                                }`}
                            >
                              <link.icon className={`h-4 w-4 ${segment === link.segment ? 'text-primary' : 'text-text-muted group-hover:text-primary'
                                }`} />
                              <span>{link.label}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* More Dropdown - Secondary Items */}
                <div className="relative" style={{ zIndex: 1000 }}>
                  <motion.button
                    ref={moreButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreOpen(!isMoreOpen);
                      setIsMarketsOpen(false);
                      setIsBitredictorOpen(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-text-secondary hover:text-text-primary hover:bg-bg-card"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="hidden 2xl:inline">More</span>
                    <motion.div
                      animate={{ rotate: isMoreOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isMoreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bg-[#0A0A1A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden min-w-[240px] p-2"
                        style={{
                          zIndex: 1001,
                          top: `${getDropdownPosition(moreButtonRef).top}px`,
                          left: `${getDropdownPosition(moreButtonRef).left}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-2">
                          {moreLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMoreOpen(false)}
                              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 group ${segment === link.segment
                                ? "bg-gradient-primary/20 text-primary border-l-2 border-primary"
                                : "text-text-secondary hover:text-primary hover:bg-bg-card"
                                }`}
                            >
                              <link.icon className={`h-4 w-4 ${segment === link.segment ? 'text-primary' : 'text-text-muted group-hover:text-primary'
                                }`} />
                              <span>{link.label}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Notification Badge */}
                {isConnected && address && isRender && (
                  <div className="hidden sm:block">
                    <NotificationBadge />
                  </div>
                )}

                {/* Wallet Button */}
                {isRender && (
                  <div className="hidden sm:block">
                    {isConnected && address ? (
                      <div className="relative" style={{ zIndex: 1000 }}>
                        <motion.button
                          ref={walletButtonRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsWalletDropdownOpen(!isWalletDropdownOpen);
                            closeAllDropdowns();
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 ${isOnSomnia
                            ? "bg-somnia-cyan/10 border-somnia-cyan/30 text-somnia-cyan shadow-[0_0_15px_rgba(34,199,255,0.1)]"
                            : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full animate-pulse ${isOnSomnia ? 'bg-somnia-cyan shadow-[0_0_8px_rgba(34,199,255,1)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]'}`}></div>
                          <span className="font-black text-[10px] uppercase tracking-tighter hidden md:inline">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </span>
                          <motion.div
                            animate={{ rotate: isWalletDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </motion.div>
                        </motion.button>

                        <AnimatePresence>
                          {isWalletDropdownOpen && walletButtonRef.current && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="fixed bg-[#0A0A1A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden min-w-[200px] p-2"
                              style={{
                                zIndex: 1001,
                                top: `${walletButtonRef.current.getBoundingClientRect().bottom + 12}px`,
                                right: `${window.innerWidth - walletButtonRef.current.getBoundingClientRect().right}px`
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-1">
                                {!isOnSomnia && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchToSomnia();
                                      setIsWalletDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-400 hover:bg-orange-500/10 transition-all border border-transparent hover:border-orange-500/20"
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    Switch Protocol
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    disconnectWallet();
                                    setIsWalletDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-somnia-magenta hover:bg-somnia-magenta/10 transition-all border border-transparent hover:border-somnia-magenta/20"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Kill Session
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border border-somnia-cyan/40 text-somnia-cyan hover:bg-somnia-cyan hover:text-black shadow-[0_0_15px_rgba(34,199,255,0.2)] hover:shadow-[0_0_25px_rgba(34,199,255,0.4)] disabled:opacity-50"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="hidden md:inline">{isConnecting ? 'Linking...' : 'Connect Node'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Create Market Button */}
                <Link href="/create-prediction" className="hidden md:block flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 0, 128, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl bg-somnia-magenta text-white shadow-[0_0_15px_rgba(255,0,128,0.2)]"
                  >
                    <span className="hidden lg:inline">Create Pool</span>
                    <span className="lg:hidden">Create</span>
                  </motion.button>
                </Link>

                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hidden md:flex items-center justify-center p-2.5 rounded-xl text-text-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  title="Config"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => {
                    if (!isMenuOpen) {
                      setIsMenuOpen(true);
                    } else {
                      handleClose();
                    }
                  }}
                  className="xl:hidden relative z-50 p-2.5 rounded-xl bg-white/5 text-text-muted hover:text-white transition-all border border-white/10"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                  <AnimatePresence mode="wait">
                    {isMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] xl:hidden"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 h-full w-[320px] bg-[#0A0A1A]/95 border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full uppercase tracking-widest font-black">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-2" onClick={handleClose}>
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={40}
                        className="logo-color-shift"
                        priority
                      />
                    </Link>
                    <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Streams */}
                  <nav className="flex-1 p-6 overflow-y-auto space-y-8 text-[10px]">
                    {/* Core Streams */}
                    <div>
                      <h3 className="text-[9px] text-text-muted/40 mb-4 px-2 tracking-[0.3em]">Core Streams</h3>
                      <div className="space-y-1.5">
                        <Link
                          href="/markets"
                          onClick={handleClose}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${segment?.startsWith('markets') || segment === 'markets'
                            ? "bg-somnia-cyan text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <Activity className="h-4 w-4" />
                          <span>All Streams</span>
                        </Link>
                        <Link
                          href="/oddyssey"
                          onClick={handleClose}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${segment === "oddyssey"
                            ? "bg-somnia-cyan text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <Flame className="h-4 w-4" />
                          <span>Oddyssey</span>
                        </Link>
                        <Link
                          href="/rewards"
                          onClick={handleClose}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${segment === "rewards"
                            ? "bg-somnia-cyan text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <Trophy className="h-4 w-4" />
                          <span>Rewards</span>
                        </Link>
                      </div>
                    </div>

                    {/* Terminal Section */}
                    <div>
                      <h3 className="text-[9px] text-text-muted/40 mb-4 px-2 tracking-[0.3em]">Terminal Hub</h3>
                      <div className="space-y-1.5">
                        {bitredictorLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleClose}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${segment === link.segment
                              ? "bg-somnia-cyan text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                              : "text-text-muted hover:text-white hover:bg-white/5"
                              }`}
                          >
                            <link.icon className="h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Protocol Links */}
                    <div className="space-y-2 pt-6 border-t border-white/5">
                      <Link href="/create-prediction" onClick={handleClose}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-4 rounded-2xl bg-somnia-magenta text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(255,0,128,0.2)]"
                        >
                          Initialize Pool
                        </motion.button>
                      </Link>

                      {isRender && (
                        isConnected && address ? (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-mono lowercase tracking-normal text-text-muted truncate">
                              <div className={`w-1.5 h-1.5 rounded-full ${isOnSomnia ? 'bg-somnia-cyan shadow-[0_0_8px_rgba(34,199,255,0.8)]' : 'bg-orange-500'}`}></div>
                              {address}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                disconnectWallet();
                              }}
                              className="w-full py-3.5 rounded-2xl border border-white/10 text-text-muted hover:text-white transition-all text-[9px]"
                            >
                              Disconnect Node
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              connectWallet();
                            }}
                            disabled={isConnecting}
                            className="w-full py-4 rounded-2xl border border-somnia-cyan/40 text-somnia-cyan text-[10px] font-black uppercase tracking-[0.2em] hover:bg-somnia-cyan hover:text-black transition-all"
                          >
                            Sync Node
                          </button>
                        )
                      )}
                    </div>
                  </nav>

                  {/* Device Status */}
                  <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between text-[8px] text-text-muted/40">
                      <p>System v1.0.4</p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-somnia-cyan"></span>
                        Online
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }
}

// Bitredictor Links - User Account & Community
const bitredictorLinks = [
  {
    label: "Terminal Hub",
    href: "/dashboard",
    segment: "dashboard",
    icon: Terminal,
  },
  {
    label: "Neural Identity",
    href: "/profile",
    segment: "profile",
    icon: User,
  },
  {
    label: "Neural Rank",
    href: "/leaderboard",
    segment: "leaderboard",
    icon: Trophy,
  },
  {
    label: "Node Network",
    href: "/community",
    segment: "community",
    icon: Users,
  },
];

// Markets Links
const marketsLinks = [
  {
    label: "All Streams",
    href: "/markets",
    segment: "markets",
    icon: Activity,
  },
  {
    label: "Boosted Flows",
    href: "/markets/boosted",
    segment: "boosted",
    icon: Zap,
  },
  {
    label: "Trending Signal",
    href: "/markets/trending",
    segment: "trending",
    icon: TrendingUp,
  },
  {
    label: "Private Channel",
    href: "/markets/private",
    segment: "private",
    icon: Lock,
  },
  {
    label: "Combo Protocol",
    href: "/markets/combo",
    segment: "combo",
    icon: LayoutGrid,
  },
];

// More Links - Secondary Features
const moreLinks = [
  {
    label: "Telemetry",
    href: "/stats",
    segment: "stats",
    icon: Activity,
  },
  {
    label: "Yield Module",
    href: "/staking",
    segment: "staking",
    icon: Coins,
  },
  {
    label: "Archive",
    href: "/docs",
    segment: "docs",
    icon: FileText,
  },
];
