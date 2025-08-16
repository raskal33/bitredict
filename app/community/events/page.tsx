"use client";

import { useState } from "react";
import Button from "@/components/button";
import Image from "next/image";
import { FiSearch, FiCalendar, FiMapPin, FiClock, FiUsers, FiPlus, FiFilter } from "react-icons/fi";

// Mock data for community events
const EVENTS = [
  {
    id: 1,
    title: "Crypto Market Analysis Webinar",
    description: "Join us for an in-depth analysis of current crypto market trends and future predictions.",
    date: "2023-12-15T18:00:00",
    location: "Online - Zoom",
    type: "Webinar",
    attendees: 128,
    host: "CryptoExpert",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNyeXB0byUyMGNvbmZlcmVuY2V8ZW58MHx8MHx8fDA%3D"
  },
  {
    id: 2,
    title: "Trading Strategy Workshop",
    description: "Learn practical trading strategies from experienced traders in this interactive workshop.",
    date: "2023-12-22T14:00:00",
    location: "Online - Discord",
    type: "Workshop",
    attendees: 75,
    host: "TradingPro",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dHJhZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    id: 3,
    title: "Community Meetup: NYC",
    description: "Meet fellow community members in person and network with like-minded individuals.",
    date: "2024-01-10T17:30:00",
    location: "The Hub, Manhattan, New York",
    type: "Meetup",
    attendees: 42,
    host: "CommunityTeam",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D"
  },
  {
    id: 4,
    title: "AI in Finance Conference",
    description: "Explore the latest developments in AI and machine learning applications in finance.",
    date: "2024-01-25T09:00:00",
    location: "Tech Center, San Francisco",
    type: "Conference",
    attendees: 215,
    host: "AIFinance",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D"
  }
];

const EVENT_TYPES = ["All", "Webinar", "Workshop", "Meetup", "Conference"];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // Filter events based on search and type
  const filteredEvents = EVENTS.filter(event => {
    const matchesSearch = 
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || event.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Format time
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold text-primary">Community Events</h1>
        <p className="text-text-secondary">
          Join upcoming events, webinars, and meetups organized by the community.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 rounded-lg bg-bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-button border border-border-input bg-bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<FiPlus />}
          >
            Create Event
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FiFilter className="text-primary" />
          <span className="text-sm text-text-muted">Event type:</span>
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedType === type
                  ? "bg-primary text-black"
                  : "bg-bg-card text-text-muted hover:bg-bg-card"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">
          Showing {filteredEvents.length} of {EVENTS.length} events
        </span>
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg bg-bg-card p-8 text-center">
          <FiCalendar className="h-12 w-12 text-text-muted" />
          <h3 className="text-xl font-medium text-text-secondary">No events found</h3>
          <p className="text-text-muted">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredEvents.map((event) => (
            <div 
              key={event.id} 
              className="flex flex-col overflow-hidden rounded-lg bg-bg-card shadow-card transition-all hover:shadow-glow-cyan"
            >
              <div className="relative h-48 overflow-hidden">
                <Image 
                  src={event.image} 
                  alt={event.title} 
                  width={500}
                  height={200}
                  className="h-full w-full object-cover transition-transform hover:scale-105" 
                />
                <div className="absolute top-0 right-0 m-2 rounded-full bg-primary bg-opacity-90 px-3 py-1 text-xs font-bold text-black">
                  {event.type}
                </div>
              </div>
              
              <div className="flex flex-col gap-4 p-6">
                <h3 className="text-xl font-semibold text-text-secondary">{event.title}</h3>
                <p className="text-sm text-text-muted">{event.description}</p>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FiCalendar className="text-primary" />
                    <span className="text-text-secondary">{formatEventDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FiClock className="text-primary" />
                    <span className="text-text-secondary">{formatEventTime(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FiMapPin className="text-primary" />
                    <span className="text-text-secondary">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FiUsers className="text-primary" />
                    <span className="text-text-secondary">{event.attendees} attending</span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Hosted by <span className="font-medium text-primary">{event.host}</span></span>
                </div>
                
                <div className="mt-2 flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    fullWidth
                  >
                    Register
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 