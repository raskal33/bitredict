"use client";

import { ReactNode } from 'react';

export default function AppWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
