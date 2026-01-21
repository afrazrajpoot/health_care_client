"use client";

import { ReactNode, useState } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "./theme-provider";
// import { ReduxProvider } from "@/redux/provider";
import { Session } from "inspector/promises";
import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./redux-provider";
// import { LayoutWrapper } from "@/components/layout/layout-wrapper";

import { SocketProvider } from "./SocketProvider";
import { ProgressTracker } from "@/components/ProgressTracker";

export function Providers({ children }: { children: ReactNode }) {
  // const [queryClient] = useState(() => new QueryClient());

  return (
    // <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <SocketProvider>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            <TooltipProvider>
              {children}
          
              <Sonner position="top-center" />
            </TooltipProvider>
          </ThemeProvider>
        </ReduxProvider>
      </SocketProvider>
    </SessionProvider>
    // </QueryClientProvider>
  );
}
