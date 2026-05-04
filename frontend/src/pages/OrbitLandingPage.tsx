import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Orbit } from "lucide-react";
import { useState } from "react";
import santaiHeroVideo from "@/assets/video/santai.mp4";
import { cn } from "@/lib/utils";

const VIDEOS = [
  santaiHeroVideo,
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_204728_2dbcd1c4-63bc-4779-b06c-b7e2d5788ea7.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_210050_14d4d9cf-782b-4f6f-9764-08d793cf427c.mp4",
] as const;

const cinematicEase = [0.22, 1, 0.36, 1] as const;

const sectionVariants = {
  initial: (i: number) =>
    i === 0
      ? {
          opacity: 0,
          scale: 1.05,
          filter: "blur(10px)",
          y: 0,
        }
      : {
          opacity: 0,
          y: 80,
          scale: 1.08,
          filter: "blur(14px)",
        },
  animate: (i: number) =>
    i === 0
      ? {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          y: 0,
          transition: { duration: 0.8, ease: cinematicEase },
        }
      : {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.9, ease: cinematicEase },
        },
  exit: (i: number) =>
    i === 0
      ? {
          opacity: 0,
          scale: 0.92,
          filter: "blur(12px)",
          y: -60,
          transition: { duration: 0.55, ease: cinematicEase },
        }
      : {
          opacity: 0,
          y: -80,
          scale: 0.95,
          filter: "blur(10px)",
          transition: { duration: 0.45, ease: cinematicEase },
        },
};

function VerticalRules({ className }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-foreground/35 to-transparent sm:left-6 md:left-10",
          className,
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-foreground/35 to-transparent sm:right-6 md:right-10",
          className,
        )}
      />
    </>
  );
}

