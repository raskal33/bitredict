"use client";

import { useState } from "react";
import Button from "@/components/button";
import Image from "next/image";
import { Search, Calendar, MapPin, Clock, Users, Plus, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock data for community events
const EVENTS = [
  {
    id: 1,
    title: "Neural Collective: Weekly Sync",
    description: "The primary synchronization hub for high-frequency trading delegates and protocol architects.",
    date: "2024-12-15T18:00:00",
    location: "Online - Somnia Nexus",
    type: "Webinar",
    attendees: 128,
    host: "CryptoExpert",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "Quant Strategy Workshop",
    description: "An intensive training session on leveraging the latest algorithmic signals for predictive arbitrage.",
    date: "2024-12-22T14:00:00",
    location: "Online - Discord Hub",
    type: "Workshop",
    attendees: 75,
    host: "TradingPro",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    title: "Cyberpunk Meetup: NYC Node",
    description: "Physical gathering for regional operators. Networking, strategy exchange, and local liquidity sync.",
    date: "2025-01-10T17:30:00",
    location: "Night City Lounge, Manhattan, NY",
    type: "Meetup",
    attendees: 42,
    host: "CommunityTeam",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60"
  }
];

const EVENT_TYPES = ["All", "Webinar", "Workshop", "Meetup", "Conference"];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const filteredEvents = EVENTS.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-somnia-cyan" />
          <input
            type="text"
            placeholder="Filter protocol events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-somnia-cyan/50 focus:ring-1 focus:ring-somnia-cyan/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedType === type
                  ? "bg-somnia-cyan text-black"
                  : "text-text-muted hover:text-white"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
          <Button variant="outline" className="!rounded-2xl border-white/10 hidden md:flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Host Event
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className="glass-card flex flex-col md:flex-row h-full border-white/5 group-hover:border-somnia-blue/30 transition-all overflow-hidden">
                {/* Image Section */}
                <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0A0A1A] via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-somnia-blue text-white px-2.5 py-1 rounded-md shadow-lg shadow-somnia-blue/20">
                      {event.type}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 flex flex-col gap-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-somnia-blue transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-3.5 h-3.5 text-somnia-cyan" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-3.5 h-3.5 text-somnia-cyan" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{formatEventTime(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-3.5 h-3.5 text-somnia-cyan" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white/80 line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-3.5 h-3.5 text-somnia-cyan" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{event.attendees} Residents</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black">
                        {event.host.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{event.host}</span>
                    </div>
                    <Button variant="primary" size="sm" className="!rounded-xl px-6 h-10 group/btn">
                      Sync Node
                      <Zap className="w-3.5 h-3.5 ml-2 group-hover/btn:fill-current" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-20 glass-card border-dashed border-white/5 space-y-4">
          <Zap className="w-12 h-12 text-text-muted/20 mx-auto rotate-180" />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Zero Events Detected</h3>
            <p className="text-xs text-text-muted">Broadcast signal lost. No upcoming protocols match your criteria.</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedType("All")} size="sm" className="!rounded-xl border-white/10">Show All Protocols</Button>
        </div>
      )}
    </div>
  );
}
