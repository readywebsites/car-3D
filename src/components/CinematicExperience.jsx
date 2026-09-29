import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { carConfig } from "../config/carConfig";
import { ArrowRight, ChevronDown } from "lucide-react";

/**
 * Premium Luxury Cinematic Automotive Experience
 *
 * Requirements:
 * - 4 Full-screen 100svh cinematic video sections:
 *   01 — CAR EXTERIOR (/videos/01-car.mp4)
 *   02 — WOMAN + CAR (/videos/02-woman.mp4)
 *   03 — ENGINE / PERFORMANCE (/videos/03-engine.mp4)
 *   04 — INTERIOR (/videos/04-interior.mp4)
 *
 * Strict Video Behavior:
 * - NO video scrubbing. video.currentTime is NEVER hooked to scroll.
 * - Videos play normally from 0 seconds to final second (autoplay, muted, loop, playsInline).
 * - Scrolling ONLY navigates between the 4 full-screen sections.
 *
 * Subtle GSAP Transitions:
 * - Section 01 -> 02: fade / slight scale
 * - Section 02 -> 03: fade / slight blur
 * - Section 03 -> 04: smooth fade
 *
 * Aesthetic:
 * - Pure luxury monochrome: Black, White, Dark Charcoal, Subtle Gray.
 * - Subtle overlay: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.05)).
 * - Minimal Manrope & Inter typography.
 */
