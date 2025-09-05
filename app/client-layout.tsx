'use client';

import { useEffect } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientLayout({ children, className }: ClientLayoutProps) {
  useEffect(() => {
    // Suppress hydration warnings for browser extension attributes
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Warning: Did not expect server HTML to contain') &&
        (args[0].includes('data-new-gr-c-s-check-loaded') ||
         args[0].includes('data-gr-ext-installed'))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <body className={className} suppressHydrationWarning>
      {children}
    </body>
  );
}