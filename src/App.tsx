import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import PlayersPage from "@/pages/PlayersPage";
import AuthPage from "@/pages/AuthPage";
import PlayerDetailPage from "@/pages/PlayerDetailPage";
import FavoritesPage from "@/pages/FavoritesPage";
import ComparePage from "@/pages/ComparePage";
import ClubsPage from "@/pages/ClubsPage";
import NationsPage from "@/pages/NationsPage";
import LeaguesPage from "@/pages/LeaguesPage";
import EntityPlayersPage from "@/pages/EntityPlayersPage";
import StatsIndexPage from "@/pages/StatsIndexPage";
import StatsPage from "@/pages/StatsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" position="top-center" />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" dir="rtl">
          <AppHeader />
          <main className="flex-1 pb-safe">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/player/:id" element={<PlayerDetailPage />} />
              <Route path="/stats" element={<StatsIndexPage />} />
              <Route path="/stats/:slug" element={<StatsPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/club/:name" element={<EntityPlayersPage mode="club" />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/league/:name" element={<EntityPlayersPage mode="league" />} />
              <Route path="/nations" element={<NationsPage />} />
              <Route path="/nation/:name" element={<EntityPlayersPage mode="nation" />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/auth" element={<AuthPage />} />
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
