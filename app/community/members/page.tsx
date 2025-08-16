"use client";

import { useState } from "react";
import { FiSearch, FiUser, FiStar } from "react-icons/fi";
import Link from "next/link";

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Sample member data - in a real app this would come from an API
  const members = [
    {
      id: 1,
      name: "CryptoOracle",
      role: "Top Predictor",
      avatar: "CO",
      stats: {
        predictions: 45,
        winRate: "82%",
        discussions: 23
      },
      reputation: 4.8,
      joinDate: "Mar 2024"
    },
    {
      id: 2,
      name: "MarketMaker",
      role: "Active Creator",
      avatar: "MM",
      stats: {
        predictions: 38,
        winRate: "75%",
        discussions: 18
      },
      reputation: 4.6,
      joinDate: "Apr 2024"
    },
    {
      id: 3,
      name: "BetMaster",
      role: "High Roller",
      avatar: "BM",
      stats: {
        predictions: 62,
        winRate: "78%",
        discussions: 31
      },
      reputation: 4.7,
      joinDate: "Feb 2024"
    },
    {
      id: 4,
      name: "TrendSpotter",
      role: "Community Helper",
      avatar: "TS",
      stats: {
        predictions: 29,
        winRate: "70%",
        discussions: 45
      },
      reputation: 4.5,
      joinDate: "May 2024"
    }
  ];

  const roles = ["Top Predictor", "Active Creator", "High Roller", "Community Helper"];

  const filteredMembers = members.filter(member => {
    const matchesSearch = (member.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-lg bg-bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-secondary">Community Members</h1>
            <p className="text-text-muted">Connect with fellow predictors and traders</p>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <FiUser />
            <span>{members.length} Members</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-button border border-border-input bg-bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRole(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedRole === null
                  ? "bg-primary text-black"
                  : "bg-bg-card text-text-muted hover:bg-bg-card"
              }`}
            >
              All Roles
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedRole === role
                    ? "bg-primary text-black"
                    : "bg-bg-card text-text-muted hover:bg-bg-card"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Link
              href="/profile"
              key={member.id}
              className="flex flex-col items-center rounded-lg bg-bg-card p-6 text-center shadow-card transition-all hover:shadow-glow-cyan"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-black">
                {member.avatar}
              </div>
              
              <h3 className="mb-2 text-lg font-semibold text-text-secondary">
                {member.name}
              </h3>
              
              <span className="mb-4 rounded-full bg-bg-card px-3 py-1 text-xs font-medium text-secondary">
                {member.role}
              </span>

              <div className="mb-4 flex items-center gap-1">
                <FiStar className="h-4 w-4 text-warning" />
                <span className="text-sm text-text-muted">{member.reputation}</span>
              </div>

              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Predictions:</span>
                  <span className="font-medium text-text-secondary">{member.stats.predictions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Win Rate:</span>
                  <span className="font-medium text-primary">{member.stats.winRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Discussions:</span>
                  <span className="font-medium text-text-secondary">{member.stats.discussions}</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-text-muted">
                Joined {member.joinDate}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg bg-bg-card p-8 text-center">
          <FiUser className="h-12 w-12 text-text-muted" />
          <div>
            <h3 className="text-lg font-medium text-text-secondary">No Members Found</h3>
            <p className="text-text-muted">Try adjusting your search or filters</p>
          </div>
        </div>
      )}
    </div>
  );
} 