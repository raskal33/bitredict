"use client";

import { useWindowScroll } from "@uidotdev/usehooks";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";
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
  WalletIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useProfileStore } from '@/stores/useProfileStore';
import { somniaNetwork } from '@/config/wagmi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBitredictorOpen, setIsBitredictorOpen] = useState<boolean>(false);
  const [{ y }] = useWindowScroll();
  const segment = useSelectedLayoutSegment();
  const [isRender, setIsRender] = useState<boolean>(false);
  
  // Reown AppKit and Wagmi hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useAppKit();
  const { setCurrentProfile } = useProfileStore();
  
  // Check if user is on Somnia network
  const isOnSomnia = chainId === somniaNetwork.id;

  useEffect(() => {
    setIsRender(true);
  }, []);

  // Update current profile when wallet connects
  useEffect(() => {
    if (address) {
      setCurrentProfile(address);
    } else {
      setCurrentProfile(null);
    }
  }, [address, setCurrentProfile]);

  const newY = y || 1;
  const isScrolled = newY > 100;

  const handleClose = () => setIsMenuOpen(false);
  const handleBitredictorToggle = () => setIsBitredictorOpen(!isBitredictorOpen);
  const handleBitredictorClose = () => setIsBitredictorOpen(false);

  // Switch to Somnia network
  const switchToSomnia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${somniaNetwork.id.toString(16)}` }],
      });
    } catch (error: unknown) {
      // If network doesn't exist, add it
      if ((error as { code?: number }).code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${somniaNetwork.id.toString(16)}`,
              chainName: somniaNetwork.name,
              nativeCurrency: somniaNetwork.nativeCurrency,
              rpcUrls: somniaNetwork.rpcUrls.default.http,
              blockExplorerUrls: somniaNetwork.blockExplorers ? [somniaNetwork.blockExplorers.default.url] : [],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Somnia network:', addError);
        }
      } else {
        console.error('Failed to switch to Somnia network:', error);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsBitredictorOpen(false);
    };

    if (isBitredictorOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isBitredictorOpen]);

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
          } inset-x-0 top-0 z-50 border-b border-border-card transition-all duration-300 nav-glass`}
        >
          <div className="container-nav">
            <div className="flex items-center justify-between py-4">
              {/* Left Side - Logo */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group">
                  <Image 
                    src="/logo.png" 
                    alt="BitRedict Logo" 
                    width={48} 
                    height={48} 
                    className="transition-all duration-300 ease-in-out group-hover:[filter:hue-rotate(180deg)]"
                    priority 
                  />
                </Link>

                {/* Bitredictor Dropdown */}
                <div className="relative hidden lg:block">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBitredictorToggle();
                    }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 text-text-secondary hover:text-text-primary hover:bg-bg-card"
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
                    {isBitredictorOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-52 bg-[rgba(5,5,15,0.95)] backdrop-blur-xl border border-border-card/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-3 px-2">
                          {bitredictorLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={handleBitredictorClose}
                              className={`flex items-center gap-3 px-3 py-2.5 mx-1 text-sm font-medium transition-all duration-200 rounded-xl group ${
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
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center - Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 ${
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
              <div className="flex items-center gap-3">
                {/* Reown AppKit Wallet Button */}
                {isRender && (
                  <div className="hidden sm:block">
                    {isConnected && address ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-button bg-bg-card border border-border-input text-sm">
                          <div className={`w-2 h-2 rounded-full ${isOnSomnia ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <span className="text-text-secondary font-mono">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </span>
                        </div>
                        {!isOnSomnia && (
                          <button
                            onClick={switchToSomnia}
                            className="px-3 py-2 rounded-button text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-bg-card border border-orange-500 transition-colors duration-200"
                            title="Switch to Somnia Testnet"
                          >
                            Switch Network
                          </button>
                        )}
                        <button
                          onClick={() => disconnect()}
                          className="px-3 py-2 rounded-button text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-bg-card border border-border-input transition-colors duration-200"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => open()}
                        className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-black"
                        style={{
                          fontFamily: "var(--font-onest)",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        <WalletIcon className="h-4 w-4" />
                        Connect Wallet
                      </button>
                    )}
                  </div>
                )}

                {/* Create Market Button */}
                <Link href="/create-prediction" className="hidden md:block">
                  <Button size="sm" variant="primary">
                    Create Market
                  </Button>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden relative z-50 p-2 rounded-button bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary transition-colors border border-border-card"
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
                className="absolute right-0 top-0 h-full w-80 max-w-sm glass-card"
                style={{ borderRadius: "0px" }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                                      <div className="flex items-center justify-between p-6 border-b border-border-card">
                                        <Link href="/" className="flex items-center gap-3 group">
                                          <Image 
                                            src="/logo.png" 
                                            alt="BitRedict Logo" 
                                            width={40} 
                                            height={40} 
                                            className="transition-all duration-300 ease-in-out group-hover:[filter:hue-rotate(180deg)]"
                                            priority 
                                          />
                                        </Link>
                                      </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 p-6">
                    {/* Bitredictor Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-text-secondary mb-3">Bitredictor</h3>
                      <div className="space-y-2">
                        {bitredictorLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium transition-all duration-200 ${
                              segment === link.segment
                                ? "bg-gradient-primary text-black shadow-button"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                            }`}
                          >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Main Navigation */}
                    <div className="space-y-2">
                      {links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={handleClose}
                          className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium transition-all duration-200 ${
                            segment === link.segment
                              ? "bg-gradient-primary text-black shadow-button"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                          }`}
                        >
                          <link.icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 space-y-3">
                      <Link href="/create-prediction" onClick={handleClose}>
                        <Button fullWidth variant="primary">
                          Create Market
                        </Button>
                      </Link>
                      
                      {isRender && (
                        isConnected && address ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-button bg-bg-card border border-border-input text-sm">
                              <div className={`w-2 h-2 rounded-full ${isOnSomnia ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                              <span className="text-text-secondary font-mono">
                                {address.slice(0, 6)}...{address.slice(-4)}
                              </span>
                            </div>
                            {!isOnSomnia && (
                              <button
                                onClick={switchToSomnia}
                                className="w-full px-4 py-3 rounded-button text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-bg-card border border-orange-500"
                              >
                                Switch to Somnia Testnet
                              </button>
                            )}
                            <button
                              onClick={() => disconnect()}
                              className="w-full px-4 py-3 rounded-button text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-bg-card border border-border-input"
                            >
                              Disconnect Wallet
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => open()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button text-sm font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-black"
                            style={{
                              fontFamily: "var(--font-onest)",
                              fontWeight: "500",
                            }}
                          >
                            <WalletIcon className="h-4 w-4" />
                            Connect Wallet
                          </button>
                        )
                      )}
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="p-6 border-t border-border-card">
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
    label: "Community",
    href: "/community",
    segment: "community",
    icon: UsersIcon,
  },
];

const links = [
  {
    label: "Markets",
    href: "/",
    segment: undefined,
    icon: ChartBarIcon,
  },
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
];
