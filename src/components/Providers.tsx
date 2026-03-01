"use client";

import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/prerender or when Privy isn't configured, render without provider
  if (!mounted || !PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["google", "tiktok"],
        appearance: {
          theme: "dark",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
