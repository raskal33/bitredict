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
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { useProfileStore } from '@/stores/useProfileStore';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import NotificationBadge from "@/components/NotificationBadge";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBitredictorOpen, setIsBitredictorOpen] = useState<boolean>(false);
  const [isMarketsOpen, setIsMarketsOpen] = useState<boolean>(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState<boolean>(false);
  const [{ y }] = useWindowScroll();
  const segment = useSelectedLayoutSegment();
  const [isRender, setIsRender] = useState<boolean>(false);
  
  // Refs for dropdown positioning
  const bitredictorButtonRef = useRef<HTMLButtonElement>(null);
  const marketsButtonRef = useRef<HTMLButtonElement>(null);
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
    error,
    connectWallet,
    disconnectWallet,
    switchToSomnia,
  } = useWalletConnection();
  const { setCurrentProfile } = useProfileStore();

  useEffect(() => {
    setIsRender(true);
  }, []);

  // Update current profile when wallet connects and auto-close modal
  useEffect(() => {
    if (address && isConnected) {
      setCurrentProfile(address);
      // Remove auto-close behavior for mobile menu to prevent instability
      // Auto-close AppKit modal if it's open
      // Note: AppKit modal should close automatically when wallet connects
      console.log('Wallet connected, AppKit modal should close automatically');
    } else {
      setCurrentProfile(null);
    }
  }, [address, isConnected, setCurrentProfile]);

  const newY = y || 1;
  const isScrolled = newY > 100;

  const handleClose = () => {
    setIsMenuOpen(false);
  };
  const handleBitredictorToggle = () => setIsBitredictorOpen(!isBitredictorOpen);
  const handleBitredictorClose = () => setIsBitredictorOpen(false);
  const handleMarketsToggle = () => setIsMarketsOpen(!isMarketsOpen);
  const handleMarketsClose = () => setIsMarketsOpen(false);
  const handleWalletDropdownToggle = () => setIsWalletDropdownOpen(!isWalletDropdownOpen);
  const handleWalletDropdownClose = () => setIsWalletDropdownOpen(false);



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsBitredictorOpen(false);
      setIsMarketsOpen(false);
      setIsWalletDropdownOpen(false);
    };

    if (isBitredictorOpen || isMarketsOpen || isWalletDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isBitredictorOpen, isMarketsOpen, isWalletDropdownOpen]);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsBitredictorOpen(false);
      setIsMarketsOpen(false);
      setIsWalletDropdownOpen(false);
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
          <div className="container-nav overflow-x-hidden overflow-y-visible">
            <div className="flex items-center justify-between py-1.5 min-w-0 gap-2">
              {/* Left Side - Logo */}
              <div className="flex items-center gap-8 flex-shrink-0">
                <Link href="/" className="flex items-center gap-3">
                  <Image 
                    src="/logo.png" 
                    alt="BitRedict Logo" 
                    width={140} 
                    height={50} 
                    className="logo-color-shift navbar-logo"
                    priority 
                  />
                </Link>

                {/* Bitredictor Dropdown */}
                <div className="relative hidden lg:block" style={{ zIndex: 1000 }}>
                  <motion.button
                    ref={bitredictorButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBitredictorToggle();
                    }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-button text-xs font-medium transition-all duration-200 text-text-secondary hover:text-text-primary hover:bg-bg-card"
                  >
                    <CubeTransparentIcon className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Bitredictor</span>
                    <motion.div
                      animate={{ rotate: isBitredictorOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isBitredictorOpen && (() => {
                      const position = getDropdownPosition(bitredictorButtonRef);
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed w-52 bg-[rgba(5,5,15,0.95)] backdrop-blur-xl border border-border-card/50 rounded-2xl shadow-2xl overflow-hidden"
                          style={{ 
                            zIndex: 1001,
                            top: `${position.top}px`,
                            left: `${position.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                        <div className="py-3 px-2">
                          {bitredictorLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={handleBitredictorClose}
                              className={`flex items-center gap-3 px-3 py-2.5 mx-1 text-xs font-medium transition-all duration-200 rounded-xl group ${
                                segment === link.segment
                                  ? "bg-gradient-primary text-black shadow-lg"
                                  : "text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.08)]"
                              }`}
                            >
                              <link.icon className={`h-4 w-4 transition-colors duration-200 ${
                                segment === link.segment ? 'text-black' : 'text-primary group-hover:text-secondary'
                              }`} />
                              <span className="font-medium">{link.label}</span>
                              {segment === link.segment && (
                                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
                              )}
                            </Link>
                          ))}
                        </div>
                        
                        {/* Bottom gradient accent */}
                        <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center - Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1 min-w-0">
                {/* Markets Dropdown */}
                <div className="relative" style={{ zIndex: 1000 }}>
                  <motion.button
                    ref={marketsButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarketsToggle();
                    }}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-button text-xs font-medium transition-all duration-200 ${
                      segment?.startsWith('markets') || segment === 'markets'
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    Markets
                    <motion.div
                      animate={{ rotate: isMarketsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isMarketsOpen && (() => {
                      const position = getDropdownPosition(marketsButtonRef);
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed w-56 bg-[rgba(5,5,15,0.95)] backdrop-blur-xl border border-border-card/50 rounded-2xl shadow-2xl overflow-hidden"
                          style={{ 
                            zIndex: 1001,
                            top: `${position.top}px`,
                            left: `${position.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                        <div className="py-3 px-2">
                          {marketsLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={handleMarketsClose}
                              className={`flex items-center gap-3 px-3 py-2.5 mx-1 text-xs font-medium transition-all duration-200 rounded-xl group ${
                                segment === link.segment
                                  ? "bg-gradient-primary text-black shadow-lg"
                                  : "text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.08)]"
                              }`}
                            >
                              <link.icon className={`h-4 w-4 transition-colors duration-200 ${
                                segment === link.segment ? 'text-black' : 'text-primary group-hover:text-secondary'
                              }`} />
                              <span className="font-medium">{link.label}</span>
                              {segment === link.segment && (
                                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
                              )}
                            </Link>
                          ))}
                        </div>
                        
                        {/* Bottom gradient accent */}
                        <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* Other navigation links */}
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-button text-xs font-medium transition-all duration-200 ${
                      segment === link.segment
                        ? "bg-gradient-primary text-black shadow-button"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Notification Badge */}
                {isConnected && address && isRender && <NotificationBadge />}
                
                {/* Error Display */}
                {error && (
                  <div className="hidden sm:block">
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {error}
                    </div>
                  </div>
                )}
                {/* Reown AppKit Wallet Button */}
                {isRender && (
                  <div className="hidden sm:block">
                    {isConnected && address ? (
                      <div className="relative" style={{ zIndex: 1000 }}>
                        <motion.button
                          ref={walletButtonRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWalletDropdownToggle();
                          }}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-button bg-bg-card border border-border-input text-xs hover:bg-bg-card-hover transition-colors duration-200"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isOnSomnia ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <span className="text-text-secondary font-mono">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </span>
                          <motion.div
                            animate={{ rotate: isWalletDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDownIcon className="h-3 w-3 text-text-muted" />
                          </motion.div>
                        </motion.button>

                        <AnimatePresence>
                          {isWalletDropdownOpen && (() => {
                            if (!walletButtonRef.current || typeof window === 'undefined') return null;
                            const rect = walletButtonRef.current.getBoundingClientRect();
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="fixed w-48 bg-[rgba(5,5,15,0.95)] backdrop-blur-xl border border-border-card/50 rounded-2xl shadow-2xl overflow-hidden"
                                style={{ 
                                  zIndex: 1001,
                                  top: `${rect.bottom + 8}px`,
                                  right: `${window.innerWidth - rect.right}px`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                              <div className="py-2 px-1">
                                {!isOnSomnia && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchToSomnia();
                                      handleWalletDropdownClose();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 mx-1 text-sm font-medium transition-all duration-200 rounded-xl text-orange-400 hover:text-orange-300 hover:bg-[rgba(255,255,255,0.08)]"
                                  >
                                    <span>Switch to Somnia</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    disconnectWallet();
                                    handleWalletDropdownClose();
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 mx-1 text-sm font-medium transition-all duration-200 rounded-xl text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.08)]"
                                >
                                  <span>Disconnect</span>
                                </button>
                              </div>
                              <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
                            </motion.div>
                            );
                          })()}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={connectWallet}
                          disabled={isConnecting}
                          className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            fontFamily: "var(--font-onest)",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          <WalletIcon className="h-4 w-4" />
                          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                        {error && (
                          <div className="text-xs text-red-400 max-w-48 text-right">
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Create Market Button */}
                <Link href="/create-prediction" className="hidden md:block flex-shrink-0">
                  <Button size="sm" variant="primary" className="whitespace-nowrap">
                    Create Market
                  </Button>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => {
                    // Prevent rapid clicking
                    if (!isMenuOpen) {
                      setIsMenuOpen(true);
                    } else {
                      handleClose();
                    }
                  }}
                  className="lg:hidden relative z-50 p-2 rounded-button bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary transition-colors border border-border-card"
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
              className="fixed inset-0 z-40 lg:hidden"
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
                className="absolute right-0 top-0 h-full w-72 max-w-[85vw] glass-card"
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
                        width={160} 
                        height={160} 
                        className="logo-color-shift"
                        priority 
                      />
                    </Link>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 p-4 overflow-y-auto">
                    {/* Bitredictor Section */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-text-secondary mb-2 px-2">BITREDICTOR</h3>
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
                            <link.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Markets Section */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-text-secondary mb-2 px-2">MARKETS</h3>
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
                            <link.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Other Navigation */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-text-secondary mb-2 px-2">OTHER</h3>
                      <div className="space-y-1">
                        {links.map((link) => (
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
                            <link.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
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
                                {address.slice(0, 6)}...{address.slice(-4)}
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
                          <div className="w-full space-y-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                connectWallet();
                              }}
                              disabled={isConnecting}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                fontFamily: "var(--font-onest)",
                                fontWeight: "500",
                              }}
                            >
                              <WalletIcon className="h-4 w-4" />
                              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                            {error && (
                              <div className="text-xs text-red-400 text-center px-2">
                                {error}
                              </div>
                            )}
                          </div>
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
      </>
    );
  }
}

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

const marketsLinks = [
  {
    label: "All Markets",
    href: "/markets",
    segment: "markets",
    icon: ChartBarIcon,
  },
  {
    label: "Boosted Markets",
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
    label: "Private (Whitelist)",
    href: "/markets/private",
    segment: "private", 
    icon: LockClosedIcon,
  },
  {
    label: "Combo Markets",
    href: "/markets/combo",
    segment: "combo",
    icon: Squares2X2Icon,
  },
];

const links = [
  {
    label: "Oddyssey",
    href: "/oddyssey",
    segment: "oddyssey",
    icon: FireIcon,
  },
  {
    label: "Stats",
    href: "/stats",
    segment: "stats",
    icon: TrophyIcon,
  },
  {
    label: "Staking",
    href: "/staking",
    segment: "staking",
    icon: CurrencyDollarIcon,
  },
  {
    label: "Faucet",
    href: "/faucet",
    segment: "faucet",
    icon: BeakerIcon,
  },
  {
    label: "Docs",
    href: "/docs",
    segment: "docs",
    icon: DocumentTextIcon,
  },
];
