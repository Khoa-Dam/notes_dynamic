"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import type { ThemeProviderProps } from "next-themes";

import { TooltipProvider } from "./ui/tooltip";
import { QuickCreateProvider } from "./providers/quick-create-provider";

export const Providers: React.FCC<{
  theme?: ThemeProviderProps;
}> = ({ children, theme }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...theme}
    >
      <SessionProvider basePath="/api/auth">
        <TooltipProvider>
          {children}
          <QuickCreateProvider />
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
};
