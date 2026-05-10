import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Gamepad2,
  LayoutGrid,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Phone,
  Timer,
  X,
  type LucideIcon,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import santaiVideo from "@/assets/video/santai2.mp4";
import Carousel, { type CarouselItem } from "@/components/Carousel";
import CircularGallery from "@/components/CircularGallery";
import { SantaiLogo } from "@/components/SantaiLogo";
import { getApiBaseUrl } from "@/lib/api-base";
import { parseStationsPayload, readErrorMessage } from "@/lib/stations-api";

// ─── Icon pill helper — small rounded-full container used across the page ──
function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
      {children}
    </span>
  );
}

/** Edit branch rows, storefront photos (`public/…`), phone, and social URLs here. */
const VISIT_BRANCHES: {
  name: string;
  address: string;
  mapsUrl: string;
  /** Path under `frontend/public/` (e.g. `/kedaiindah.png`). */
  storeImageSrc: string;
}[] = [
  {
    name: "Jalan Indah",
    address:
      "CyberCafe Vike Legacy, 3, Jalan Indah 2, Pekan Baharu, 83600 Semerah, Johor",
    mapsUrl: "https://maps.app.goo.gl/XuyHDcRrKQ8kfyQEA",
    storeImageSrc: "/kedaiindah.png",
  },
  {
    name: "Jalan Parit Yusof",
    address:
      "Cyber Cafe Vike Legacy, Jalan Parit Yusof, Pekan Baharu, 83600 Semerah, Johor",
    mapsUrl: "https://maps.app.goo.gl/dQZEAYUfzAe2ggw79",
    storeImageSrc: "/kedaiyusof.png",
  },
];
/** Filenames under `public/store/` — add new photos here when you drop files into that folder. */
const STORE_IMAGE_FILENAMES = [
  "image.png",
  "image copy.png",
  "image copy 2.png",
  "image copy 3.png",
  "image copy 4.png",
] as const;

const STORE_IMAGE_CAROUSEL_ITEMS: CarouselItem[] = STORE_IMAGE_FILENAMES.map(
  (filename, index) => ({
    id: index + 1,
    title: "",
    description: "",
    imageSrc: `/store/${encodeURIComponent(filename)}`,
  }),
);
const VISIT_PHONE_LABEL = "0179075754";
const VISIT_PHONE_HREF = "tel:+60179075754";
const VISIT_WHATSAPP_URL = "https://wa.me/60179075754";
const VISIT_SOCIAL_INSTAGRAM = "https://www.instagram.com/santaiesportstudio/";

const CYBERCAFE_SERVICES: {
  title: string;
  description: string;
  fromPrice: string;
  icon: LucideIcon;
}[] = [
  {
    title: "PS5 Console",
    description: "Play popular PlayStation titles with friends.",
    fromPrice: "From RM 3 / hour",
    icon: Gamepad2,
  },
  {
    title: "PC Gaming",
    description: "High-performance PCs for competitive and casual gaming.",
    fromPrice: "From RM 3 / hour",
    icon: Monitor,
  },
];

const SERVICE_PRICE_CARDS: { label: string; price: string; suffix: string }[] = [
  { label: "PC Gaming", price: "RM 3", suffix: "/ hour" },
  { label: "PS5", price: "RM 3", suffix: "/ hour" }
];

/**
 * Featured titles for the circular game gallery.
 * Swap each `image` for a remote URL, `import cover from '@/assets/...'` (bundled), or a path under `public/` e.g. `/spiderman.png`.
 */
const FEATURED_GAMES: { name: string; image: string }[] = [
  {
    name: "Spiderman",
    image: "/spiderman.png",
  },
  {
    name: "Tekken",
    image: "/tekken.png",
  },
  {
    name: "FC 26",
    image: "/fc26.png",
  },
  {
    name: "Forza Horizon 5",
    image: "/forza.png",
  },
  {
    name: "Need for Speed",
    image: "/need.png",
  },
  {
    name: "Devil May Cry",
    image: "/devil.png",
  },
  {
    name: "Street Fighter",
    image: "/street.png",
  },
];

