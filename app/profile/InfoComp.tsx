"use client";

import { useAccount } from 'wagmi';
import { useProfileStore } from '@/stores/useProfileStore';
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useUserFollow } from '@/hooks/useUserFollow';
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Twitter,
  Disc as Discord,
  Send as Telegram,
  Camera,
  Save,
  X,
  MapPin,
  UserPlus,
  UserMinus,
  Users,
  Check,
  Globe,
  Settings,
  BarChart3 as Leaderboard,
  Verified
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/button";

export default function InfoComp({ targetAddress }: { targetAddress?: string }) {
  const [, copyToClipboard] = useCopyToClipboard();
  const { address } = useAccount();
  const { currentProfile, uploadAvatar, updateCurrentProfile, setCurrentProfile } = useProfileStore();

  const profileAddress = targetAddress || address || '';
  const { profile, follow, unfollow, fetchFollowers, fetchFollowing } = useUserFollow(profileAddress);

  const isOwnProfile = address && profileAddress && address.toLowerCase() === profileAddress.toLowerCase();
  const isFollowing = profile?.isFollowing || false;

  const formattedFollowers = profile?.followerCount?.toLocaleString() || "0";
  const formattedFollowing = profile?.followingCount?.toLocaleString() || "0";
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    discord: '',
    telegram: ''
  });

  const walletKey = profileAddress;

  const userData = profile ? {
    username: currentProfile?.username || profileAddress.slice(0, 8),
    displayName: currentProfile?.displayName || `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`,
    bio: currentProfile?.bio || '',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    location: currentProfile?.location || "Neural Grid",
    followers: profile.followerCount || 0,
    following: profile.followingCount || 0,
    isVerified: currentProfile?.isVerified || false,
    socialLinks: {
      twitter: currentProfile?.twitter || '',
      discord: currentProfile?.discord || '',
      telegram: currentProfile?.telegram || ''
    },
    rank: {
      global: 128,
      percentile: 5
    }
  } : (currentProfile ? {
    username: currentProfile.username,
    displayName: currentProfile.displayName,
    bio: currentProfile.bio,
    joinDate: new Date(currentProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    location: currentProfile.location || "Neural Grid",
    followers: 0,
    following: 0,
    isVerified: currentProfile.isVerified,
    socialLinks: {
      twitter: currentProfile.twitter,
      discord: currentProfile.discord,
      telegram: currentProfile.telegram
    },
    rank: {
      global: 0,
      percentile: 100
    }
  } : {
    username: "ID0000",
    displayName: "Unknown Identity",
    bio: "Identity stream initializing...",
    joinDate: "Unknown Epoch",
    location: "Unknown Sector",
    followers: 0,
    following: 0,
    isVerified: false,
    socialLinks: {
      twitter: '',
      discord: '',
      telegram: ''
    },
    rank: {
      global: 0,
      percentile: 100
    }
  });

  useEffect(() => {
    if (profileAddress) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profileAddress, fetchFollowers, fetchFollowing]);

  useEffect(() => {
    if (address) {
      setCurrentProfile(address);
    }
  }, [address, setCurrentProfile]);

  useEffect(() => {
    if (isEditMode && currentProfile) {
      setEditData({
        displayName: currentProfile.displayName || '',
        bio: currentProfile.bio || '',
        location: currentProfile.location || '',
        website: currentProfile.website || '',
        twitter: currentProfile.twitter || '',
        discord: currentProfile.discord || '',
        telegram: currentProfile.telegram || ''
      });
    }
  }, [isEditMode, currentProfile]);

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid signal image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Signal payload too heavy (max 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const avatarUrl = await uploadAvatar(address, file);
      updateCurrentProfile({ avatar: avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    if (!currentProfile) return;

    try {
      await updateCurrentProfile(editData);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(walletKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card relative overflow-hidden group">
      {/* Dynamic Background Banner */}
      <div className="absolute inset-x-0 top-0 h-48 lg:h-56 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1639322537504-6427a16b0a28?q=80&w=1200&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0A0A1A]/60 to-[#0A0A1A]"></div>

          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        </div>
      </div>

      <div className="relative pt-32 lg:pt-40 px-6 lg:px-10 pb-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
          {/* Neural Core (Avatar) */}
          <div className="flex flex-col items-center lg:items-start shrink-0">
            <div className="relative group/avatar">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-32 w-32 lg:h-40 lg:w-40 rounded-3xl bg-gradient-to-br from-somnia-cyan via-somnia-blue to-somnia-violet p-1 shadow-[0_0_30px_rgba(34,199,255,0.3)] relative"
              >
                <div
                  className="h-full w-full rounded-[20px] bg-cover bg-center border-4 border-[#0A0A1A]"
                  style={{
                    backgroundImage: `url('${currentProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}&backgroundColor=b6e3f4`}')`
                  }}
                ></div>

                {/* Live Indicator */}
                <div className="absolute -bottom-1 -right-1 p-1 bg-[#0A0A1A] rounded-xl border border-white/10">
                  <div className="px-2 py-0.5 rounded-lg bg-somnia-cyan/10 border border-somnia-cyan/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-somnia-cyan animate-pulse shadow-[0_0_8px_rgba(34,199,255,1)]"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-somnia-cyan">Synced</span>
                  </div>
                </div>
              </motion.div>

              {isOwnProfile && (
                <>
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute inset-0 rounded-3xl bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 disabled:cursor-not-allowed backdrop-blur-sm"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-somnia-cyan border-t-transparent shadow-[0_0_15px_rgba(34,199,255,0.5)]"></div>
                    ) : (
                      <Camera className="text-somnia-cyan text-2xl drop-shadow-[0_0_10px_rgba(34,199,255,0.8)]" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                  <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter italic italic">
                    {userData.displayName}
                  </h2>
                  <AnimatePresence>
                    {userData.isVerified && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-1 rounded-lg bg-somnia-cyan/20 border border-somnia-cyan/40"
                      >
                        <Verified className="w-4 h-4 text-somnia-cyan" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {userData.rank.percentile <= 10 && (
                    <span className="bg-gradient-to-r from-somnia-magenta to-somnia-violet px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,128,0.3)]">
                      Elite Node
                    </span>
                  )}
                </div>
                <p className="text-somnia-cyan/60 font-mono text-sm mt-1">PROTOCOL ID: {userData.username}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {isOwnProfile ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Config Node
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowing
                      ? "bg-white/5 border border-white/10 text-text-muted hover:text-white"
                      : "bg-somnia-cyan text-black shadow-[0_0_20px_rgba(34,199,255,0.4)]"
                      }`}
                  >
                    {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? "Disconnect" : "Link Identity"}
                  </motion.button>
                )}

                <div className="flex gap-2">
                  {[
                    { icon: Twitter, link: userData.socialLinks.twitter, label: 'Twitter' },
                    { icon: Discord, link: userData.socialLinks.discord, label: 'Discord' },
                    { icon: Telegram, link: userData.socialLinks.telegram, label: 'Telegram' }
                  ].map((social, i) => social.link && (
                    <motion.a
                      key={i}
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(34,199,255,0.1)' }}
                      href={social.link.startsWith('http') ? social.link : `https://${social.label.toLowerCase()}.com/${social.link.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-somnia-cyan transition-colors"
                    >
                      <social.icon className="w-4 h-4" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Neural Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Identity Value", value: formattedFollowers, sub: "Synced Nodes", icon: Users },
                { label: "Signal Density", value: formattedFollowing, sub: "Downstream Links", icon: Globe },
                { label: "Neural Rank", value: `#${userData.rank.global}`, sub: "Global Percentile", icon: Leaderboard },
                { label: "Network Age", value: userData.joinDate.split(' ')[0], sub: `Epoch ${userData.joinDate.split(' ')[1]}`, icon: MapPin }
              ].map((metric, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center lg:items-start group/metric">
                  <div className="flex items-center gap-2 mb-2 text-text-muted/40 uppercase text-[9px] font-black tracking-widest group-hover/metric:text-somnia-cyan transition-colors">
                    <metric.icon className="w-3 h-3" />
                    {metric.label}
                  </div>
                  <div className="text-xl font-black text-white tracking-tighter">{metric.value}</div>
                  <div className="text-[8px] font-black text-text-muted/60 uppercase tracking-widest mt-1">{metric.sub}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
              <p className="text-text-muted text-sm max-w-2xl leading-relaxed italic">
                &quot;{userData.bio || "No biological summary provided for this identity node."}&quot;
              </p>

              <div className="flex items-center gap-3 p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <div className="px-3 py-1 font-mono text-[10px] text-text-muted/60 border-r border-white/10">
                  {walletKey.slice(0, 10)}...{walletKey.slice(-8)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-somnia-cyan transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Configuration Modal */}
      <AnimatePresence>
        {isEditMode && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={handleCancelEdit}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A1A] border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Configure Neural Identity</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Identity Encryption Protocol v4.0</p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-3 rounded-2xl bg-white/5 text-text-muted hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-somnia-cyan uppercase tracking-[0.2em] ml-1">Identity Display</label>
                    <input
                      type="text"
                      value={editData.displayName}
                      onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white text-sm focus:outline-none focus:border-somnia-cyan/50 transition-all font-medium"
                      placeholder="Neural Name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-somnia-cyan uppercase tracking-[0.2em] ml-1">Grid Sector</label>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white text-sm focus:outline-none focus:border-somnia-cyan/50 transition-all font-medium"
                      placeholder="Physical/Neural Location..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-somnia-cyan uppercase tracking-[0.2em] ml-1">Neural Bio-Stream</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white text-sm focus:outline-none focus:border-somnia-cyan/50 transition-all font-medium min-h-[120px] resize-none"
                    placeholder="Encode your biological summary..."
                    maxLength={160}
                  />
                  <div className="flex justify-end pr-2">
                    <span className="text-[9px] font-mono text-text-muted/40 uppercase tracking-widest">{editData.bio.length}/160 PAYLOAD</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-somnia-blue" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Signal Hubs</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { icon: Twitter, key: 'twitter', label: 'X-Stream' },
                      { icon: Discord, key: 'discord', label: 'Discord Node' },
                      { icon: Telegram, key: 'telegram', label: 'TG Channel' }
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[8px] font-black text-text-muted/60 uppercase tracking-widest ml-1">{field.label}</label>
                        <div className="relative">
                          <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                          <input
                            type="text"
                            value={editData[field.key as keyof typeof editData]}
                            onChange={(e) => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white text-xs focus:outline-none focus:border-somnia-cyan/50 transition-all"
                            placeholder="@handle"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <Button variant="ghost" onClick={handleCancelEdit} className="uppercase tracking-widest text-[10px] font-black opacity-60 hover:opacity-100">
                  Abort
                </Button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-somnia-cyan to-somnia-blue text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,199,255,0.3)] transition-all"
                >
                  <Save className="w-4 h-4" />
                  Commit Changes
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
