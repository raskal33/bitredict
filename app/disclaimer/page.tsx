"use client";

import { motion } from "framer-motion";

export default function DisclaimerPage() {
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
            <h1 className="text-4xl font-bold text-text-primary mb-4">Disclaimer</h1>
            <p className="text-text-secondary">Important legal and financial disclaimers</p>
            <p className="text-text-muted text-sm">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="glass-card prose prose-invert max-w-none">
            <div className="space-y-8">
              {/* Risk Warning */}
              <section>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    ⚠️ Risk Warning
                  </h2>
                  <p className="text-text-secondary leading-relaxed">
                    PREDICTION MARKETS AND CRYPTOCURRENCY TRADING INVOLVE SUBSTANTIAL RISK OF LOSS. 
                    YOU COULD LOSE ALL OF YOUR INVESTED FUNDS. DO NOT INVEST MONEY YOU CANNOT AFFORD TO LOSE.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">General Disclaimer</h2>
                <p className="text-text-secondary leading-relaxed">
                  The information provided on BitRedict (&quot;the Platform&quot;) is for general informational purposes only. 
                  All information on the Platform is provided in good faith, however we make no representation or warranty 
                  of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, 
                  or completeness of any information on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Financial Disclaimer</h2>
                <div className="space-y-4">
                  <p className="text-text-secondary leading-relaxed">
                    BitRedict is not a financial advisor, broker, or investment company. We do not provide investment, 
                    financial, legal, or tax advice. The Platform facilitates peer-to-peer prediction markets but does 
                    not endorse or recommend any particular market or outcome.
                  </p>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">Key Points:</h3>
                    <ul className="list-disc list-inside text-text-secondary space-y-1 ml-2">
                      <li>All trading decisions are your sole responsibility</li>
                      <li>Past performance does not guarantee future results</li>
                      <li>Market predictions may be incorrect</li>
                      <li>Consult qualified professionals for financial advice</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Technology Disclaimer</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Smart Contract Risks</h3>
                  <p className="text-text-secondary leading-relaxed">
                    BitRedict operates through smart contracts on the Somnia Network blockchain. While our contracts 
                    have been audited, they may still contain bugs, vulnerabilities, or unexpected behaviors that could 
                    result in loss of funds.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Blockchain Risks</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Blockchain networks may experience congestion, forks, or other technical issues that could affect 
                    the Platform&apos;s functionality. We are not responsible for blockchain network failures or delays.
                  </p>

                  <h3 className="text-lg font-semibold text-text-primary mb-2">Beta Software</h3>
                  <p className="text-text-secondary leading-relaxed">
                    BitRedict may include features in beta or experimental stages. These features are provided &quot;as is&quot; 
                    and may not function as expected.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Regulatory Disclaimer</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  The regulatory status of prediction markets and cryptocurrencies varies by jurisdiction. Users are 
                  responsible for ensuring their use of BitRedict complies with applicable laws in their location.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-text-secondary">
                    <strong className="text-blue-400">Important:</strong> BitRedict may not be available or legal in all 
                    jurisdictions. It is your responsibility to determine whether your use of the Platform complies with 
                    applicable laws and regulations.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Market Data Disclaimer</h2>
                <p className="text-text-secondary leading-relaxed">
                  Market data, odds, and predictions displayed on BitRedict are generated by users and algorithms. 
                  This information may be inaccurate, outdated, or misleading. We do not guarantee the accuracy or 
                  reliability of any market data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Third-Party Content</h2>
                <p className="text-text-secondary leading-relaxed">
                  BitRedict may contain links to third-party websites or integrate with external services. We are not 
                  responsible for the content, accuracy, or opinions expressed in such materials. Inclusion of any 
                  linked website does not imply approval or endorsement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Oracle and Data Feed Risks</h2>
                <p className="text-text-secondary leading-relaxed">
                  Market resolutions depend on external data sources and oracles. These may provide incorrect information, 
                  become unavailable, or be subject to manipulation. We are not liable for losses resulting from oracle 
                  failures or inaccurate data feeds.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">No Warranty</h2>
                <p className="text-text-secondary leading-relaxed">
                  THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
                  EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
                  A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Limitation of Liability</h2>
                <p className="text-text-secondary leading-relaxed">
                  IN NO EVENT SHALL BITREDICT, ITS DEVELOPERS, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, 
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, 
                  INCLUDING BUT NOT LIMITED TO LOSS OF FUNDS, PROFITS, OR DATA.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Changes to This Disclaimer</h2>
                <p className="text-text-secondary leading-relaxed">
                  We reserve the right to update this disclaimer at any time without prior notice. Continued use of 
                  the Platform after changes constitutes acceptance of the updated disclaimer.
                </p>
              </section>

              <div className="border-t border-border-card pt-8 mt-12">
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">📞 Questions or Concerns?</h3>
                  <p className="text-text-secondary">
                    If you have questions about this disclaimer or need clarification on any points, 
                    please contact us through our official channels or visit our Contact page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 