"use client";

import { useWindowScroll } from "@uidotdev/usehooks";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Bars3Icon, 
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  UserIcon,
  FireIcon,
  TrophyIcon,
  ChevronDownIcon,
  CubeTransparentIcon,
  WalletIcon,
  BeakerIcon,
  DocumentTextIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  GiftIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
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
            backgroundColor: isScrolled ? "rgba(10, 10, 26, 0.95)" : "rgba(10, 10, 26, 0.8)",
            backdropFilter: isScrolled ? "blur(20px)" : "blur(10px)",
          }}
          className={`${
            isScrolled ? "fixed shadow-card" : "relative"
          } inset-x-0 top-0 z-[100] border-b border-border-card transition-all duration-300 nav-glass`}
        >
          <div className="container-nav">
            <div className="flex items-center justify-between py-2 min-w-0 gap-3">
              {/* Left Side - Logo */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                  <Image 
                    src="/logo.png" 
                    alt="BitRedict Logo" 
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
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        segment?.startsWith('markets') || segment === 'markets'
                          ? "bg-gradient-primary text-black shadow-button"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                      }`}
                    >
                      <ChartBarIcon className="h-4 w-4" />
                      <span className="hidden 2xl:inline">Markets</span>
                      <motion.div
                        animate={{ rotate: isMarketsOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isMarketsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed bg-[rgba(5,5,15,0.98)] backdrop-blur-xl border border-border-card/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
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
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 group ${
                                  segment === link.segment
                                    ? "bg-gradient-primary/20 text-primary border-l-2 border-primary"
                                    : "text-text-secondary hover:text-primary hover:bg-bg-card"
                                }`}
                              >
                                <link.icon className={`h-4 w-4 ${
                                  segment === link.segment ? 'text-primary' : 'text-text-muted group-hover:text-primary'
                                }`} />
                                <span>{link.label}</span>
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      segment === "oddyssey"
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <FireIcon className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Oddyssey</span>
                  </Link>

                  <Link
                    href="/rewards"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      segment === "rewards"
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <TrophyIcon className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Rewards</span>
                  </Link>

                  <Link
                    href="/faucet"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      segment === "faucet"
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <BeakerIcon className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Faucet</span>
                  </Link>

                  <Link
                    href="/airdrop"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      segment === "airdrop"
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <GiftIcon className="h-4 w-4" />
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
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        bitredictorLinks.some(link => segment === link.segment)
                          ? "bg-gradient-primary text-black shadow-button"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                      }`}
                    >
                      <CubeTransparentIcon className="h-4 w-4" />
                      <span className="hidden 2xl:inline">Bitredictor</span>
                      <motion.div
                        animate={{ rotate: isBitredictorOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isBitredictorOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed bg-[rgba(5,5,15,0.98)] backdrop-blur-xl border border-border-card/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
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
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 group ${
                                  segment === link.segment
                                    ? "bg-gradient-primary/20 text-primary border-l-2 border-primary"
                                    : "text-text-secondary hover:text-primary hover:bg-bg-card"
                                }`}
                              >
                                <link.icon className={`h-4 w-4 ${
                                  segment === link.segment ? 'text-primary' : 'text-text-muted group-hover:text-primary'
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
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                      <span className="hidden 2xl:inline">More</span>
                      <motion.div
                        animate={{ rotate: isMoreOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isMoreOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed bg-[rgba(5,5,15,0.98)] backdrop-blur-xl border border-border-card/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
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
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 group ${
                                  segment === link.segment
                                    ? "bg-gradient-primary/20 text-primary border-l-2 border-primary"
                                    : "text-text-secondary hover:text-primary hover:bg-bg-card"
                                }`}
                              >
                                <link.icon className={`h-4 w-4 ${
                                  segment === link.segment ? 'text-primary' : 'text-text-muted group-hover:text-primary'
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
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-card border border-border-input text-xs hover:bg-bg-card-hover transition-colors duration-200"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isOnSomnia ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <span className="text-text-secondary font-mono hidden md:inline">
                            {address.slice(0, 4)}...{address.slice(-4)}
                          </span>
                          <motion.div
                            animate={{ rotate: isWalletDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDownIcon className="h-3 w-3 text-text-muted" />
                          </motion.div>
                        </motion.button>

                        <AnimatePresence>
                          {isWalletDropdownOpen && walletButtonRef.current && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="fixed bg-[rgba(5,5,15,0.98)] backdrop-blur-xl border border-border-card/50 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
                              style={{ 
                                zIndex: 1001,
                                top: `${walletButtonRef.current.getBoundingClientRect().bottom + 8}px`,
                                right: `${window.innerWidth - walletButtonRef.current.getBoundingClientRect().right}px`
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-2">
                                {!isOnSomnia && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchToSomnia();
                                      setIsWalletDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-200 text-orange-400 hover:text-orange-300 hover:bg-bg-card"
                                  >
                                    Switch to Somnia
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    disconnectWallet();
                                    setIsWalletDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-200 text-text-secondary hover:text-primary hover:bg-bg-card"
                                >
                                  Disconnect
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <WalletIcon className="h-4 w-4" />
                        <span className="hidden md:inline">{isConnecting ? 'Connecting...' : 'Connect'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Create Market Button */}
                <Link href="/create-prediction" className="hidden md:block flex-shrink-0">
                  <Button size="sm" variant="primary" className="whitespace-nowrap text-xs px-3 py-1.5">
                    <span className="hidden lg:inline">Create Market</span>
                    <span className="lg:hidden">Create</span>
                  </Button>
                </Link>

                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hidden md:flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
                  title="Settings"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
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
                  className="xl:hidden relative z-50 p-2 rounded-lg bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary transition-colors border border-border-card"
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
                        <XMarkIcon className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Bars3Icon className="h-5 w-5" />
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
              className="fixed inset-0 z-40 xl:hidden"
            >
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-bg-overlay backdrop-blur-modal"
                onClick={handleClose}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 h-full w-80 max-w-[85vw] glass-card"
                style={{ borderRadius: "0px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border-card">
                    <Link href="/" className="flex items-center gap-2" onClick={handleClose}>
                      <Image 
                        src="/logo.png" 
                        alt="BitRedict Logo" 
                        width={140} 
                        height={50} 
                        className="logo-color-shift"
                        priority 
                      />
                    </Link>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 p-4 overflow-y-auto space-y-6">
                    {/* Primary Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-text-muted mb-2 px-2 uppercase tracking-wider">Main</h3>
                      <div className="space-y-1">
                        <Link
                          href="/markets"
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            segment?.startsWith('markets') || segment === 'markets'
                              ? "bg-gradient-primary text-black"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
                          <span>Markets</span>
                        </Link>
                        <Link
                          href="/oddyssey"
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            segment === "oddyssey"
                              ? "bg-gradient-primary text-black"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <FireIcon className="h-5 w-5 flex-shrink-0" />
                          <span>Oddyssey</span>
                        </Link>
                        <Link
                          href="/rewards"
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            segment === "rewards"
                              ? "bg-gradient-primary text-black"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <TrophyIcon className="h-5 w-5 flex-shrink-0" />
                          <span>Rewards</span>
                        </Link>
                        <Link
                          href="/faucet"
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            segment === "faucet"
                              ? "bg-gradient-primary text-black"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <BeakerIcon className="h-5 w-5 flex-shrink-0" />
                          <span>Faucet</span>
                        </Link>
                        <Link
                          href="/airdrop"
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            segment === "airdrop"
                              ? "bg-gradient-primary text-black"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <GiftIcon className="h-5 w-5 flex-shrink-0" />
                          <span>Airdrop</span>
                        </Link>
                      </div>
                    </div>

                    {/* Bitredictor Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-text-muted mb-2 px-2 uppercase tracking-wider">Bitredictor</h3>
                      <div className="space-y-1">
                        {bitredictorLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              segment === link.segment
                                ? "bg-gradient-primary text-black"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                            }`}
                          >
                            <link.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Markets Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-text-muted mb-2 px-2 uppercase tracking-wider">Markets</h3>
                      <div className="space-y-1">
                        {marketsLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              segment === link.segment
                                ? "bg-gradient-primary text-black"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                            }`}
                          >
                            <link.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* More Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-text-muted mb-2 px-2 uppercase tracking-wider">More</h3>
                      <div className="space-y-1">
                        {moreLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              segment === link.segment
                                ? "bg-gradient-primary text-black"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                            }`}
                          >
                            <link.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4 border-t border-border-card">
                      <Link href="/create-prediction" onClick={handleClose}>
                        <Button fullWidth variant="primary" size="sm">
                          Create Market
                        </Button>
                      </Link>
                      
                      {isRender && (
                        isConnected && address ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-input text-sm">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnSomnia ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                              <span className="text-text-secondary font-mono text-xs truncate">
                                {address.slice(0, 8)}...{address.slice(-6)}
                              </span>
                            </div>
                            {!isOnSomnia && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  switchToSomnia();
                                }}
                                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-bg-card border border-orange-500 transition-colors"
                              >
                                Switch Network
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                disconnectWallet();
                              }}
                              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-bg-card border border-border-input transition-colors"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              connectWallet();
                            }}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <WalletIcon className="h-4 w-4" />
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                          </button>
                        )
                      )}
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="p-4 border-t border-border-card">
                    <div className="text-center">
                      <p className="text-xs text-text-muted">
                        Powered by{" "}
                        <span className="gradient-text font-medium">Somnia Network</span>
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
    label: "Dashboard",
    href: "/dashboard",
    segment: "dashboard",
    icon: ChartBarIcon,
  },
  {
    label: "Profile",
    href: "/profile",
    segment: "profile",
    icon: UserIcon,
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    segment: "leaderboard",
    icon: TrophyIcon,
  },
  {
    label: "Community",
    href: "/community",
    segment: "community",
    icon: UsersIcon,
  },
];

// Markets Links
const marketsLinks = [
  {
    label: "All Markets",
    href: "/markets",
    segment: "markets",
    icon: ChartBarIcon,
  },
  {
    label: "Boosted",
    href: "/markets/boosted",
    segment: "boosted",
    icon: BoltIcon,
  },
  {
    label: "Trending",
    href: "/markets/trending", 
    segment: "trending",
    icon: ArrowTrendingUpIcon,
  },
  {
    label: "Private",
    href: "/markets/private",
    segment: "private", 
    icon: LockClosedIcon,
  },
  {
    label: "Combo",
    href: "/markets/combo",
    segment: "combo",
    icon: Squares2X2Icon,
  },
];

// More Links - Secondary Features
const moreLinks = [
  {
    label: "Stats",
    href: "/stats",
    segment: "stats",
    icon: ChartBarIcon,
  },
  {
    label: "Staking",
    href: "/staking",
    segment: "staking",
    icon: CurrencyDollarIcon,
  },
  {
    label: "Docs",
    href: "/docs",
    segment: "docs",
    icon: DocumentTextIcon,
  },
];
