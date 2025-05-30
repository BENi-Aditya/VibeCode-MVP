import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { WaitlistProvider } from './components/WaitlistContext';
import { useEffect } from "react";
import './styles/blueprint.css';


const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Check system preference for dark/light mode and apply it
    if (typeof window !== 'undefined') {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Listen for changes in system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    // Initialize all the cool 3D effects
    if (typeof window !== 'undefined') {
      // Import and initialize the effects
      import('./scripts/tiltEffect').then(({ initTiltEffect, initParticles, initTerminalTilt }) => {
        // Init tilt effect for cards
        initTiltEffect();
        
        // Init floating particles
        initParticles();
        
        // Init terminal tilt effect
        initTerminalTilt();
        
        // Custom cursor effect for desktop only (mobile devices use native touch handling)
        if (window.matchMedia('(min-width: 768px)').matches) {
          import('./scripts/tiltEffect').then(({ initCustomCursor }) => {
            initCustomCursor();
          });
        }
      });
    }
  }, []);

  return (
    <WaitlistProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="blueprint-bg min-h-screen">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </WaitlistProvider>
  );
}

export default App;
