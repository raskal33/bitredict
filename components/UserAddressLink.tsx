"use client";

import Link from 'next/link';
import { useAccount } from 'wagmi';

interface UserAddressLinkProps {
  address: string;
  className?: string;
  showFull?: boolean;
  truncateLength?: number;
}

export default function UserAddressLink({ 
  address, 
  className = "text-gray-400 hover:text-primary transition-colors",
  showFull = false,
  truncateLength = 6
}: UserAddressLinkProps) {
  const { address: connectedAddress } = useAccount();
  const isOwnProfile = connectedAddress && address && 
    connectedAddress.toLowerCase() === address.toLowerCase();

  const displayAddress = showFull 
    ? address 
    : `${address.slice(0, truncateLength)}...${address.slice(-4)}`;

  // If viewing own profile, link to /profile, otherwise to /user/[address]
  const href = isOwnProfile ? '/profile' : `/user/${address}`;

  return (
    <Link 
      href={href} 
      className={className}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      {displayAddress}
    </Link>
  );
}