function BouncingChevron() {
  return (
    <motion.span
      aria-hidden
      className="inline-flex"
      animate={{ y: [0, 6, 0] }}
      transition={{
        duration: 1.4,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      <ChevronDown className="size-4 sm:size-5" strokeWidth={1.75} />
    </motion.span>
  );
}

export function OrbitLandingPage() {
  const [activeSection, setActiveSection] = useState(0);

  function handleNext() {
    setActiveSection((s) => Math.min(s + 1, 2));
  }

  function handlePrev() {
    setActiveSection((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="orbit-landing text-foreground relative min-h-dvh max-w-[100vw] overflow-x-hidden overflow-y-hidden">
      <div className="fixed inset-0 -z-10">
        {VIDEOS.map((src, index) => (
          <video
            key={src}
            autoPlay
            loop
            muted
            playsInline
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              activeSection === index ? "opacity-100" : "opacity-0",
            )}
            src={src}
          />
        ))}
      </div>

      <nav
        className="fixed top-0 right-0 left-0 z-20 flex items-start justify-between gap-2 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 sm:gap-4 sm:px-6 md:px-10 md:pt-8"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
          <Orbit
            className="size-6 shrink-0 text-foreground sm:size-8"
            aria-hidden
          />
          <p className="text-base leading-[1.05] font-bold tracking-tight sm:text-lg md:text-xl">
            WE ARE
            <br />
            ORBIT
            <br />
            ENGINEERS
          </p>
        </div>

        <div className="hidden gap-8 md:flex lg:gap-10">
          {(["Industries", "Projects", "Insights"] as const).map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="cursor-pointer text-sm font-medium tracking-widest text-foreground uppercase transition-colors hover:text-foreground/80"
            >
              {label}
            </a>
          ))}
        </div>

        <p className="font-mono shrink-0 text-right text-[0.65rem] leading-snug tracking-wider uppercase sm:text-xs sm:tracking-widest">
          51.50732 N
          <br />/ -0.12765 W
        </p>
      </nav>

      <main className="relative z-10 flex min-h-dvh flex-col pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pt-28 md:pt-32">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            custom={activeSection}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex min-h-[calc(100svh-6rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-1 flex-col px-4 sm:px-6 md:px-10"
          >
            {activeSection === 0 && (
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center">
                  <VerticalRules className="h-[calc(100%-3rem)]" />
                  <h1 className="relative z-10 max-w-[min(100%,36rem)] px-1 text-center text-[1.35rem] leading-[1.15] font-normal tracking-[-0.12em] sm:text-2xl sm:tracking-[-3px] md:text-4xl lg:text-5xl">
                    Unlock Tactical
                    <br />
                    Excellence through Space
                    <br />
                    Engineering
                  </h1>
                </div>
                <div className="relative mt-auto flex min-h-12 items-end justify-between gap-3 pb-1 sm:pb-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex min-h-11 cursor-pointer items-center gap-1.5 py-2 text-left text-[0.65rem] tracking-widest uppercase transition-colors hover:text-foreground/80 sm:gap-2 sm:text-xs"
                  >
                    <span className="max-w-[11rem] leading-snug sm:max-w-none">
                      Scroll to explore
                    </span>
                    <BouncingChevron />
                  </button>
                  <Orbit
                    className="size-8 shrink-0 opacity-60 sm:size-10"
                    aria-hidden
                  />
                </div>
              </>
            )}

            {activeSection === 1 && (
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center gap-8 py-4 sm:gap-10 md:flex-row md:items-center md:justify-between md:gap-16 md:py-0">
                  <motion.h2
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.75, delay: 0.3, ease: cinematicEase }}
                    className="max-w-xl text-balance text-center text-3xl leading-[0.95] font-light tracking-[-0.06em] sm:text-4xl sm:tracking-[-2px] md:text-left md:text-5xl lg:text-6xl"
                  >
                    Spatial Vision
                    <br />
                    at Your Command
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, delay: 0.4, ease: cinematicEase }}
                    className="shrink-0"
                  >
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex w-full min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-center text-background text-[0.65rem] uppercase tracking-[0.15em] transition-transform hover:scale-105 sm:w-auto sm:min-h-0 sm:gap-3 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.25em]"
                    >
                      Begin Your Mission
                      <ArrowRight className="size-4 shrink-0 sm:size-5" strokeWidth={1.75} />
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.75, delay: 0.45, ease: cinematicEase }}
                    className="flex items-start justify-center gap-4 sm:justify-start sm:gap-5"
                  >
                    <p
                      className="pt-0.5 text-xs uppercase"
                      style={{ letterSpacing: "0.3em" }}
                    >
                      Why We Are
                    </p>
                    <div className="flex flex-col gap-2">
                      {[0, 1, 2, 3].map((dot) => (
                        <div
                          key={dot}
                          className={cn(
                            "size-5 rounded-full border border-foreground",
                            dot === 0 ? "bg-foreground" : "bg-transparent",
                          )}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="mt-auto grid w-full grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex min-h-11 cursor-pointer items-center justify-center gap-2 py-1 text-xs tracking-widest uppercase transition-colors hover:text-foreground/80 md:justify-start"
                  >
                    <ChevronDown
                      className="size-5 -rotate-180"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Back to top
                  </button>

                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: cinematicEase }}
                    className="max-w-[min(100%,22rem)] justify-self-center px-1 text-balance text-center text-[0.65rem] uppercase leading-relaxed tracking-[0.2em] sm:max-w-sm sm:px-0 sm:text-xs sm:tracking-[0.25em]"
                  >
                    Orbital Solutions is a key strategic
                    <br />
                    consulting firm in space engineering
                  </motion.p>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex min-h-11 cursor-pointer items-center justify-center gap-2 py-1 text-xs tracking-widest uppercase transition-colors hover:text-foreground/80 md:justify-end"
                  >
                    Next
                    <BouncingChevron />
                  </button>
                </div>
              </>
            )}

            {activeSection === 2 && (
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center">
                  <VerticalRules className="h-[calc(100%-1rem)]" />
                  <div className="relative z-10 flex max-w-3xl flex-col items-center gap-5 px-1 text-center sm:gap-6 sm:px-0">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: 0.3, ease: cinematicEase }}
                      className="font-mono text-sm tracking-[0.3em] text-foreground/60 uppercase"
                    >
                      01
                    </motion.p>

                    <motion.h2
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.4, ease: cinematicEase }}
                      className="text-balance text-2xl leading-[1.05] font-light tracking-[-0.06em] sm:text-4xl sm:tracking-[-2px] md:text-5xl lg:text-6xl"
                    >
                      Operational Feasibility
                      <br />
                      Evaluation
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: 0.55, ease: cinematicEase }}
                      className="max-w-md px-1 font-mono text-xs leading-relaxed tracking-[0.12em] text-foreground/70 sm:px-0 sm:text-sm sm:tracking-[0.15em]"
                    >
                      <span className="sm:hidden">
                        We analyze engineering proposals against strategic benchmarks to
                        uncover growth paths and highlight untapped market potential.
                      </span>
                      <span className="hidden sm:inline">
                        We analyze engineering proposals against
                        <br />
                        strategic benchmarks to uncover growth paths
                        <br />
                        and highlight untapped market potential.
                      </span>
                    </motion.p>
                  </div>
                </div>

                <div className="relative mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="order-2 min-h-11 cursor-pointer self-start text-xs tracking-widest uppercase transition-colors hover:text-foreground/80 sm:order-1"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="order-1 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-background text-[0.65rem] uppercase tracking-[0.15em] transition-transform hover:scale-105 sm:order-2 sm:w-auto sm:min-h-0 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.25em]"
                  >
                    <span aria-hidden className="text-base leading-none font-light sm:text-lg">
                      +
                    </span>
                    Reach Out
                  </button>

                  <div className="order-3 hidden w-20 sm:block" aria-hidden />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
