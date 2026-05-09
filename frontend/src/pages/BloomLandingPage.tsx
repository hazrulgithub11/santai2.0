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
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import santaiVideo from "@/assets/video/santai2.mp4";
import { getApiBaseUrl } from "@/lib/api-base";
import { parseStationsPayload, readErrorMessage } from "@/lib/stations-api";

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
  const apiBase = getApiBaseUrl();
  const featureSlides = [
    [
      {
        title: "Real-time Availability",
        description:
          "Check which PCs or consoles are free before choosing a station.",
        icon: LayoutGrid,
      },
      {
        title: "Session Countdown",
        description:
          "See remaining play time clearly without asking staff for every update.",
        icon: Timer,
      },
    ],
    [
      {
        title: "Station Overview",
        description:
          "Quickly understand each station status before walking to the counter.",
        icon: Monitor,
      },
      {
        title: "Simple Session Flow",
        description:
          "Pick a free station, ask staff to start it, then follow the timer.",
        icon: Users,
      },
    ],
  ];

  const [activeFeatureSlide, setActiveFeatureSlide] = useState(0);
  const [isDraggingFeatureSlider, setIsDraggingFeatureSlider] = useState(false);
  const [scrollFeatureProgress, setScrollFeatureProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [isFeatureVisible, setIsFeatureVisible] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeDeltaXRef = useRef(0);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const statusSummaryRef = useRef<HTMLDivElement | null>(null);
  const featureSectionRef = useRef<HTMLDivElement | null>(null);
  const hasPassedScrollStepRef = useRef(false);
  const [liveStatusSummary, setLiveStatusSummary] = useState<{
    available: number;
    inUse: number;
    total: number;
  } | null>(null);
  const [liveStatusError, setLiveStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiBase) {
      setLiveStatusSummary(null);
      setLiveStatusError(
        "Set VITE_API_BASE_URL to show live station availability.",
      );
      return;
    }

    let isDisposed = false;

    const loadLiveStatusSummary = async () => {
      try {
        const response = await fetch(`${apiBase}/api/stations`, { method: "GET" });
        const data: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (!isDisposed) {
            setLiveStatusSummary(null);
            setLiveStatusError(
              readErrorMessage(data, `Request failed (${response.status})`),
            );
          }
          return;
        }

        const stations = parseStationsPayload(data);
        if (!stations) {
          if (!isDisposed) {
            setLiveStatusSummary(null);
            setLiveStatusError("Unexpected response from server.");
          }
          return;
        }

        // We count directly from normalized station rows so this card always
        // matches the same backend truth as the sessions dashboard.
        let inUse = 0;
        for (const station of stations) {
          if (station.isActive) {
            inUse += 1;
          }
        }

        if (!isDisposed) {
          setLiveStatusSummary({
            available: stations.length - inUse,
            inUse,
            total: stations.length,
          });
          setLiveStatusError(null);
        }
      } catch (error) {
        if (!isDisposed) {
          setLiveStatusSummary(null);
          setLiveStatusError(
            error instanceof Error ? error.message : "Network error",
          );
        }
      }
    };

    void loadLiveStatusSummary();
    const refreshIntervalId = window.setInterval(() => {
      void loadLiveStatusSummary();
    }, 15000);

    return () => {
      isDisposed = true;
      window.clearInterval(refreshIntervalId);
    };
  }, [apiBase]);

  const goToNextFeatureSlide = () => {
    setActiveFeatureSlide((currentSlide) => {
      const nextSlide = currentSlide + 1;
      return nextSlide >= featureSlides.length ? 0 : nextSlide;
    });
  };

  const goToPreviousFeatureSlide = () => {
    setActiveFeatureSlide((currentSlide) => {
      const previousSlide = currentSlide - 1;
      return previousSlide < 0 ? featureSlides.length - 1 : previousSlide;
    });
  };

  useEffect(() => {
    if (isDraggingFeatureSlider) {
      return;
    }
    if (scrollFeatureProgress > 0.1 && scrollFeatureProgress < 0.9) {
      return;
    }

    const intervalId = window.setInterval(() => {
      goToNextFeatureSlide();
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [featureSlides.length, isDraggingFeatureSlider, scrollFeatureProgress]);

  useEffect(() => {
    // This handler maps page scroll to two things:
    // 1) a 0..1 progress value for subtle section animation,
    // 2) a step toggle that switches between feature slides.
    const updateScrollDrivenFeatureState = () => {
      const featureSection = featureSectionRef.current;
      if (!featureSection) {
        return;
      }

      const sectionRect = featureSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const travelDistance = viewportHeight + sectionRect.height;
      if (travelDistance <= 0) {
        return;
      }

      // We normalize scroll position so animation stays stable on different
      // screen heights and content heights.
      const normalizedProgress = (viewportHeight - sectionRect.top) / travelDistance;
      const clampedProgress = Math.max(0, Math.min(1, normalizedProgress));
      setScrollFeatureProgress(clampedProgress);

      // Single mid-point threshold keeps this interaction predictable:
      // before midpoint -> first slide, after midpoint -> second slide.
      const hasPassedMidpoint = clampedProgress >= 0.5;
      if (hasPassedMidpoint !== hasPassedScrollStepRef.current) {
        hasPassedScrollStepRef.current = hasPassedMidpoint;
        const targetSlide = hasPassedMidpoint
          ? Math.min(1, featureSlides.length - 1)
          : 0;
        setActiveFeatureSlide(targetSlide);
      }
    };

    updateScrollDrivenFeatureState();
    window.addEventListener("scroll", updateScrollDrivenFeatureState, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollDrivenFeatureState);

    return () => {
      window.removeEventListener("scroll", updateScrollDrivenFeatureState);
      window.removeEventListener("resize", updateScrollDrivenFeatureState);
    };
  }, [featureSlides.length]);

  useEffect(() => {
    // Respecting reduced-motion prevents heavy animations for users who
    // explicitly opt out of motion effects at OS/browser level.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setIsReducedMotion(mediaQuery.matches);
    };
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    let animationFrameId = 0;

    const onScroll = () => {
      // requestAnimationFrame batches state updates with the browser paint
      // cycle, which avoids doing expensive React updates on every raw
      // scroll event.
      if (animationFrameId !== 0) {
        return;
      }
      animationFrameId = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        animationFrameId = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          if (entry.target === heroContentRef.current) {
            setIsHeroVisible(true);
          } else if (entry.target === statusSummaryRef.current) {
            setIsStatusVisible(true);
          } else if (entry.target === featureSectionRef.current) {
            setIsFeatureVisible(true);
          }
        }
      },
      {
        threshold: 0.2,
      },
    );

    if (heroContentRef.current) {
      observer.observe(heroContentRef.current);
    }
    if (statusSummaryRef.current) {
      observer.observe(statusSummaryRef.current);
    }
    if (featureSectionRef.current) {
      observer.observe(featureSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const heroScrollProgress = Math.min(scrollY / 520, 1);
  const videoTranslateY = isReducedMotion ? 0 : heroScrollProgress * 36;
  const videoScale = isReducedMotion ? 1 : 1 + heroScrollProgress * 0.08;
  const heroTranslateY = isReducedMotion ? 0 : heroScrollProgress * -42;
  const heroOpacity = isReducedMotion ? 1 : 1 - heroScrollProgress * 0.35;
  const rightPanelTranslateY = isReducedMotion ? 0 : heroScrollProgress * -16;
  const scrollIndicatorWidth = `${Math.min((scrollY / 900) * 100, 100)}%`;

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
        style={{
          transform: `translateY(${videoTranslateY}px) scale(${videoScale})`,
        }}
      />

      {/* Subtle darkening scrim so the white text reads cleanly */}
      <div className="absolute inset-0 z-[1] bg-black/25" />

      {/* ── MAIN CONTENT (above video & scrim) ───────────────────────────── */}
      {/* flex-col on mobile stacks hero → cards; lg:flex-row puts them side-by-side */}
      <div className="relative z-10 flex flex-col">
        <div className="pointer-events-none sticky top-0 z-20 h-1 w-full bg-white/10">
          <div
            className="h-full rounded-r-full bg-white/80 transition-[width] duration-200"
            style={{ width: scrollIndicatorWidth }}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL  —  52 % wide on desktop, full-width on mobile
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative flex w-full flex-col">

          {/* The glass layer is absolutely positioned BEHIND the content.
              inset-4/6 leaves a gap so the video peeks around the edges. */}
          <div className="liquid-glass-strong absolute inset-4 rounded-3xl lg:inset-6" />

          {/* All left-panel content lives here, z-10 above the glass */}
          <div
            ref={heroContentRef}
            className="relative z-10 flex min-h-[100dvh] flex-col px-6 py-6 transition-all duration-700 sm:px-8 sm:py-8 lg:px-14 lg:py-10"
            style={{
              transform: `translateY(${heroTranslateY}px)`,
              opacity: heroOpacity,
            }}
          >

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
            <div
              className={`flex flex-1 flex-col items-center justify-center gap-5 text-center transition-all duration-900 sm:gap-6 lg:gap-8 ${
                isHeroVisible || isReducedMotion
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >

              {/* Scales from 56 px on phones up to 80 px on desktop */}
              <SantaiLogo className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />

              

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
        <div
          className="flex w-full flex-col gap-6 p-4 transition-transform duration-700 sm:p-6"
          style={{ transform: `translateY(${rightPanelTranslateY}px)` }}
        >

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
          <div
            ref={statusSummaryRef}
            className={`liquid-glass w-full rounded-2xl p-5 transition-all duration-700 sm:w-72 ${
              isStatusVisible || isReducedMotion
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <h3 className="mb-2 text-sm font-medium text-white">
              Live status summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">
                  {liveStatusSummary ? liveStatusSummary.available : "--"}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  Available
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">
                  {liveStatusSummary ? liveStatusSummary.inUse : "--"}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  In Use
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-lg font-semibold text-white">
                  {liveStatusSummary ? liveStatusSummary.total : "--"}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/50">
                  Total
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              {liveStatusError
                ? `Live data unavailable: ${liveStatusError}`
                : "Open the sessions dashboard to see live station data and session countdowns."}
            </p>
          </div>

          {/* ── BOTTOM FEATURE SECTION ─────────────────────────────── */}
          {/* lg:mt-auto pushes this to the bottom only when the panel has a fixed height
              (desktop flex-row). On mobile the panel is auto-height so mt-auto has no effect. */}
          <div
            ref={featureSectionRef}
            className="lg:mt-auto transition-all duration-700"
            style={{
              opacity:
                (0.55 + scrollFeatureProgress * 0.45) *
                (isFeatureVisible || isReducedMotion ? 1 : 0.2),
              transform: `translateY(${
                (1 - scrollFeatureProgress) * 16 +
                (isFeatureVisible || isReducedMotion ? 0 : 12)
              }px)`,
            }}
          >
            {/* Outer glass container with larger radius per spec (2.5rem) */}
            <div className="liquid-glass rounded-[2.5rem] p-5">
              <div className="flex flex-col gap-4">

                <div
                  className="overflow-hidden"
                  onPointerDown={(event) => {
                    swipeStartXRef.current = event.clientX;
                    swipeDeltaXRef.current = 0;
                    setIsDraggingFeatureSlider(true);
                  }}
                  onPointerMove={(event) => {
                    if (swipeStartXRef.current === null) {
                      return;
                    }

                    swipeDeltaXRef.current = event.clientX - swipeStartXRef.current;
                  }}
                  onPointerUp={() => {
                    // A small threshold avoids accidental slide changes from tiny taps/drags.
                    const swipeThresholdPx = 40;

                    if (swipeDeltaXRef.current <= -swipeThresholdPx) {
                      goToNextFeatureSlide();
                    } else if (swipeDeltaXRef.current >= swipeThresholdPx) {
                      goToPreviousFeatureSlide();
                    }

                    swipeStartXRef.current = null;
                    swipeDeltaXRef.current = 0;
                    setIsDraggingFeatureSlider(false);
                  }}
                  onPointerCancel={() => {
                    swipeStartXRef.current = null;
                    swipeDeltaXRef.current = 0;
                    setIsDraggingFeatureSlider(false);
                  }}
                  style={{ touchAction: "pan-y" }}
                >
                  <div
                    className={`flex ${
                      isDraggingFeatureSlider
                        ? "duration-200"
                        : "duration-700"
                    } transition-transform ease-in-out`}
                    style={{
                      transform: `translateX(-${activeFeatureSlide * 100}%)`,
                    }}
                  >
                    {/* map() keeps each slide structure consistent and avoids duplicating near-identical card markup manually. */}
                    {featureSlides.map((slideCards, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="flex gap-4">
                          {/* map() renders the two cards in each slide from one source of truth so text/icon updates stay in sync. */}
                          {slideCards.map((card) => {
                            const CardIcon = card.icon;

                            return (
                              <div
                                key={card.title}
                                className="liquid-glass flex flex-1 flex-col gap-3 rounded-3xl p-5 transition-all duration-700"
                                style={{
                                  transitionDelay: `${slideIndex * 90}ms`,
                                  transform:
                                    isFeatureVisible || isReducedMotion
                                      ? "translateY(0px)"
                                      : "translateY(18px)",
                                  opacity:
                                    isFeatureVisible || isReducedMotion ? 1 : 0.15,
                                }}
                              >
                                <IconCircle>
                                  <CardIcon className="h-4 w-4 text-white" />
                                </IconCircle>
                                <h4 className="text-sm font-medium text-white">
                                  {card.title}
                                </h4>
                                <p className="text-xs leading-relaxed text-white/60">
                                  {card.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-center gap-2">
                    {featureSlides.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        type="button"
                        onClick={() => setActiveFeatureSlide(dotIndex)}
                        className={`h-1.5 rounded-full transition-all ${
                          dotIndex === activeFeatureSlide
                            ? "w-6 bg-white/80"
                            : "w-2 bg-white/35"
                        }`}
                        aria-label={`Show feature slide ${dotIndex + 1}`}
                      />
                    ))}
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
