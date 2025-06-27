"use client";

import { useState } from "react";
import Button from "@/components/button";
import Image from "next/image";

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
    username: "BitRedict User",
    bio: "Prediction market enthusiast",
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
    // Here you would typically send the settings to your backend
  };

  const categories = ["Crypto", "Sports", "Politics", "Entertainment", "Finance", "Technology"];

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
  ];

  return (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border-color pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "profile" | "preferences" | "privacy" | "notifications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-brand-cyan to-brand-blue text-black"
                  : "text-text-secondary hover:text-white hover:bg-card-bg"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
            
            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="relative">
                <label htmlFor="profile-picture" className="cursor-pointer block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-cyan to-brand-blue p-1">
                    <div className="w-full h-full rounded-full overflow-hidden bg-card-bg flex items-center justify-center">
                      {settings.profilePicture ? (
                        <Image
                          src={settings.profilePicture}
                          alt="Profile"
                          width={88}
                          height={88}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 flex items-center justify-center">
                          <svg className="w-8 h-8 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-cyan rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                </label>
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Bio
                </label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Betting Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Default Stake (SOL)
                </label>
                <input
                  type="number"
                  value={settings.defaultStake}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultStake: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent transition-all"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Bet Limit (SOL)
                </label>
                <input
                  type="number"
                  value={settings.maxBetLimit}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxBetLimit: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent transition-all"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Preferred Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 p-3 bg-card-bg rounded-lg cursor-pointer hover:bg-card-bg/70 transition-all">
                    <input
                      type="checkbox"
                      checked={settings.preferredCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings(prev => ({ 
                            ...prev, 
                            preferredCategories: [...prev.preferredCategories, category] 
                          }));
                        } else {
                          setSettings(prev => ({ 
                            ...prev, 
                            preferredCategories: prev.preferredCategories.filter(c => c !== category) 
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded border-border-color bg-transparent text-brand-cyan focus:ring-brand-cyan/50"
                    />
                    <span className="text-white">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Privacy Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-card-bg rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Profile Visibility</h3>
                  <p className="text-text-secondary text-sm">Control who can see your profile</p>
                </div>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value as "public" | "private" }))}
                  className="px-3 py-2 bg-bg-main border border-border-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-card-bg rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Show Winnings</h3>
                  <p className="text-text-secondary text-sm">Display your profit/loss on your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showWinnings}
                    onChange={(e) => setSettings(prev => ({ ...prev, showWinnings: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-cyan/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-cyan"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>
            
            <div className="space-y-4">
              {[
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
                { key: "pushNotifications", label: "Push Notifications", desc: "Receive browser push notifications" },
                { key: "marketUpdates", label: "Market Updates", desc: "Get updates about new prediction markets" },
                { key: "winLossAlerts", label: "Win/Loss Alerts", desc: "Instant alerts when your predictions are settled" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-card-bg rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{item.label}</h3>
                    <p className="text-text-secondary text-sm">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof SettingsState] as boolean}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-cyan/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-cyan"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-border-color">
          <Button onClick={handleSave} className="w-full md:w-auto">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
