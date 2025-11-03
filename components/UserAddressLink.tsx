"use client";

import Link from "next/link";
import { formatAddress } from "@/utils/formatters";

interface UserAddressLinkProps {
  address: string;
  children?: React.ReactNode;
  className?: string;
  startChars?: number;
  endChars?: number;
}

/**
 * Reusable component for clickable wallet addresses/usernames
 * Navigates to public profile page
 */
export default function UserAddressLink({ 
  address, 
  children, 
  className = "",
  startChars = 6,
  endChars = 4
}: UserAddressLinkProps) {
  if (!address) return null;

  const displayText = children || formatAddress(address, startChars, endChars);

  return (
    <Link
      href={`/profile/${address}`}
      className={`hover:text-primary transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
    >
      {displayText}
    </Link>
  );
}