const GAME_LIBRARY_GALLERY_ITEMS = FEATURED_GAMES.map(({ name, image }) => ({
  text: name,
  image,
}));

/**
 * Tailwind `sm` is 640px and up; below that we treat layout as handheld and tune the WebGL gallery.
 * useSyncExternalStore avoids a flash of wrong props on first paint and re-subscribes on breakpoint changes only.
 */
function useIsBelowSmViewport(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(max-width: 639px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
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
  const isMobileGallery = useIsBelowSmViewport();
  const [isStoreGalleryOpen, setIsStoreGalleryOpen] = useState(false);
  /** Which branch photo is shown in the visit-section preview (auto-rotates). */
  const [visitStorePreviewIndex, setVisitStorePreviewIndex] = useState(0);
  const storeGalleryCloseRef = useRef<HTMLButtonElement | null>(null);

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
    // Cycle storefront preview images on a timer. We skip autoplay when the user
    // prefers reduced motion so the page stays static unless they open the gallery.
    const n = VISIT_BRANCHES.length;
    if (n <= 1 || isReducedMotion) return;
    const intervalMs = 4500;
    const timerId = window.setInterval(() => {
      setVisitStorePreviewIndex((prev) => (prev + 1) % n);
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [isReducedMotion]);

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

  useEffect(() => {
    if (!isStoreGalleryOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Defer focus to after the dialog is in the DOM so screen readers and keyboard users land on Close first.
    queueMicrotask(() => storeGalleryCloseRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStoreGalleryOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isStoreGalleryOpen]);

  const heroScrollProgress = Math.min(scrollY / 520, 1);
  const videoTranslateY = isReducedMotion ? 0 : heroScrollProgress * 36;
  const videoScale = isReducedMotion ? 1 : 1 + heroScrollProgress * 0.08;
  const heroTranslateY = isReducedMotion ? 0 : heroScrollProgress * -42;
  const heroOpacity = isReducedMotion ? 1 : 1 - heroScrollProgress * 0.35;
  const rightPanelTranslateY = isReducedMotion ? 0 : heroScrollProgress * -16;
  const scrollIndicatorWidth = `${Math.min((scrollY / 900) * 100, 100)}%`;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black font-display">

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
        <div className="relative flex w-full flex-col overflow-hidden">
          {/* Hero-only video background so lower sections do not inherit it */}
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

          {/* Subtle darkening scrim so text remains readable on video */}
          <div className="absolute inset-0 z-[1] bg-black/25" />

          {/* The glass layer is absolutely positioned BEHIND the content.
              inset-4/6 leaves a gap so the video peeks around the edges. */}
          <div className="liquid-glass-strong absolute inset-4 z-[2] rounded-3xl lg:inset-6" />

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
                  Vike Legacy 
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
                Vike Legacy
                <br />
                <em className="font-serif italic text-white/80">
                  Cyber{" "}
                </em>
                Cafe
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
                  Vike Legacy Cyber Cafe
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
          className="bloom-landing-secondary relative flex w-full flex-col transition-transform duration-700"
          style={{ transform: `translateY(${rightPanelTranslateY}px)` }}
        >
          <div className="bloom-landing-secondary__ambient" aria-hidden />
          <div className="bloom-landing-secondary__frost" aria-hidden />

          <div className="relative z-10 flex w-full flex-col gap-6 p-4 sm:p-6">
          {/*
            Wrap the top three blocks (top bar, live status, feature carousel + how-it-works)
            in a single max-width container so they match the width of the lower sections
            ("Available services", "Service pricing", "Visit", etc.) which each use max-w-5xl.
            We keep `flex flex-col gap-6` here so the internal vertical rhythm matches the
            parent's gap-6 — i.e. spacing inside this wrapper is identical to spacing outside it.
          */}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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

          {/* ── FEATURE SECTION (carousel + how it works) ─────────── */}
          <div
            ref={featureSectionRef}
            className="transition-all duration-700"
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

                <div className="mb-8">
                  <h4 className="mb-3 text-sm font-medium text-white">
                    Our stores
                  </h4>
                  <div className="relative mx-auto h-[360px] w-full max-w-[360px]">
                    <Carousel
                      items={STORE_IMAGE_CAROUSEL_ITEMS}
                      baseWidth={360}
                      autoplay={true}
                      autoplayDelay={3200}
                      pauseOnHover={true}
                      loop={true}
                      round={false}
                    />
                  </div>
                </div>

            </div>
          </div>
          </div>
          {/* end of max-w-5xl wrapper for the top three blocks */}

          {/* ── AVAILABLE SERVICES ─────────────────────────────────── */}
          <section aria-labelledby="services-heading" className="mx-auto w-full max-w-5xl">
            <p className="text-xs uppercase tracking-widest text-white/50">
              What we offer
            </p>
            <h2
              id="services-heading"
              className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl"
            >
              Available services
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
              VR, consoles, sim rigs, and PCs — pick how you want to play before you
              walk in.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {CYBERCAFE_SERVICES.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="liquid-glass flex flex-col gap-4 rounded-3xl p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <ServiceIcon className="h-6 w-6 text-white" aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-white">{service.title}</h3>
                      <p className="text-xs leading-relaxed text-white/60">
                        {service.description}
                      </p>
                    </div>
                    <p className="mt-auto pt-2 text-xs font-medium text-teal-200/90">
                      {service.fromPrice}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SERVICE PRICING ─────────────────────────────────────── */}
          <section aria-labelledby="pricing-heading" className="mx-auto w-full max-w-5xl">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Straightforward rates
            </p>
            <h2
              id="pricing-heading"
              className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl"
            >
              Service pricing
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {SERVICE_PRICE_CARDS.map((row) => (
                <div
                  key={row.label}
                  className="liquid-glass flex flex-col rounded-2xl px-4 py-5 text-center"
                >
                  <p className="text-xs font-medium text-white/70">{row.label}</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                    {row.price}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-wide text-white/45">
                    {row.suffix}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-4 space-y-1 text-xs leading-relaxed text-white/55">
              <li>Prices may vary during events or promotions.</li>
              <li>Ask staff for package rates.</li>
            </ul>
          </section>

          {/* ── GAME LIBRARY (TEASER) ─────────────────────────────── */}
          <section
            id="game-library"
            aria-labelledby="game-library-heading"
            className="w-full"
          >
            <div className="mx-auto w-full max-w-5xl">
              <p className="text-xs uppercase tracking-widest text-white/50">
                Popular picks
              </p>
              <h2
                id="game-library-heading"
                className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl"
              >
                Game library
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Scroll or drag the strip — a sample of what is on the floor. Ask staff for the full catalog.
              </p>
            </div>

            {/* Bleed to the edges of the padded right panel (cancels p-4 / sm:p-6) so the canvas blends with the ambient background. */}
            <div
              className="relative -mx-4 mt-6 h-[min(22rem,58dvh)] min-h-[16rem] w-[calc(100%+2rem)] overflow-hidden sm:h-[min(28rem,70dvh)] sm:min-h-[18rem] sm:-mx-6 sm:w-[calc(100%+3rem)]"
              role="region"
              aria-label="Featured games carousel"
            >
              <CircularGallery
                items={GAME_LIBRARY_GALLERY_ITEMS}
                bend={isMobileGallery ? 0.55 : 3}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollEase={0.02}
                font="600 30px Poppins, ui-sans-serif, system-ui, sans-serif"
              />
            </div>

            <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                View full game library
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>

          {/* ── VISIT / LOCATION ───────────────────────────────────── */}
          <section
            aria-labelledby="visit-heading"
            className="mx-auto w-full max-w-5xl pb-8"
          >
            <p className="text-xs uppercase tracking-widest text-white/50">
              Find us
            </p>
            <h2
              id="visit-heading"
              className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl"
            >
              Visit Vike Legacy Cyber Cafe
            </h2>

            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-stretch">
              <div className="liquid-glass overflow-hidden rounded-3xl">
                <button
                  type="button"
                  onClick={() => setIsStoreGalleryOpen(true)}
                  className="group relative block w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300/90"
                  aria-haspopup="dialog"
                  aria-expanded={isStoreGalleryOpen}
                  aria-controls="store-gallery-dialog"
                  aria-label="Open storefront photo gallery for both branches"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {VISIT_BRANCHES.map((branch, index) => {
                      const isActive = index === visitStorePreviewIndex;
                      return (
                        <img
                          key={branch.name}
                          src={branch.storeImageSrc}
                          alt={
                            isActive
                              ? `${branch.name} — Vike Legacy Cyber Cafe storefront; tap to view photos of both branches`
                              : ""
                          }
                          className={`absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] ${
                            isActive ? "opacity-100" : "opacity-0"
                          } ${
                            isReducedMotion
                              ? "transition-none"
                              : "transition-[opacity,transform] duration-700 ease-in-out"
                          }`}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          aria-hidden={!isActive}
                        />
                      );
                    })}
                    <div
                      className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute top-3 left-1/2 flex -translate-x-1/2 gap-1.5"
                      aria-hidden
                    >
                      {VISIT_BRANCHES.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                            index === visitStorePreviewIndex
                              ? "bg-white"
                              : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-full bg-black/60 px-3 py-2 text-center text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 sm:text-sm">
                      View branch photos
                    </span>
                  </div>
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {VISIT_BRANCHES.map((branch) => (
                    <div
                      key={branch.name}
                      className="liquid-glass flex flex-col rounded-3xl p-5 sm:p-6"
                    >
                      <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                        {branch.name}
                      </p>
                      <div className="mt-3 flex flex-1 gap-3">
                        <MapPin
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-200/90"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">Address</p>
                          <p className="mt-1 text-sm leading-relaxed text-white/70">
                            {branch.address}
                          </p>
                        </div>
                      </div>
                      <a
                        href={branch.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liquid-glass mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                        Google Maps
                      </a>
                    </div>
                  ))}
                </div>

                <div className="liquid-glass rounded-3xl p-6">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-200/90" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-white">Opening hours</p>
                      <p className="mt-1 text-sm text-white/70">
                        Open daily: 1:00 PM – 3:00 AM
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                    <a
                      href={VISIT_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:flex-none"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      WhatsApp
                    </a>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
                    <a
                      href={VISIT_PHONE_HREF}
                      className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
                    >
                      <Phone className="h-4 w-4 text-teal-200/90" aria-hidden />
                      {VISIT_PHONE_LABEL}
                    </a>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a
                      href={VISIT_SOCIAL_INSTAGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass rounded-full px-4 py-2 text-xs font-medium text-white/85 transition-colors hover:bg-white/15"
                    >
                      Instagram
                    </a>
                  </div>
                </div>

                <Link
                  to="/app"
                  className="liquid-glass-strong inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-center text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Contact us
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </section>

          </div>
        </div>
        {/* end right panel */}

      </div>

      {isStoreGalleryOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            aria-label="Close gallery"
            onClick={() => setIsStoreGalleryOpen(false)}
          />
          <div
            id="store-gallery-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-gallery-heading"
            className="liquid-glass-strong relative z-10 flex max-h-[min(92dvh,48rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <h2
                id="store-gallery-heading"
                className="text-lg font-medium tracking-tight text-white sm:text-xl"
              >
                Our branches
              </h2>
              <button
                ref={storeGalleryCloseRef}
                type="button"
                onClick={() => setIsStoreGalleryOpen(false)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300/90"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
              {VISIT_BRANCHES.map((branch) => (
                <div
                  key={branch.name}
                  className="liquid-glass flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={branch.storeImageSrc}
                      alt={`${branch.name} — storefront`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-4">
                    <p className="text-sm font-medium text-white">{branch.name}</p>
                    <p className="text-xs leading-relaxed text-white/70">
                      {branch.address}
                    </p>
                    <a
                      href={branch.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:text-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
