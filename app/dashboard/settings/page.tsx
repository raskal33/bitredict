"use client";

import { useState } from "react";
import Button from "@/components/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Lock,
  Bell,
  Shield,
  Eye,
  CreditCard,
  Palette,
  Check,
  ChevronRight,
  Upload,
  Zap,
  Layout,
  Globe,
  Monitor
} from "lucide-react";

interface SettingsState {
  // Profile
  username: string;
  bio: string;
  profilePicture: string;
  // Preferences
  defaultStake: number;
  maxBetLimit: number;
  preferredCategories: string[];
  // Privacy
  profileVisibility: "public" | "private";
  showWinnings: boolean;
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketUpdates: boolean;
  winLossAlerts: boolean;
}

export default function Page() {
  const [settings, setSettings] = useState<SettingsState>({
    username: "Neon Rider",
    bio: "Quant strategist specializing in high-volatility prediction markets.",
    profilePicture: "",
    defaultStake: 10,
    maxBetLimit: 100,
    preferredCategories: ["Crypto", "Sports"],
    profileVisibility: "public",
    showWinnings: true,
    emailNotifications: true,
    pushNotifications: true,
    marketUpdates: false,
    winLossAlerts: true,
  });

  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "privacy" | "notifications">("profile");

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          setSettings(prev => ({ ...prev, profilePicture: fileReader.result as string }));
        }
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    console.log("Settings saved:", settings);
  };

  const categories = ["Crypto", "Sports", "Politics", "Entertainment", "Finance", "Technology"];

  const tabs = [
    { id: "profile", label: "Neural Identity", icon: User },
    { id: "preferences", label: "Execution Logic", icon: Zap },
    { id: "privacy", label: "Cloaking", icon: Lock },
    { id: "notifications", label: "Signal Comms", icon: Bell },
  ];

  return (
    <div className="space-y-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 border-white/10 bg-bg-card/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-somnia-blue/10 blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-somnia-blue/10 border border-somnia-blue/20 text-somnia-blue text-[10px] font-black uppercase tracking-[0.2em]">
              <Settings className="w-3 h-3" /> Core Config
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">
              System <span className="bg-gradient-to-r from-somnia-cyan to-somnia-blue bg-clip-text text-transparent">Settings</span>
            </h1>
            <p className="text-text-muted text-sm font-medium">Fine-tune your terminal environment and operational parameters.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${isActive
                  ? "bg-gradient-to-r from-somnia-cyan/20 to-transparent border border-somnia-cyan/30 text-white shadow-[0_0_20px_rgba(34,199,255,0.1)]"
                  : "text-text-muted hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-somnia-cyan text-black' : 'bg-white/5 text-text-muted group-hover:bg-white/10 group-hover:text-white'}`}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-somnia-cyan" />}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-10 border-white/10 bg-bg-card/20 min-h-[500px]"
            >
              {/* Profile Section */}
              {activeTab === "profile" && (
                <div className="space-y-10">
                  <div className="flex flex-col sm:flex-row items-center gap-10">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-br from-somnia-cyan to-somnia-blue rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                      <div className="relative w-32 h-32 rounded-full border-4 border-bg-main bg-bg-main overflow-hidden">
                        {settings.profilePicture ? (
                          <Image src={settings.profilePicture} alt="Avatar" layout="fill" objectFit="cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                            <User className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="w-6 h-6 text-somnia-cyan mb-1" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Update</span>
                          <input type="file" className="hidden" onChange={handleProfilePictureChange} accept="image/*" />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4 flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Neural Appearance</h3>
                      <p className="text-xs text-text-muted font-medium max-w-sm">Synchronize your visual identity across the Predinex network. Supports high-res biometric scans.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Codename</label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-somnia-cyan/50 focus:bg-white/10 transition-all font-bold"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="w-4 h-4 text-somnia-cyan" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Operational Directive (Bio)</label>
                      <textarea
                        rows={4}
                        value={settings.bio}
                        onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-somnia-cyan/50 focus:bg-white/10 transition-all font-medium resize-none"
                        placeholder="Decrypting mission objectives..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeTab === "preferences" && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-somnia-violet">
                        <Monitor className="w-5 h-5" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Allocation Protocols</h3>
                      </div>
                      <div className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Default Load (STT)</label>
                            <span className="text-xs font-black text-somnia-cyan">{settings.defaultStake}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="500"
                            value={settings.defaultStake}
                            onChange={(e) => setSettings(prev => ({ ...prev, defaultStake: parseInt(e.target.value) }))}
                            className="w-full accent-somnia-cyan h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Max Exposure Limit</label>
                            <span className="text-xs font-black text-somnia-blue">{settings.maxBetLimit}</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="1000"
                            step="10"
                            value={settings.maxBetLimit}
                            onChange={(e) => setSettings(prev => ({ ...prev, maxBetLimit: parseInt(e.target.value) }))}
                            className="w-full accent-somnia-blue h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-somnia-cyan">
                        <Palette className="w-5 h-5" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Sector Filters</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => {
                          const isChecked = settings.preferredCategories.includes(category);
                          return (
                            <label
                              key={category}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-somnia-cyan/10 border-somnia-cyan/30 text-white' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'
                                }`}
                            >
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-somnia-cyan text-black' : 'bg-white/10'}`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSettings(p => ({ ...p, preferredCategories: [...p.preferredCategories, category] }));
                                  else setSettings(p => ({ ...p, preferredCategories: p.preferredCategories.filter(c => c !== category) }));
                                }}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest">{category}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeTab === "privacy" && (
                <div className="space-y-8">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-8">
                    {[
                      { id: "profileVisibility", label: "Public Presence", desc: "Allow other entities to index your neural profile.", icon: Eye },
                      { id: "showWinnings", label: "Yield Transparency", desc: "Radiate your profit telemetry to the sector list.", icon: CreditCard }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                          <div className="p-3 bg-white/5 rounded-2xl text-somnia-cyan">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wide">{item.label}</h4>
                            <p className="text-[10px] text-text-muted font-medium italic">{item.desc}</p>
                          </div>
                        </div>
                        <div
                          onClick={() => setSettings(p => ({ ...p, [item.id]: !p[item.id as keyof typeof p] }))}
                          className={`w-14 h-7 rounded-full p-1 transition-all flex items-center cursor-pointer ${settings[item.id as keyof typeof settings] ? 'bg-somnia-cyan' : 'bg-white/10'
                            }`}
                        >
                          <motion.div
                            animate={{ x: settings[item.id as keyof typeof settings] ? 28 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 p-6 rounded-2xl bg-somnia-magenta/10 border border-somnia-magenta/20">
                    <Shield className="w-5 h-5 text-somnia-magenta" />
                    <p className="text-[10px] text-somnia-magenta font-black uppercase tracking-widest">Quantum Encryption Active: Your node is protected by Somnia Shield</p>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeTab === "notifications" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { key: "emailNotifications", label: "Encrypted Email", icon: Globe },
                      { key: "pushNotifications", label: "Biometric Push", icon: Zap },
                      { key: "marketUpdates", label: "Sector Pulses", icon: Layout },
                      { key: "winLossAlerts", label: "Settle Triggers", icon: Check }
                    ].map((item) => (
                      <div key={item.key} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/8 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2.5 bg-white/5 rounded-xl text-somnia-cyan group-hover:bg-somnia-cyan group-hover:text-black transition-all">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div
                            onClick={() => setSettings(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                            className={`w-10 h-5 rounded-full p-1 transition-all flex items-center cursor-pointer ${settings[item.key as keyof typeof settings] ? 'bg-somnia-cyan' : 'bg-white/10'
                              }`}
                          >
                            <motion.div
                              animate={{ x: settings[item.key as keyof typeof settings] ? 20 : 0 }}
                              className="w-3 h-3 bg-white rounded-full"
                            />
                          </div>
                        </div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{item.label}</h4>
                        <p className="text-[9px] text-text-muted font-medium opacity-60">Automated signal routing via local bridge.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Unified Save Action */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              className="min-w-[200px] h-14 bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,199,255,0.3)] hover:shadow-[0_0_35px_rgba(34,199,255,0.5)] transition-all"
            >
              Commit Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
