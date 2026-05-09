import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { LayoutGridIcon, ShieldIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { BloomLandingPage } from "@/pages/BloomLandingPage";
import loadingVideo from "@/assets/video/loadingsantai2.mp4";

const navLinkClass =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center gap-6 p-6 py-10">
      <header className="flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-center text-xs sm:text-left">
          <span className="text-foreground font-medium">Santai</span> — cybercafe
          management
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm sm:justify-end"
          aria-label="Main"
        >
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              cn(
                navLinkClass,
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <LayoutGridIcon className="size-4" aria-hidden />
            Stations
          </NavLink>
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              cn(
                navLinkClass,
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <ShieldIcon className="size-4" aria-hidden />
            Admin
          </NavLink>
        </nav>
      </header>

      <Outlet />
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

        {/* Santai cybercafe app — wrapped in the standard shell */}
        <Route element={<AppLayout />}>
          <Route path="/app" element={<HomePage />} />
          <Route path="/app/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
