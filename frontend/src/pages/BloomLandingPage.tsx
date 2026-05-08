import {
  ArrowRight,
  Clock3,
  Gamepad2,
  LayoutGrid,
  Menu,
  Monitor,
  Timer,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import santaiVideo from "@/assets/video/santai2.mp4";

// ─── Santai logo — 8-petal flower built from rotated ellipses ──────────────
// Uses className instead of a fixed size so Tailwind responsive classes
// (w-8 h-8, w-14 h-14, etc.) can control the rendered dimensions.
function SantaiLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"   // no width/height attrs — Tailwind class drives size
      fill="none"
      aria-label="Santai logo"
    >
      {/* Each <ellipse> is a petal; rotate() spins it around the centre (16,16) */}
      {[0, 45, 90, 135].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="10"
          rx="3"
          ry="6"
          fill="white"
          fillOpacity="0.75"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

// ─── Icon pill helper — small rounded-full container used across the page ──
function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function BloomLandingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden font-display">

      {/* ── VIDEO BACKGROUND ─────────────────────────────────────────────── */}
      {/* z-0: sits furthest back; object-cover fills the whole viewport */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={santaiVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Subtle darkening scrim so the white text reads cleanly */}
      <div className="absolute inset-0 z-[1] bg-black/25" />

      {/* ── MAIN CONTENT (above video & scrim) ───────────────────────────── */}
      {/* flex-col on mobile stacks hero → cards; lg:flex-row puts them side-by-side */}
      <div className="relative z-10 flex flex-col">

        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL  —  52 % wide on desktop, full-width on mobile
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative flex w-full flex-col">

          {/* The glass layer is absolutely positioned BEHIND the content.
              inset-4/6 leaves a gap so the video peeks around the edges. */}
          <div className="liquid-glass-strong absolute inset-4 rounded-3xl lg:inset-6" />

          {/* All left-panel content lives here, z-10 above the glass */}
          <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 py-6 sm:px-8 sm:py-8 lg:px-14 lg:py-10">

            {/* ── NAV ─────────────────────────────────────────────────── */}
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SantaiLogo className="h-8 w-8" />
                <span className="text-2xl font-semibold tracking-tighter text-white">
                  Santai 
                </span>
              </div>

              <Link
                to="/app"
                className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-transform hover:scale-105 active:scale-95"
              >
                <Menu className="h-4 w-4" />
                Sessions
              </Link>
            </nav>

            {/* ── HERO CENTER ─────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center sm:gap-6 lg:gap-8">

              {/* Scales from 56 px on phones up to 80 px on desktop */}
              <SantaiLogo className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />

              <p className="liquid-glass rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/70">
                Real-time station view
              </p>

              <h1 className="text-4xl font-medium leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Santai E-Sports
                <br />
                <em className="font-serif italic text-white/80">
                  Studio{" "}
                </em>
                est.2023
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                See which stations are available, which are in use, and how
                much session time remains before choosing where to play.
              </p>

              <Link
                to="/app"
                className="liquid-glass-strong flex items-center gap-3 rounded-full px-7 py-4 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
              >
                View Available Sessions
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="liquid-glass rounded-full px-4 py-2 text-xs text-white/80">
                  Live Availability
                </span>
                <span className="liquid-glass rounded-full px-4 py-2 text-xs text-white/80">
                  Session Countdown
                </span>
                <span className="liquid-glass rounded-full px-4 py-2 text-xs text-white/80">
                  Easy Station Check
                </span>
              </div>
            </div>

            {/* ── BOTTOM QUOTE ────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 pb-4 text-center">
              <p className="text-xs uppercase tracking-widest text-white/50">
                Built for smoother play sessions
              </p>

              <blockquote className="text-base text-white/80 sm:text-lg">
                <span className="font-display">&ldquo;Know what is free, </span>
                <em className="font-serif italic text-white/60">
                  before you play.&rdquo;
                </em>
              </blockquote>

              {/* Author line: thin rules either side of the name */}
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-white/30" />
                <span className="text-xs uppercase tracking-widest text-white/50">
                  Santai Cybercafe
                </span>
                <div className="h-px w-12 bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL  —  full-width below hero on mobile, 48% on desktop
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col gap-6 p-4 sm:p-6">

          {/* ── TOP BAR ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">

            <div className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white">
              <Monitor className="h-4 w-4" />
              PCs & consoles ready to play
            </div>

            <Link
              to="/app"
              className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Gamepad2 className="h-4 w-4" />
              View Sessions
            </Link>
          </div>

          {/* ── LIVE STATUS SUMMARY ────────────────────────────────── */}
          {/* w-full on mobile so it doesn't look like a tiny orphan card */}
          <div className="liquid-glass w-full rounded-2xl p-5 sm:w-72">
            <h3 className="mb-2 text-sm font-medium text-white">
              Live status summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">--</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  Available
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">--</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  In Use
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">--</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  Total
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              Open the sessions dashboard to see live station data and session
              countdowns.
            </p>
          </div>

          {/* ── BOTTOM FEATURE SECTION ─────────────────────────────── */}
          {/* lg:mt-auto pushes this to the bottom only when the panel has a fixed height
              (desktop flex-row). On mobile the panel is auto-height so mt-auto has no effect. */}
          <div className="lg:mt-auto">
            {/* Outer glass container with larger radius per spec (2.5rem) */}
            <div className="liquid-glass rounded-[2.5rem] p-5">
              <div className="flex flex-col gap-4">

                {/* Two side-by-side feature cards */}
                <div className="flex gap-4">
                  <div className="liquid-glass flex flex-1 flex-col gap-3 rounded-3xl p-5">
                    <IconCircle>
                      <LayoutGrid className="h-4 w-4 text-white" />
                    </IconCircle>
                    <h4 className="text-sm font-medium text-white">
                      Real-time Availability
                    </h4>
                    <p className="text-xs leading-relaxed text-white/60">
                      Check which PCs or consoles are free before choosing a
                      station.
                    </p>
                  </div>

                  <div className="liquid-glass flex flex-1 flex-col gap-3 rounded-3xl p-5">
                    <IconCircle>
                      <Timer className="h-4 w-4 text-white" />
                    </IconCircle>
                    <h4 className="text-sm font-medium text-white">
                      Session Countdown
                    </h4>
                    <p className="text-xs leading-relaxed text-white/60">
                      See remaining play time clearly without asking staff for
                      every update.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="liquid-glass flex flex-1 flex-col gap-3 rounded-3xl p-5">
                    <IconCircle>
                      <Monitor className="h-4 w-4 text-white" />
                    </IconCircle>
                    <h4 className="text-sm font-medium text-white">
                      Station Overview
                    </h4>
                    <p className="text-xs leading-relaxed text-white/60">
                      Quickly understand each station status before walking to
                      the counter.
                    </p>
                  </div>

                  <div className="liquid-glass flex flex-1 flex-col gap-3 rounded-3xl p-5">
                    <IconCircle>
                      <Users className="h-4 w-4 text-white" />
                    </IconCircle>
                    <h4 className="text-sm font-medium text-white">
                      Simple Session Flow
                    </h4>
                    <p className="text-xs leading-relaxed text-white/60">
                      Pick a free station, ask staff to start it, then follow
                      the timer.
                    </p>
                  </div>
                </div>

                {/* How it works keeps the landing page clear for first-time users. */}
                <div className="liquid-glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Clock3 className="h-7 w-7 text-white" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-sm font-medium text-white">
                      How it works
                    </h4>
                    <ol className="space-y-1 text-xs leading-relaxed text-white/60">
                      <li>1. Check which station is available.</li>
                      <li>2. Pick a station or ask staff to start your session.</li>
                      <li>3. Track remaining time live.</li>
                    </ol>
                  </div>

                  <Link
                    to="/app"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform hover:scale-105 active:scale-95"
                    aria-label="View available sessions"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
        {/* end right panel */}

      </div>
    </div>
  );
}
