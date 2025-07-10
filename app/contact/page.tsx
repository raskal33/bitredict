"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Button from "@/components/button";
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { SocialIcons } from "@/components/icons/SocialIcons";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "general",
      message: ""
    });
  };

  const contactMethods = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Community Discord",
      description: "Join our Discord server for real-time support and community discussions",
      action: "Join Discord",
      href: "https://discord.gg/bitredict",
      color: "text-purple-400"
    },
    {
      icon: EnvelopeIcon,
      title: "Email Support", 
      description: "Send us an email for detailed inquiries and technical support",
      action: "support@bitredict.com",
      href: "mailto:support@bitredict.com",
      color: "text-blue-400"
    },
    {
      icon: QuestionMarkCircleIcon,
      title: "Documentation",
      description: "Find answers to common questions in our comprehensive documentation",
      action: "View Docs",
      href: "https://drive.google.com/file/d/1YeC8u3tkSA-VOI96Ut2WEfrQhps1OIjG/view",
      color: "text-green-400"
    }
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "technical", label: "Technical Support" },
    { value: "trading", label: "Trading/Markets" },
    { value: "account", label: "Account Issues" },
    { value: "partnership", label: "Partnership" },
    { value: "media", label: "Media/Press" },
    { value: "legal", label: "Legal/Compliance" },
    { value: "bug", label: "Bug Report" }
  ];

  return (
    <div className="min-h-screen">
      <div className="container section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Get in Touch</h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Have questions about BitRedict? We&apos;re here to help. Choose the best way to reach us below.
            </p>
          </div>

          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {contactMethods.map((method) => (
              <motion.div
                key={method.title}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card text-center group cursor-pointer"
                onClick={() => window.open(method.href, '_blank')}
              >
                <method.icon className={`h-12 w-12 mx-auto mb-4 ${method.color} group-hover:scale-110 transition-transform duration-200`} />
                <h3 className="text-lg font-semibold text-text-primary mb-2">{method.title}</h3>
                <p className="text-text-secondary text-sm mb-4 leading-relaxed">{method.description}</p>
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${method.color} group-hover:underline`}>
                  {method.action}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="glass-card">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Send us a Message</h2>
                
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Message Sent!</h3>
                    <p className="text-text-secondary">Thank you for contacting us. We&apos;ll get back to you within 24 hours.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-button text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-button text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-button text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-button text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-button text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-vertical"
                        placeholder="Please provide detailed information about your inquiry..."
                      />
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      loading={isSubmitting}
                      className="py-3"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-8"
            >
              {/* FAQ Section */}
              <div className="glass-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">How do I get started with BitRedict?</h4>
                    <p className="text-text-secondary text-sm">Connect your wallet, browse available markets, and start making predictions on outcomes you&apos;re confident about.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">What tokens can I use?</h4>
                    <p className="text-text-secondary text-sm">BitRedict supports STT (Somnia Testnet Token) and BITR tokens for betting and staking.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">Is my wallet secure?</h4>
                    <p className="text-text-secondary text-sm">We never store your private keys. All transactions are executed through your own wallet with your explicit approval.</p>
                  </div>
                </div>
              </div>

              {/* Response Times */}
              <div className="glass-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Response Times</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Discord (Real-time)</span>
                    <span className="text-green-400 font-medium">Immediate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Email Support</span>
                    <span className="text-blue-400 font-medium">Within 24hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Technical Issues</span>
                    <span className="text-orange-400 font-medium">Within 12hrs</span>
                  </div>
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="glass-card bg-red-500/10 border-red-500/20">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Security Issues?</h3>
                    <p className="text-text-secondary text-sm mb-3">
                      If you&apos;ve discovered a security vulnerability or urgent technical issue, 
                      please contact us immediately through Discord or email with &quot;URGENT&quot; in the subject line.
                    </p>
                    <p className="text-text-muted text-xs">
                      For responsible disclosure of security issues, we offer bug bounty rewards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="glass-card text-center">
                <h3 className="text-xl font-bold text-text-primary mb-4">Follow Us</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Stay updated with the latest news, features, and community discussions
                </p>
                <SocialIcons />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 