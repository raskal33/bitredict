"use client";

// Client-side BigInt serialization setup
// This must run on the client to fix static chunk issues

if (typeof window !== 'undefined') {
  // Ensure BigInt has toJSON method for proper serialization
  if (typeof BigInt !== 'undefined' && !(BigInt.prototype as unknown as { toJSON?: () => string }).toJSON) {
    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function(this: bigint) {
      return this.toString();
    };
  }
}

export function setupBigIntSerialization() {
  // This is a no-op function that triggers the side effects above
  // Call this in components that deal with BigInt to ensure setup
}