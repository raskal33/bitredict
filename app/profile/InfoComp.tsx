"use client";

import { useAccount } from 'wagmi';
import { useProfileStore } from '@/stores/useProfileStore';
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useUserFollow } from '@/hooks/useUserFollow';
import { FaCopy, FaTwitter, FaDiscord, FaTelegram, FaCamera, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdVerified, MdOutlineLeaderboard } from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { RiUserFollowLine, RiUserFollowFill } from "react-icons/ri";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/button";

export default function InfoComp({ targetAddress }: { targetAddress?: string }) {
  const [, copyToClipboard] = useCopyToClipboard();
  const { address } = useAccount();
  const { currentProfile, uploadAvatar, updateCurrentProfile, setCurrentProfile } = useProfileStore();
  
  // Use the profile address or target address, default to current user
  const profileAddress = targetAddress || address || '';
  const { profile, follow, unfollow, fetchFollowers, fetchFollowing } = useUserFollow(profileAddress);
  
  // Determine if current user is viewing their own profile
  const isOwnProfile = address && profileAddress && address.toLowerCase() === profileAddress.toLowerCase();
  const isFollowing = profile?.isFollowing || false;
  
  // Format follower/following counts
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
  
  const walletKey = address;
  
  // Use profile data from backend API or fallback to store/mock data
  const userData = profile ? {
    username: currentProfile?.username || profileAddress.slice(0, 8),
    displayName: currentProfile?.displayName || `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`,
    bio: currentProfile?.bio || '',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    location: currentProfile?.location || "Unknown",
    followers: profile.followerCount || 0,
    following: profile.followingCount || 0,
    isVerified: currentProfile?.isVerified || false,
    socialLinks: {
      twitter: currentProfile?.twitter || '',
      discord: currentProfile?.discord || '',
      telegram: currentProfile?.telegram || ''
    },
    rank: {
      global: 0,
      percentile: 100
    }
  } : (currentProfile ? {
    username: currentProfile.username,
    displayName: currentProfile.displayName,
    bio: currentProfile.bio,
    joinDate: new Date(currentProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    location: currentProfile.location || "Unknown",
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
    username: "Unknown",
    displayName: "Unknown User",
    bio: "",
    joinDate: "Unknown",
    location: "Unknown",
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

  // Fetch followers and following when component mounts
  useEffect(() => {
    if (profileAddress) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profileAddress, fetchFollowers, fetchFollowing]);

  // Set current profile when address changes
  useEffect(() => {
    if (address) {
      setCurrentProfile(address);
    }
  }, [address, setCurrentProfile]);

  // Initialize edit data when entering edit mode
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const avatarUrl = await uploadAvatar(address, file);
      updateCurrentProfile({ avatar: avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload image. Please try again.');
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
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData({
      displayName: '',
      bio: '',
      location: '',
      website: '',
      twitter: '',
      discord: '',
      telegram: ''
    });
  };

  return (
    <div className="glass-card relative overflow-hidden">
      {/* Background banner */}
      <div 
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-somnia-blue to-somnia-violet"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1639322537504-6427a16b0a28?q=80&w=1200&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-main opacity-80"></div>
      </div>
      
      <div className="relative pt-28 px-6 pb-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r p-1 from-somnia-cyan to-somnia-violet">
                <div 
                  className="h-full w-full rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${currentProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}&backgroundColor=b6e3f4`}')`
                  }}
                ></div>
              </div>
              
              {/* Upload overlay for own profile */}
              {isOwnProfile && (
                <>
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <FaCamera className="text-white text-xl" />
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
              
              {userData.isVerified && (
                <div className="absolute -right-1 bottom-1 rounded-full bg-primary p-1 text-black">
                  <MdVerified size={20} />
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{userData.displayName}</h2>
                {userData.rank.percentile <= 10 && (
                  <span className="rounded-full bg-gradient-to-r from-somnia-cyan to-somnia-blue px-2 py-0.5 text-xs font-bold text-black">
                    TOP {userData.rank.percentile}%
                  </span>
                )}
              </div>
              <p className="text-text-muted">@{userData.username}</p>
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              {isOwnProfile ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditMode(!isEditMode)}
                  leftIcon={<FaEdit />}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  variant={isFollowing ? "outline" : "primary"} 
                  size="sm" 
                  onClick={handleFollow}
                  leftIcon={isFollowing ? <RiUserFollowFill /> : <RiUserFollowLine />}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              
              <div className="flex gap-2">
                {userData.socialLinks.twitter && (
                  <a 
                    href={userData.socialLinks.twitter.startsWith('http') ? userData.socialLinks.twitter : `https://twitter.com/${userData.socialLinks.twitter.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="rounded-full bg-bg-card p-2 text-text-muted hover:bg-bg-card hover:text-primary transition-colors"
                  >
                    <FaTwitter size={16} />
                  </a>
                )}
                {userData.socialLinks.discord && (
                  <a 
                    href={userData.socialLinks.discord.startsWith('http') ? userData.socialLinks.discord : `https://discord.com/users/${userData.socialLinks.discord}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={userData.socialLinks.discord} 
                    className="rounded-full bg-bg-card p-2 text-text-muted hover:bg-bg-card hover:text-primary transition-colors"
                  >
                    <FaDiscord size={16} />
                  </a>
                )}
                {userData.socialLinks.telegram && (
                  <a 
                    href={userData.socialLinks.telegram.startsWith('http') ? userData.socialLinks.telegram : `https://t.me/${userData.socialLinks.telegram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={userData.socialLinks.telegram} 
                    className="rounded-full bg-bg-card p-2 text-text-muted hover:bg-bg-card hover:text-primary transition-colors"
                  >
                    <FaTelegram size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats and additional info */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <div className="flex items-center gap-1 text-text-muted">
                <HiOutlineLocationMarker />
                <span>{userData.location}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <MdOutlineLeaderboard />
                <span>Rank #{userData.rank.global}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <span>Active since {userData.joinDate}</span>
              </div>
            </div>
            
            <p className="text-text-secondary">{userData.bio}</p>
            
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{formattedFollowers}</div>
                <div className="text-sm text-text-muted">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{formattedFollowing}</div>
                <div className="text-sm text-text-muted">Following</div>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-bg-card px-3 py-1">
                <div className="w-40 truncate text-sm text-text-secondary">
                  {walletKey || "0x1a2b...3c4d"}
                </div>
                <FaCopy
                  className="cursor-pointer text-text-muted hover:text-primary"
                  onClick={() => copyToClipboard(walletKey || "0x1a2b...3c4d")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border-primary bg-bg-card p-6">
              <h3 className="text-xl font-bold text-text-secondary">Edit Profile</h3>
              <button
                onClick={handleCancelEdit}
                className="rounded-full p-2 text-text-muted hover:bg-bg-card hover:text-text-secondary"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={160}
                />
                <div className="flex justify-end text-sm mt-1">
                  <span className="text-text-muted">{editData.bio.length}/160</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-text-secondary">Social Links</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                      <FaTwitter className="h-4 w-4" />
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={editData.twitter}
                      onChange={(e) => setEditData(prev => ({ ...prev, twitter: e.target.value }))}
                      className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                      <FaDiscord className="h-4 w-4" />
                      Discord
                    </label>
                    <input
                      type="text"
                      value={editData.discord}
                      onChange={(e) => setEditData(prev => ({ ...prev, discord: e.target.value }))}
                      className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="username#1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                      <FaTelegram className="h-4 w-4" />
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={editData.telegram}
                      onChange={(e) => setEditData(prev => ({ ...prev, telegram: e.target.value }))}
                      className="w-full rounded-button border border-border-input bg-bg-card px-4 py-3 text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveProfile}
                  leftIcon={<FaSave />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
