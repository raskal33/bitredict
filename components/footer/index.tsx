"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SocialIcons } from "@/components/icons/SocialIcons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: "Markets", href: "/" },
    { name: "Create Prediction", href: "/create-prediction" },
    { name: "Staking", href: "/staking" },
    { name: "Stats", href: "/stats" },
  ];

  const communityLinks = [
    { name: "Community Hub", href: "/community" },
    { name: "Profile", href: "/profile" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Leaderboard", href: "/stats" },
  ];

  const resourceLinks = [
    { name: "Documentation", href: "https://drive.google.com/file/d/1YeC8u3tkSA-VOI96Ut2WEfrQhps1OIjG/view" },
    { name: "API", href: "https://bitredict.com/api" },
    { name: "Help Center", href: "/contact" },
    { name: "Blog", href: "/community" },
  ];

  const legalLinks = [
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Privacy Policy", href: "https://bitredict.com/privacy-policy" },
    { name: "Cookie Policy", href: "https://bitredict.com/cookie-policy" },
    { name: "Disclaimer", href: "/disclaimer" },
  ];

  return (
    <footer className="relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-somnia opacity-5" />
      
      <div className="relative z-10 glass-card" style={{ borderRadius: "0px" }}>
        <div className="container-nav section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Logo */}
                <Link href="/" className="inline-block">
                  <Image 
                    src="/logo.png" 
                    alt="BitRedict" 
                    width={220} 
                    height={55}
                    className="h-auto"
                  />
                </Link>

                {/* Description */}
                <p className="text-text-secondary max-w-sm leading-relaxed">
                  The future of decentralized prediction markets. Trade on real-world outcomes 
                  with transparent, blockchain-powered markets on the Somnia Network.
                </p>

                {/* Social Links */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-3">Follow Us</p>
                  <SocialIcons />
                </div>
              </motion.div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Product */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-semibold text-text-primary mb-4">Product</h3>
                  <ul className="space-y-3">
                    {productLinks.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-text-secondary hover:text-primary transition-colors duration-200"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Community */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-semibold text-text-primary mb-4">Community</h3>
                  <ul className="space-y-3">
                    {communityLinks.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-text-secondary hover:text-primary transition-colors duration-200"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Resources */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-semibold text-text-primary mb-4">Resources</h3>
                  <ul className="space-y-3">
                    {resourceLinks.map((link) => (
                      <li key={link.name}>
                        {link.href.startsWith('http') ? (
                          <a 
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-primary transition-colors duration-200"
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link 
                            href={link.href}
                            className="text-text-secondary hover:text-primary transition-colors duration-200"
                          >
                            {link.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Legal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="font-semibold text-text-primary mb-4">Legal</h3>
                  <ul className="space-y-3">
                    {legalLinks.map((link) => (
                      <li key={link.name}>
                        {link.href.startsWith('http') ? (
                          <a 
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-primary transition-colors duration-200"
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link 
                            href={link.href}
                            className="text-text-secondary hover:text-primary transition-colors duration-200"
                          >
                            {link.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pt-8 border-t border-border-card"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span>© {currentYear} BitRedict.</span>
                <span>All rights reserved.</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted">Powered by</span>
                <span className="gradient-text font-semibold">Somnia Network</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
