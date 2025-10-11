"use client";

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ScrollToTop component - Automatically scrolls to top of page on route change
 * This fixes the issue where Next.js preserves scroll position between pages
 */
function ScrollToTopInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a hash in the URL (e.g., #section)
    const hash = window.location.hash;
    
    if (hash) {
      // If there's a hash, let the browser handle scrolling to that element
      // Add a small delay to ensure the element is rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // No hash, scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use 'instant' for immediate scroll
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

export default function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopInner />
    </Suspense>
  );
}