export default function CinematicExperience({
  activeStage = 0,
  onStageChange,
  onProgressChange,
  onExplore,
  enabled = true,
}) {
  const masterContainerRef = useRef(null);

  // 4 Section Container Refs (both IDs for compatibility with all tests & scripts)
  const sec0Ref = useRef(null);
  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);

  // 4 Video Element Refs
  const v0Ref = useRef(null);
  const v1Ref = useRef(null);
  const v2Ref = useRef(null);
  const v3Ref = useRef(null);

  // Typography & Content Refs
  const text0Ref = useRef(null);
  const cue0Ref = useRef(null);
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);
  const specs2Ref = useRef(null);
  const text3Ref = useRef(null);
  const hero3Ref = useRef(null);

  // Stage transition management
  const currentStageRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const touchStartYRef = useRef(null);
  const lastWheelTimeRef = useRef(0);

  // Specifications from carConfig (easily editable in config file)
  const specsData = [
    { label: "POWER", value: carConfig.performance?.power || "000 HP" },
    { label: "TORQUE", value: carConfig.performance?.torque || "000 Nm" },
    { label: "DRIVE", value: carConfig.performance?.drive || "AWD" },
  ];

  // Ensure all videos play continuously and normally without scrubbing
  useEffect(() => {
    const videos = [v0Ref.current, v1Ref.current, v2Ref.current, v3Ref.current];
    videos.forEach((video) => {
      if (video) {
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay gracefully handled
          });
        }
      }
    });
  }, []);

  // Initialize visual states on mount
  useEffect(() => {
    const sec0 = sec0Ref.current;
    const sec1 = sec1Ref.current;
    const sec2 = sec2Ref.current;
    const sec3 = sec3Ref.current;

    const v0 = v0Ref.current;
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    const v3 = v3Ref.current;

    const t0 = text0Ref.current;
    const c0 = cue0Ref.current;
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    const s2 = specs2Ref.current;
    const t3 = text3Ref.current;
    const h3 = hero3Ref.current;

    // Set initial layer visibility & styles
    // Section 01 active initially
    gsap.set(sec0, { opacity: 1, zIndex: 10, pointerEvents: "auto" });
    gsap.set(v0, { opacity: 1, scale: 1.0, filter: "blur(0px)" });
    gsap.set(t0, { opacity: 1, y: 0 });
    if (c0) gsap.set(c0, { opacity: 1, y: 0 });

    // Sections 02, 03, 04 hidden initially
    gsap.set(sec1, { opacity: 0, zIndex: 1, pointerEvents: "none" });
    gsap.set(v1, { opacity: 0, scale: 1.0, filter: "blur(0px)" });
    gsap.set(t1, { opacity: 0, y: 25 });

    gsap.set(sec2, { opacity: 0, zIndex: 1, pointerEvents: "none" });
    gsap.set(v2, { opacity: 0, scale: 1.0, filter: "blur(0px)" });
    gsap.set(t2, { opacity: 0, y: 25 });
    if (s2) {
      const items = s2.querySelectorAll(".spec-item");
      gsap.set(items, { opacity: 0, y: 15 });
    }

    gsap.set(sec3, { opacity: 0, zIndex: 1, pointerEvents: "none" });
    gsap.set(v3, { opacity: 0, scale: 1.0, filter: "blur(0px)" });
    gsap.set(t3, { opacity: 0, y: 25 });
    if (h3) gsap.set(h3, { opacity: 0, y: 20 });
  }, []);

  // Execute subtle GSAP section transition
  const executeTransition = useCallback((fromStage, toStage) => {
    if (fromStage === toStage) return;

    const sections = [sec0Ref.current, sec1Ref.current, sec2Ref.current, sec3Ref.current];
    const videos = [v0Ref.current, v1Ref.current, v2Ref.current, v3Ref.current];
    const texts = [text0Ref.current, text1Ref.current, text2Ref.current, text3Ref.current];

    const outSec = sections[fromStage];
    const inSec = sections[toStage];
    const outVid = videos[fromStage];
    const inVid = videos[toStage];
    const outText = texts[fromStage];
    const inText = texts[toStage];

    if (!outSec || !inSec || !outVid || !inVid) return;

    isTransitioningRef.current = true;

    // Bring incoming section above outgoing section
    gsap.set(inSec, { zIndex: 15, pointerEvents: "auto" });
    gsap.set(outSec, { zIndex: 10, pointerEvents: "none" });

    // Transition between Section 01 and Section 02: fade / slight scale
    if ((fromStage === 0 && toStage === 1) || (fromStage === 1 && toStage === 0)) {
      if (fromStage === 0 && toStage === 1) {
        // 01 -> 02: fade / slight scale
        gsap.to(outSec, {
          opacity: 0,
          scale: 1.04,
          duration: 0.75,
          ease: "power2.inOut",
        });
        gsap.to(outVid, { opacity: 0, duration: 0.75, ease: "power2.inOut" });

        gsap.fromTo(
          inSec,
          { opacity: 0, scale: 1.02, filter: "none" },
          { opacity: 1, scale: 1.0, filter: "none", duration: 0.75, ease: "power2.inOut" }
        );
        gsap.to(inVid, { opacity: 1, duration: 0.75, ease: "power2.inOut" });
      } else {
        // 02 -> 01: restore
        gsap.to(outSec, {
          opacity: 0,
          scale: 1.02,
          duration: 0.75,
          ease: "power2.inOut",
        });
        gsap.to(outVid, { opacity: 0, duration: 0.75, ease: "power2.inOut" });

        gsap.fromTo(
          inSec,
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1.0, duration: 0.75, ease: "power2.inOut" }
        );
        gsap.to(inVid, { opacity: 1, duration: 0.75, ease: "power2.inOut" });
      }
    }
    // Transition between Section 02 and Section 03: fade / slight blur
    else if ((fromStage === 1 && toStage === 2) || (fromStage === 2 && toStage === 1)) {
      if (fromStage === 1 && toStage === 2) {
        // 02 -> 03: fade / slight blur
        gsap.to(outSec, {
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.75,
          ease: "power2.inOut",
        });
        gsap.to(outVid, { opacity: 0, duration: 0.75, ease: "power2.inOut" });

        gsap.fromTo(
          inSec,
          { opacity: 0, filter: "blur(4px)", scale: 1.0 },
          { opacity: 1, filter: "blur(0px)", scale: 1.0, duration: 0.75, ease: "power2.inOut" }
        );
        gsap.to(inVid, { opacity: 1, duration: 0.75, ease: "power2.inOut" });
      } else {
        // 03 -> 02: restore blur clear
        gsap.to(outSec, {
          opacity: 0,
          duration: 0.75,
          ease: "power2.inOut",
        });
        gsap.to(outVid, { opacity: 0, duration: 0.75, ease: "power2.inOut" });

        gsap.fromTo(
          inSec,
          { opacity: 0, filter: "blur(6px)" },
          { opacity: 1, filter: "blur(0px)", duration: 0.75, ease: "power2.inOut" }
        );
        gsap.to(inVid, { opacity: 1, duration: 0.75, ease: "power2.inOut" });
      }
    }
    // Transition between Section 03 and Section 04: smooth fade
    else if ((fromStage === 2 && toStage === 3) || (fromStage === 3 && toStage === 2)) {
      // 03 <-> 04: smooth fade
      gsap.to(outSec, {
        opacity: 0,
        duration: 0.75,
        ease: "power2.inOut",
      });
      gsap.to(outVid, { opacity: 0, duration: 0.75, ease: "power2.inOut" });

      gsap.fromTo(
        inSec,
        { opacity: 0, filter: "none", scale: 1.0 },
        { opacity: 1, filter: "none", scale: 1.0, duration: 0.75, ease: "power2.inOut" }
      );
      gsap.to(inVid, { opacity: 1, duration: 0.75, ease: "power2.inOut" });
    }
    // Multi-stage direct jump (e.g. 0 -> 3 via navbar or indicator)
    else {
      gsap.to(outSec, { opacity: 0, duration: 0.6, ease: "power2.inOut" });
      gsap.to(outVid, { opacity: 0, duration: 0.6, ease: "power2.inOut" });

      gsap.fromTo(
        inSec,
        { opacity: 0, filter: "none", scale: 1.0 },
        { opacity: 1, filter: "none", scale: 1.0, duration: 0.6, ease: "power2.inOut" }
      );
      gsap.to(inVid, { opacity: 1, duration: 0.6, ease: "power2.inOut" });
    }

    // Outgoing Text Animation
    if (outText) {
      gsap.to(outText, { opacity: 0, y: -20, duration: 0.35, ease: "power2.in" });
    }
    if (fromStage === 0 && cue0Ref.current) {
      gsap.to(cue0Ref.current, { opacity: 0, duration: 0.3 });
    }

    // Incoming Text Animation
    if (inText) {
      gsap.fromTo(
        inText,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.15, ease: "power2.out" }
      );
    }
    if (toStage === 0 && cue0Ref.current) {
      gsap.fromTo(
        cue0Ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.2 }
      );
    }

    // Section 03 Specifications entrance
    if (toStage === 2 && specs2Ref.current) {
      const items = specs2Ref.current.querySelectorAll(".spec-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.25,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }

    // Section 04 Climax CTA entrance
    if (toStage === 3 && hero3Ref.current) {
      gsap.fromTo(
        hero3Ref.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.25,
          ease: "power2.out",
        }
      );
    }

    // Cooldown lock release
    const timer = setTimeout(() => {
      sections.forEach((s, idx) => {
        if (s && idx !== toStage) {
          gsap.set(s, { zIndex: 1, pointerEvents: "none" });
        }
      });
      isTransitioningRef.current = false;
    }, 750);

    return () => clearTimeout(timer);
  }, []);

  // Sync stage changes from parent (Navbar clicks, indicator clicks, or scroll navigation)
  useEffect(() => {
    if (!enabled) return;
    if (activeStage !== currentStageRef.current) {
      const prev = currentStageRef.current;
      currentStageRef.current = activeStage;
      executeTransition(prev, activeStage);
    }
  }, [activeStage, enabled, executeTransition]);

  // Navigate to target section with smooth scrolling
  const navigateToSection = useCallback(
    (targetIndex) => {
      const clamped = Math.max(0, Math.min(3, targetIndex));
      if (clamped === currentStageRef.current) return;

      if (onStageChange) onStageChange(clamped);

      // Smooth scroll the document so native scroll position remains aligned
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = (clamped / 3) * totalScrollable;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    },
    [onStageChange]
  );

  // Wheel listener: moves user between the 4 sections smoothly
  useEffect(() => {
    if (!enabled) return;

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 750) return;
      if (isTransitioningRef.current) return;

      if (Math.abs(e.deltaY) > 25) {
        if (e.deltaY > 0 && currentStageRef.current < 3) {
          lastWheelTimeRef.current = now;
          navigateToSection(currentStageRef.current + 1);
        } else if (e.deltaY < 0 && currentStageRef.current > 0) {
          lastWheelTimeRef.current = now;
          navigateToSection(currentStageRef.current - 1);
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [enabled, navigateToSection]);

  // Touch Swipe listener for mobile & tablet
  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (touchStartYRef.current === null) return;
      if (isTransitioningRef.current) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartYRef.current - touchEndY;
      touchStartYRef.current = null;

      if (Math.abs(diffY) > 40) {
        if (diffY > 0 && currentStageRef.current < 3) {
          navigateToSection(currentStageRef.current + 1);
        } else if (diffY < 0 && currentStageRef.current > 0) {
          navigateToSection(currentStageRef.current - 1);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, navigateToSection]);

  // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp, Space)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (isTransitioningRef.current) return;

      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        if (currentStageRef.current < 3) {
          e.preventDefault();
          navigateToSection(currentStageRef.current + 1);
        }
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        if (currentStageRef.current > 0) {
          e.preventDefault();
          navigateToSection(currentStageRef.current - 1);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        navigateToSection(0);
      } else if (e.key === "End") {
        e.preventDefault();
        navigateToSection(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, navigateToSection]);

  // Native Scroll sync (handles scrollbar dragging or programmatic window.scrollTo in tests)
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const p = Math.max(0, Math.min(1, scrollY / maxScroll));
      if (onProgressChange) onProgressChange(p);

      // Determine active section from scroll position
      let stage = 0;
      if (p >= 0.72) stage = 3;
      else if (p >= 0.45) stage = 2;
      else if (p >= 0.18) stage = 1;
      else stage = 0;

      if (stage !== currentStageRef.current && !isTransitioningRef.current) {
        if (onStageChange) onStageChange(stage);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, onProgressChange, onStageChange]);

  return (
    <div
      ref={masterContainerRef}
      id="cinematic-master-story"
      className="relative w-full bg-[#050505] text-white"
    >
      {/* Scroll tracks for page height and scrollbar navigation */}
      <div className="relative w-full h-[400svh] pointer-events-none z-0">
        <div id="section-exterior-track" className="scene-track h-[100svh]" />
        <div id="section-02-track" className="scene-track h-[100svh]" />
        <div id="section-03-track" className="scene-track h-[100svh]" />
        <div id="section-04-track" className="scene-track h-[100svh]" />
      </div>

      {/* ========================================================================= */}
      {/* FIXED 100svh CINEMATIC STAGE (All 4 videos play normally, 100% full screen) */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 w-full h-[100svh] overflow-hidden select-none bg-[#050505] z-10 pointer-events-auto"
        style={{ width: "100vw", height: "100svh" }}
      >
        {/* ===================================================================== */}
        {/* SECTION 01 — CAR EXTERIOR                                             */}
        {/* ===================================================================== */}
        <section
          ref={sec0Ref}
          id="section-01"
          data-section="exterior"
          className="absolute inset-0 w-full h-full will-change-transform will-change-[opacity]"
        >
          {/* Legacy ID element for backward-compatibility with tests */}
          <div id="section-exterior" className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Full-screen Video 01: Plays normally from 0s to end, loop, autoplay, muted */}
          <video
            ref={v0Ref}
            src="/videos/01-car.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[opacity]"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Subtle Cinematic Overlay: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.05)) */}
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Minimal Overlay Text: 01 / EXTERIOR | THE MACHINE | "Designed to be noticed." */}
          <div
            ref={text0Ref}
            className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="font-mono-tech text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
                01 / EXTERIOR
              </span>
              <span className="w-10 h-[1px] bg-white/20" />
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
              THE MACHINE
            </h1>
            <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Designed to be noticed.&rdquo;
            </p>
          </div>

          {/* Subtle scroll cue */}
          <div
            ref={cue0Ref}
            onClick={() => navigateToSection(1)}
            className="absolute bottom-8 left-6 sm:left-14 md:left-20 lg:left-28 z-[15] flex items-center gap-3 text-white/40 hover:text-white/80 transition-colors cursor-pointer select-none"
            aria-label="Scroll to Section 02"
          >
            <span className="font-mono-tech text-[10px] tracking-[0.3em] uppercase">
              SCROLL TO EXPLORE
            </span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 02 — WOMAN + CAR                                              */}
        {/* ===================================================================== */}
        <section
          ref={sec1Ref}
          id="section-02"
          data-section="experience"
          className="absolute inset-0 w-full h-full will-change-transform will-change-[filter,opacity]"
        >
          {/* Full-screen Video 02: Plays normally from 0s to end, loop, autoplay, muted */}
          <video
            ref={v1Ref}
            src="/videos/02-woman.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Subtle Cinematic Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Minimal Text: 02 / EXPERIENCE | THE EXPERIENCE | "Meet the machine." */}
          <div
            ref={text1Ref}
            className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="font-mono-tech text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
                02 / EXPERIENCE
              </span>
              <span className="w-10 h-[1px] bg-white/20" />
            </div>
            <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
              THE EXPERIENCE
            </h2>
            <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Meet the machine.&rdquo;
            </p>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 03 — ENGINE / PERFORMANCE                                     */}
        {/* ===================================================================== */}
        <section
          ref={sec2Ref}
          id="section-03"
          data-section="performance"
          className="absolute inset-0 w-full h-full will-change-transform will-change-[filter,opacity]"
        >
          {/* Full-screen Video 03: Plays normally from 0s to end, loop, autoplay, muted */}
          <video
            ref={v2Ref}
            src="/videos/03-engine.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Subtle Cinematic Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Minimal Text: 03 / PERFORMANCE | PERFORMANCE | "Power meets precision." */}
          <div
            ref={text2Ref}
            className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="font-mono-tech text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
                03 / PERFORMANCE
              </span>
              <span className="w-10 h-[1px] bg-white/20" />
            </div>
            <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
              PERFORMANCE
            </h2>
            <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Power meets precision.&rdquo;
            </p>

            {/* Configured Specifications: POWER 000 HP | TORQUE 000 Nm | DRIVE AWD */}
            <div
              ref={specs2Ref}
              className="flex flex-wrap items-center gap-6 sm:gap-10 mt-6 sm:mt-8 pt-5 border-t border-white/10"
            >
              {specsData.map((spec) => {
                const parts = spec.value.split(" ");
                const val = parts[0];
                const unit = parts.slice(1).join(" ");

                return (
                  <div key={spec.label} data-spec-item className="spec-item flex flex-col">
                    <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.32em] text-neutral-400 uppercase mb-1 font-light">
                      {spec.label}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-2xl sm:text-3xl font-light text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        {val}
                      </span>
                      {unit && (
                        <span className="font-mono-tech text-[10px] sm:text-xs text-neutral-400 tracking-wider">
                          {unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 04 — INTERIOR                                                 */}
        {/* ===================================================================== */}
        <section
          ref={sec3Ref}
          id="section-04"
          data-section="interior"
          className="absolute inset-0 w-full h-full will-change-transform will-change-[opacity]"
        >
          {/* Full-screen Video 04: Plays normally from 0s to end, loop, autoplay, muted */}
          <video
            ref={v3Ref}
            src="/videos/04-interior.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[opacity]"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Subtle Cinematic Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Minimal Text: 04 / INTERIOR | THE CABIN | "Step inside." */}
          <div
            ref={text3Ref}
            className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-xl pointer-events-none select-none will-change-transform will-change-[opacity]"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="font-mono-tech text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
                04 / INTERIOR
              </span>
              <span className="w-10 h-[1px] bg-white/20" />
            </div>
            <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
              THE CABIN
            </h2>
            <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Step inside.&rdquo;
            </p>
          </div>

          {/* Final Section Climax: THE NEW EXPERIENCE | "Made to move you." | EXPLORE THE CAR */}
          <div
            ref={hero3Ref}
            className="absolute right-6 sm:right-14 md:right-20 lg:right-28 bottom-16 sm:bottom-20 md:bottom-24 z-[20] max-w-md text-left sm:text-right pointer-events-auto will-change-transform will-change-[opacity]"
          >
            <div className="flex items-center sm:justify-end gap-3 mb-2">
              <span className="font-mono-tech text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-light">
                THE NEW EXPERIENCE
              </span>
              <span className="hidden sm:inline-block w-8 h-[1px] bg-white/20" />
            </div>
            <p className="font-editorial text-xl sm:text-2xl text-neutral-200 font-light italic mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Made to move you.&rdquo;
            </p>
            <button
              onClick={onExplore}
              aria-label="Explore the car"
              className="group inline-flex items-center gap-3 px-8 py-3.5 bg-white text-black font-mono-tech text-xs font-semibold tracking-[0.25em] uppercase rounded-sm hover:bg-neutral-200 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer"
            >
              <span>EXPLORE THE CAR</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
