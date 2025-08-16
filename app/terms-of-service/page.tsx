"use client";

import { motion } from "framer-motion";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <div className="container section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Terms of Service</h1>
            <p className="text-text-secondary">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="glass-card prose prose-invert max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">1. Agreement to Terms</h2>
                <p className="text-text-secondary leading-relaxed">
                  By accessing and using BitRedict (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">2. Description of Service</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  BitRedict is a decentralized prediction market platform built on the Somnia Network that allows users to:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                  <li>Create prediction markets on real-world events</li>
                  <li>Place bets on market outcomes using cryptocurrency tokens</li>
                  <li>Participate in liquidity provision and staking mechanisms</li>
                  <li>Engage with community features and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">3. User Responsibilities</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Age Requirements</h3>
                    <p className="text-text-secondary leading-relaxed">
                      You must be at least 18 years old to use this platform. By using BitRedict, you represent and warrant that you meet this age requirement.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Account Security</h3>
                    <p className="text-text-secondary leading-relaxed">
                      You are responsible for maintaining the security of your wallet and private keys. BitRedict cannot recover lost funds due to compromised wallet security.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Legal Compliance</h3>
                    <p className="text-text-secondary leading-relaxed">
                      You agree to comply with all applicable laws and regulations in your jurisdiction regarding the use of prediction markets and cryptocurrency trading.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">4. Prohibited Activities</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Users are prohibited from:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                  <li>Creating markets on illegal activities or promoting harmful content</li>
                  <li>Manipulating market outcomes or engaging in market manipulation</li>
                  <li>Using automated systems to gain unfair advantages</li>
                  <li>Attempting to exploit smart contract vulnerabilities</li>
                  <li>Engaging in money laundering or other illegal financial activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">5. Financial Risks</h2>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-4">
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">⚠️ Important Risk Disclosure</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Prediction markets involve significant financial risk. You may lose all funds you invest. Cryptocurrency values are volatile and unpredictable. Never invest more than you can afford to lose.
                  </p>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  BitRedict does not provide financial advice. All trading decisions are your own responsibility.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">6. Smart Contract Risks</h2>
                <p className="text-text-secondary leading-relaxed">
                  BitRedict operates through smart contracts on the Somnia Network. While audited, smart contracts may contain bugs or vulnerabilities. We are not liable for losses due to smart contract failures or blockchain network issues.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">7. Intellectual Property</h2>
                <p className="text-text-secondary leading-relaxed">
                  The BitRedict platform, including its design, code, and content, is protected by intellectual property rights. Users may not copy, modify, or distribute our proprietary materials without explicit permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">8. Privacy and Data</h2>
                <p className="text-text-secondary leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using BitRedict, you consent to our data practices as outlined in the Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">9. Limitation of Liability</h2>
                <p className="text-text-secondary leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITREDICT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">10. Dispute Resolution</h2>
                <p className="text-text-secondary leading-relaxed">
                  Any disputes arising from the use of BitRedict shall be resolved through binding arbitration in accordance with the rules of the jurisdiction where BitRedict is legally established.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">11. Termination</h2>
                <p className="text-text-secondary leading-relaxed">
                  We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including breach of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">12. Changes to Terms</h2>
                <p className="text-text-secondary leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">13. Contact Information</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us through our official communication channels or visit our Contact page.
                </p>
              </section>

              <div className="border-t border-border-card pt-8 mt-12">
                <p className="text-sm text-text-muted text-center">
                  By using BitRedict, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 