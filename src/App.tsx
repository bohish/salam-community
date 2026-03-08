import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import PlayersPage from "@/pages/PlayersPage";
import SearchPage from "@/pages/SearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <AppHeader />
          <main className="flex-1 pb-safe app-scroll">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/market" element={<PlayersPage />} />
              <Route path="/more" element={<HomePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
