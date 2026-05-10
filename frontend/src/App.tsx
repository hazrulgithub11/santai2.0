import { useEffect, useState } from "react";
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SantaiLogo } from "@/components/SantaiLogo";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { LiveStationsPage } from "@/pages/LiveStationsPage";
import { ViewLivePage } from "@/pages/ViewLivePage";
import { BloomLandingPage } from "@/pages/BloomLandingPage";
import { AdminAnalyticsPage } from "@/pages/AdminAnalyticsPage";
import { AdminOperationsPage } from "@/pages/AdminOperationsPage";
import loadingVideo from "@/assets/video/loadingsantai2.mp4";

function AppLayout() {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-black font-display">
      {/* Same ambient stack as the landing page secondary panel — keeps the sessions view visually in-family. */}
      <div className="bloom-landing-secondary relative flex min-h-[100dvh] flex-1 flex-col">
        <div className="bloom-landing-secondary__ambient" aria-hidden />
        <div className="bloom-landing-secondary__frost" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col items-center px-5 py-8 sm:px-8 sm:py-10">
          <header className="flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <SantaiLogo className="h-8 w-8 shrink-0" />
              <span className="text-2xl font-semibold tracking-tighter text-white">
                Vike Legacy
              </span>
            </div>
            <nav aria-label="Sessions">
              <Link
                to="/"
                className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to home
              </Link>
            </nav>
          </header>

          <main className="mt-10 flex w-full max-w-5xl flex-1 flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function LandingWithLoadingVideo() {
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false);

  useEffect(() => {
    // Fallback so users are never stuck on the loading screen.
    const fallbackTimer = window.setTimeout(() => {
      setHasFinishedLoading(true);
    }, 7000);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  if (hasFinishedLoading) {
    return <BloomLandingPage />;
  }

  return (
    <div className="fixed inset-0 bg-black">
      <video
        className="h-full w-full object-cover"
        src={loadingVideo}
        autoPlay
        muted
        playsInline
        onEnded={() => setHasFinishedLoading(true)}
        onError={() => setHasFinishedLoading(true)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Bloom landing page — full-screen, no app shell */}
        <Route path="/" element={<LandingWithLoadingVideo />} />

        {/* Vike Legacy app — wrapped in the standard shell */}
        <Route element={<AppLayout />}>
          <Route path="/app" element={<HomePage />} />
          <Route path="/app/live" element={<LiveStationsPage />} />
          <Route path="/app/view-live" element={<ViewLivePage />} />
          <Route path="/app/admin" element={<AdminPage />} />
          <Route path="/app/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/app/admin/operations" element={<AdminOperationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
