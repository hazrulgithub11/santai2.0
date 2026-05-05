import { BrowserRouter, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { LayoutGridIcon, ShieldIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";

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
            to="/"
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
            to="/admin"
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
