import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { carConfig } from "../config/carConfig";
import { ArrowRight } from "lucide-react";
import { audioEngine } from "../utils/audioEngine";

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== "undefined") {
  window.ScrollTrigger = ScrollTrigger;
}

/**
 * CinematicExperience
 * 
 * Unifies all four automotive sections into ONE continuous luxury cinematic scrolling commercial.
 *
 * Sequence:
 * 01 — CAR EXTERIOR (/videos/01-car.mp4)
 * ↓
 * 02 — WOMAN + CAR (/videos/02-woman.mp4)
 * ↓
 * 03 — ENGINE / PERFORMANCE (/videos/03-engine.mp4)
 * ↓
 * 04 — INTERIOR (/videos/04-interior.mp4)
 *
 * Key Architecture:
 * - Single sticky 100svh cinematic viewport (No multiple normal page sections).
 * - User scroll strictly controls each video's timeline (video.currentTime = progress * video.duration).
 * - Each section has its own dedicated scroll range.
 * - Transitions between scenes: previous video fades out, next video fades in from first frame,
 *   using opacity, scale, blur, translateY.
 * - Responsive across Desktop, Tablet, and Mobile.
 */
export default function CinematicExperience({
  onStageChange,
  onProgressChange,
  onExplore,
  enabled = true,
}) {
  const masterContainerRef = useRef(null);
  const stickyViewportRef = useRef(null);
  const parallaxLayerRef = useRef(null);

  // 4 Scene Layer Refs
  const sec0Ref = useRef(null);
  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);

  // 4 Video Element Refs
  const v0Ref = useRef(null);
  const v1Ref = useRef(null);
  const v2Ref = useRef(null);
  const v3Ref = useRef(null);

  // Content & Typography Refs
  const text0Ref = useRef(null);
  const prompt0Ref = useRef(null);
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);
  const specs2Ref = useRef(null);
  const text3Ref = useRef(null);
  const hero3Ref = useRef(null);

  // Video seeking controllers
  const scrubbersRef = useRef([]);

  // Specifications from carConfig
  const specsData = [
    { label: "POWER", value: carConfig.performance?.power || "000 HP" },
    { label: "TORQUE", value: carConfig.performance?.torque || "000 Nm" },
    { label: "DRIVE", value: carConfig.performance?.drive || "AWD" },
  ];

  // Subtle Desktop Mouse Parallax (Restrained luxury camera depth)
  useEffect(() => {
    const stage = stickyViewportRef.current;
    const layer = parallaxLayerRef.current;
    if (!stage || !layer) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const quickX = gsap.quickTo(layer, "x", { duration: 1.2, ease: "power2.out" });
    const quickY = gsap.quickTo(layer, "y", { duration: 1.2, ease: "power2.out" });

    const handleMouseMove = (e) => {
      const rect = stage.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      quickX(normX * 8);
      quickY(normY * 5);
    };

    const handleMouseLeave = () => {
      quickX(0);
      quickY(0);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Initialize and orchestrate GSAP Timeline + ScrollTrigger
  useEffect(() => {
    if (!enabled || !masterContainerRef.current) return;

    const container = masterContainerRef.current;
    const sec0 = sec0Ref.current;
    const sec1 = sec1Ref.current;
    const sec2 = sec2Ref.current;
    const sec3 = sec3Ref.current;

    const v0 = v0Ref.current;
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    const v3 = v3Ref.current;
    const videos = [v0, v1, v2, v3];

    // Initialize Video Scrubbers with non-blocking seek queues
    scrubbersRef.current = videos.map((video) => {
      const state = {
        targetTime: 0,
        lastTime: -1,
        seeking: false,
        pendingTime: null,
        seekTimeout: null,
      };

      if (video) {
        video.pause();
        video.currentTime = 0.001; // Render opening frame immediately

        const onSeeked = () => {
          state.seeking = false;
          if (state.seekTimeout) {
            clearTimeout(state.seekTimeout);
            state.seekTimeout = null;
          }
          if (state.pendingTime !== null) {
            const nextTime = state.pendingTime;
            state.pendingTime = null;
            applySeek(video, nextTime, state);
          }
        };

        const onSeeking = () => {
          state.seeking = true;
          if (state.seekTimeout) clearTimeout(state.seekTimeout);
          state.seekTimeout = setTimeout(() => {
            state.seeking = false;
          }, 120);
        };

        video.addEventListener("seeked", onSeeked);
        video.addEventListener("seeking", onSeeking);

        state._cleanup = () => {
          video.removeEventListener("seeked", onSeeked);
          video.removeEventListener("seeking", onSeeking);
          if (state.seekTimeout) clearTimeout(state.seekTimeout);
        };
      }
      return state;
    });

    function applySeek(video, time, state) {
      if (!video) return;
      state.seeking = true;
      state.lastTime = time;
      try {
        video.currentTime = time;
      } catch {
        state.seeking = false;
      }
    }

    function scrubVideo(index, progressNormalized) {
      const video = videos[index];
      const state = scrubbersRef.current[index];
      if (!video || !state) return;

      const duration =
        video.duration && !isNaN(video.duration) && video.duration > 0
          ? video.duration
          : 8.0;

      const clampedTime = Math.max(0, Math.min(duration - 0.03, progressNormalized * duration));
      if (Math.abs(state.lastTime - clampedTime) < 0.02) return;

      state.targetTime = clampedTime;

      if (state.seeking) {
        state.pendingTime = clampedTime;
      } else {
        applySeek(video, clampedTime, state);
      }
    }

    const t0 = text0Ref.current;
    const p0 = prompt0Ref.current;
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    const s2 = specs2Ref.current;
    const t3 = text3Ref.current;
    const h3 = hero3Ref.current;

    let lastStage = -1;

    const ctx = gsap.context(() => {
      // -------------------------------------------------------------------------
      // INITIAL ELEMENT STATES
      // -------------------------------------------------------------------------
      // Stacking context on scene layers
      gsap.set(sec0, { zIndex: 4 });
      gsap.set(sec1, { zIndex: 1 });
      gsap.set(sec2, { zIndex: 1 });
      gsap.set(sec3, { zIndex: 1 });

      // Video 0 starts visible and hero
      gsap.set(v0, { opacity: 1, scale: 1.08, filter: "blur(0px)", y: 0 });
      // Videos 1, 2, 3 start hidden and blurred
      gsap.set(v1, { opacity: 0, scale: 1.05, filter: "blur(4px)", y: 20 });
      gsap.set(v2, { opacity: 0, scale: 1.05, filter: "blur(4px)", y: 20 });
      gsap.set(v3, { opacity: 0, scale: 1.08, filter: "blur(4px)", y: 15 });

      // Typography initial states
      gsap.set(t0, { opacity: 1, y: 0, scale: 1.0 });
      if (p0) gsap.set(p0, { opacity: 1, y: 0 });
      gsap.set(t1, { opacity: 0, y: 35, scale: 0.95 });
      gsap.set(t2, { opacity: 0, y: 35, scale: 0.95 });
      if (s2) {
        const specItems = s2.querySelectorAll(".spec-item");
        gsap.set(specItems, { opacity: 0, y: 20, scale: 0.95 });
      }
      gsap.set(t3, { opacity: 0, y: 35, scale: 0.95 });
      if (h3) gsap.set(h3, { opacity: 0, y: 35, scale: 0.96, pointerEvents: "none" });

      // -------------------------------------------------------------------------
      // MASTER SCROLLTRIGGER TIMELINE (0 to 100 progress scale)
      // -------------------------------------------------------------------------
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;

            // Report progress to parent navbar / scrollprogress
            if (onProgressChange) onProgressChange(p);

            // Active Stage determination:
            // 0: CAR (0.00 - 0.24)
            // 1: EXPERIENCE (0.24 - 0.49)
            // 2: PERFORMANCE (0.49 - 0.74)
            // 3: INTERIOR (0.74 - 1.00)
            let stage = 0;
            if (p >= 0.74) {
              stage = 3;
            } else if (p >= 0.49) {
              stage = 2;
            } else if (p >= 0.24) {
              stage = 1;
            } else {
              stage = 0;
            }

            if (lastStage !== stage) {
              lastStage = stage;
              if (onStageChange) onStageChange(stage);
            }

            // SCRUB VIDEO TIMELINES ACROSS SCROLL RANGES:
            // 01 CAR: P in [0.00, 0.22] -> progress [0, 1]
            if (p <= 0.26) {
              const norm0 = Math.max(0, Math.min(1, p / 0.22));
              scrubVideo(0, norm0);
            }

            // 02 WOMAN: P in [0.24, 0.46] -> progress [0, 1]
            if (p >= 0.20 && p <= 0.52) {
              const norm1 = Math.max(0, Math.min(1, (p - 0.24) / (0.46 - 0.24)));
              scrubVideo(1, norm1);
            }

            // 03 ENGINE: P in [0.49, 0.71] -> progress [0, 1]
            if (p >= 0.45 && p <= 0.76) {
              const norm2 = Math.max(0, Math.min(1, (p - 0.49) / (0.71 - 0.49)));
              scrubVideo(2, norm2);
            }

            // 04 INTERIOR: P in [0.74, 0.94] -> progress [0, 1]
            // 0% -> beginning, 25% -> dashboard, 50% -> steering, 75% -> seats, 100% -> final hero frame
            if (p >= 0.70) {
              const norm3 = Math.max(0, Math.min(1, (p - 0.74) / (0.94 - 0.74)));
              scrubVideo(3, norm3);
            }

            // Ambient audio modulation based on scroll velocity
            const velocity = Math.abs(self.getVelocity() || 0);
            audioEngine.modulate(velocity / 1200);
          },
        },
      });

      // -------------------------------------------------------------------------
      // SECTION 01: CAR EXTERIOR (0 to 25 timeline points)
      // -------------------------------------------------------------------------
      // Prompt fades immediately
      if (p0) {
        masterTl.to(p0, { opacity: 0, y: -20, duration: 3, ease: "power1.out" }, 1);
      }

      // Video 0 scale settles: 1.08 -> 1.0
      masterTl.to(v0, { scale: 1.0, duration: 18, ease: "power1.out" }, 0);

      // Text 0 fades and recedes before transition
      masterTl.to(t0, { opacity: 0, y: -25, scale: 0.98, duration: 5, ease: "power2.in" }, 17);

      // TRANSITION 01 -> 02: CAR -> WOMAN (19 to 26)
      // Raise sec1 stacking order
      masterTl.set(sec1, { zIndex: 5 }, 19);

      // Video 0: opacity 1 -> 0, scale 1 -> 1.05, blur 0 -> 4px, translateY 0 -> -20px
      masterTl.to(
        v0,
        {
          opacity: 0,
          scale: 1.05,
          filter: "blur(4px)",
          y: -20,
          duration: 7,
          ease: "power2.inOut",
        },
        19
      );

      // Video 1 starts from first frame and fades in:
      // opacity 0 -> 1, scale 1.05 -> 1.0, blur 4px -> 0, translateY 20px -> 0px
      masterTl.to(
        v1,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          y: 0,
          duration: 7,
          ease: "power2.inOut",
        },
        19
      );

      // -------------------------------------------------------------------------
      // SECTION 02: WOMAN + CAR (25 to 50 timeline points)
      // -------------------------------------------------------------------------
      // Text 1 enters
      masterTl.to(t1, { opacity: 1, y: 0, scale: 1.0, duration: 6, ease: "power2.out" }, 24);

      // Video 1 slight continuous camera drift
      masterTl.to(v1, { scale: 1.03, duration: 16, ease: "none" }, 26);

      // Text 1 exits
      masterTl.to(t1, { opacity: 0, y: -25, scale: 0.98, duration: 5, ease: "power2.in" }, 41);

      // TRANSITION 02 -> 03: WOMAN -> ENGINE (44 to 51)
      // Raise sec2 stacking order
      masterTl.set(sec2, { zIndex: 6 }, 44);

      // Video 1: opacity 1 -> 0, scale 1 -> 1.05, blur 0 -> 4px, translateY 0 -> -20px
      masterTl.to(
        v1,
        {
          opacity: 0,
          scale: 1.05,
          filter: "blur(4px)",
          y: -20,
          duration: 7,
          ease: "power2.inOut",
        },
        44
      );

      // Video 2 starts from first frame:
      // opacity 0 -> 1, scale 1.05 -> 1.0, blur 4px -> 0, translateY 20px -> 0px
      masterTl.to(
        v2,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          y: 0,
          duration: 7,
          ease: "power2.inOut",
        },
        44
      );

      // -------------------------------------------------------------------------
      // SECTION 03: ENGINE / PERFORMANCE (50 to 75 timeline points)
      // -------------------------------------------------------------------------
      // Text 2 enters
      masterTl.to(t2, { opacity: 1, y: 0, scale: 1.0, duration: 6, ease: "power2.out" }, 49);

      // Specifications staggered entrance
      if (s2) {
        const specItems = s2.querySelectorAll(".spec-item");
        masterTl.to(
          specItems,
          {
            opacity: 1,
            y: 0,
            scale: 1.0,
            stagger: 1.2,
            duration: 5,
            ease: "power2.out",
          },
          52
        );
      }

      // Video 2 drift
      masterTl.to(v2, { scale: 1.03, duration: 15, ease: "none" }, 51);

      // Text 2 & Specs exit
      masterTl.to(t2, { opacity: 0, y: -25, scale: 0.98, duration: 5, ease: "power2.in" }, 66);
      if (s2) {
        const specItems = s2.querySelectorAll(".spec-item");
        masterTl.to(
          specItems,
          {
            opacity: 0,
            y: -15,
            scale: 0.98,
            stagger: 0.8,
            duration: 4,
            ease: "power2.in",
          },
          67
        );
      }

      // TRANSITION 03 -> 04: ENGINE -> INTERIOR (Camera enters the car) (69 to 76)
      // Raise sec3 stacking order
      masterTl.set(sec3, { zIndex: 7 }, 69);

      // Video 2 pushes inward: scale 1 -> 1.08, opacity 1 -> 0, blur 0 -> 4px, y: 0 -> -15px
      masterTl.to(
        v2,
        {
          opacity: 0,
          scale: 1.08,
          filter: "blur(4px)",
          y: -15,
          duration: 7,
          ease: "power2.inOut",
        },
        69
      );

      // Video 3 pulls from scale 1.08 -> 1.0, blur 4px -> 0, opacity 0 -> 1, y: 15px -> 0px
      masterTl.to(
        v3,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          y: 0,
          duration: 7,
          ease: "power2.inOut",
        },
        69
      );

      // -------------------------------------------------------------------------
      // SECTION 04: LUXURY INTERIOR & FINAL HERO CLIMAX (75 to 100 timeline points)
      // -------------------------------------------------------------------------
      // Initial Cabin text enters: 04 / INTERIOR, THE CABIN, "Step inside."
      masterTl.to(t3, { opacity: 1, y: 0, scale: 1.0, duration: 6, ease: "power2.out" }, 74);

      // Initial Cabin text exits as user explores cockpit
      masterTl.to(t3, { opacity: 0, y: -25, scale: 0.98, duration: 5, ease: "power2.in" }, 86);

      // Final Hero Climax enters at video end:
      // THE NEW EXPERIENCE / "Made to move you." / EXPLORE THE CAR
      if (h3) {
        masterTl.to(
          h3,
          {
            opacity: 1,
            y: 0,
            scale: 1.0,
            duration: 8,
            ease: "power2.out",
            onStart: () => {
              h3.style.pointerEvents = "auto";
            },
            onReverseComplete: () => {
              h3.style.pointerEvents = "none";
            },
          },
          90
        );
      }

      // Final frame hold
      masterTl.to({}, { duration: 0.1 }, 100);

      // -------------------------------------------------------------------------
      // SECTION MARKER SCROLLTRIGGERS FOR BACKWARD COMPATIBILITY & TEST SELECTORS
      // -------------------------------------------------------------------------
      const tracks = container.querySelectorAll(".scene-track");
      if (tracks.length === 4) {
        const ids = ["section-exterior", "section-02", "section-03", "section-04"];
        tracks.forEach((track, idx) => {
          ScrollTrigger.create({
            id: ids[idx],
            trigger: track,
            start: "top top",
            end: "bottom top",
            scrub: true,
          });
        });
      }

      ScrollTrigger.refresh();
    }, container);

    return () => {
      ctx.revert();
      scrubbersRef.current.forEach((st) => st._cleanup?.());
    };
  }, [enabled, onProgressChange, onStageChange]);

  return (
    <div
      ref={masterContainerRef}
      id="cinematic-master-story"
      className="relative w-full bg-[#050505] text-white"
      style={{
        height: "480vh",
      }}
    >
      {/* 4 SCENE SCROLL TRACKS (Used by ScrollTrigger & smooth navigation targets) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <div id="section-exterior-track" className="scene-track h-[120vh]" />
        <div id="section-02-track" className="scene-track h-[120vh]" />
        <div id="section-03-track" className="scene-track h-[120vh]" />
        <div id="section-04-track" className="scene-track h-[120vh]" />
      </div>

      {/* ========================================================================= */}
      {/* SINGLE STICKY 100svh CINEMATIC VIEWPORT (PINNED FOR ENTIRE COMMERCIAL)    */}
      {/* ========================================================================= */}
      <div
        ref={stickyViewportRef}
        className="sticky top-0 left-0 w-full h-screen h-[100svh] overflow-hidden select-none bg-[#050505] z-10"
        style={{
          width: "100vw",
          height: "100svh",
        }}
      >
        {/* PARALLAX CONTAINER (Provides subtle camera depth on desktop) */}
        <div
          ref={parallaxLayerRef}
          className="absolute inset-[-2%] w-[104%] h-[104%] will-change-transform z-[1]"
        >
          {/* ======================================================== */}
          {/* SCENE 01: CAR EXTERIOR                                   */}
          {/* ======================================================== */}
          <div
            ref={sec0Ref}
            id="section-exterior"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <video
              ref={v0Ref}
              src="/videos/01-car.mp4"
              playsInline
              muted
              preload="auto"
              autoPlay={false}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
              style={{
                width: "100vw",
                height: "100svh",
                objectFit: "cover",
              }}
            />
          </div>

          {/* ======================================================== */}
          {/* SCENE 02: WOMAN + CAR EXPERIENCE                         */}
          {/* ======================================================== */}
          <div
            ref={sec1Ref}
            id="section-02"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <video
              ref={v1Ref}
              src="/videos/02-woman.mp4"
              playsInline
              muted
              preload="auto"
              autoPlay={false}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
              style={{
                width: "100vw",
                height: "100svh",
                objectFit: "cover",
              }}
            />
          </div>

          {/* ======================================================== */}
          {/* SCENE 03: ENGINE / PERFORMANCE                           */}
          {/* ======================================================== */}
          <div
            ref={sec2Ref}
            id="section-03"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <video
              ref={v2Ref}
              src="/videos/03-engine.mp4"
              playsInline
              muted
              preload="auto"
              autoPlay={false}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
              style={{
                width: "100vw",
                height: "100svh",
                objectFit: "cover",
              }}
            />
          </div>

          {/* ======================================================== */}
          {/* SCENE 04: LUXURY INTERIOR                                */}
          {/* ======================================================== */}
          <div
            ref={sec3Ref}
            id="section-04"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <video
              ref={v3Ref}
              src="/videos/04-interior.mp4"
              playsInline
              muted
              preload="auto"
              autoPlay={false}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform will-change-[filter,opacity]"
              style={{
                width: "100vw",
                height: "100svh",
                objectFit: "cover",
              }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CINEMATIC TEXTURE & VIGNETTE OVERLAYS (Black / White / Subtle Gray)      */}
        {/* ========================================================================= */}
        {/* Film grain texture */}
        <div className="film-grain z-[8] pointer-events-none" />

        {/* Luxury Vignette (Hero remains clear, edges darkened) */}
        <div
          className="absolute inset-0 pointer-events-none z-[9]"
          style={{
            background:
              "radial-gradient(circle at 60% 50%, rgba(5,5,5,0) 38%, rgba(5,5,5,0.45) 75%, rgba(5,5,5,0.88) 100%)",
          }}
        />

        {/* Minimal Left Radial Mask for Text Legibility */}
        <div
          className="absolute inset-0 pointer-events-none z-[10]"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.35) 45%, transparent 80%)",
          }}
        />

        {/* ========================================================================= */}
        {/* 4 EDITORIAL CONTENT & TYPOGRAPHY OVERLAYS                                */}
        {/* ========================================================================= */}

        {/* --- SCENE 01 CONTENT: 01 / EXTERIOR | THE MACHINE | "Designed to be noticed." --- */}
        <div
          ref={text0Ref}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
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

        {/* Initial Scroll Cue */}
        <div
          ref={prompt0Ref}
          className="absolute bottom-8 left-6 sm:left-14 md:left-20 lg:left-28 z-[15] flex items-center gap-3 pointer-events-none select-none text-white/40 will-change-[opacity]"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
            SCROLL TO EXPLORE
          </span>
          <div className="w-8 h-[1px] bg-white/30" />
        </div>

        {/* --- SCENE 02 CONTENT: 02 / EXPERIENCE | THE EXPERIENCE | "Meet the machine." --- */}
        <div
          ref={text1Ref}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
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

        {/* --- SCENE 03 CONTENT: 03 / PERFORMANCE | PERFORMANCE | "Power meets precision." + SPECS --- */}
        <div
          ref={text2Ref}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
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

          {/* Minimal Staggered Specifications */}
          <div
            ref={specs2Ref}
            className="flex flex-wrap items-center gap-6 sm:gap-10 mt-7 sm:mt-9 pt-6 border-t border-white/10"
          >
            {specsData.map((spec) => {
              const parts = spec.value.split(" ");
              const val = parts[0];
              const unit = parts.slice(1).join(" ");

              return (
                <div key={spec.label} className="spec-item flex flex-col">
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.32em] text-neutral-400 uppercase mb-1 font-light">
                    {spec.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-light text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {val}
                    </span>
                    {unit && (
                      <span className="font-mono text-[10px] sm:text-xs text-neutral-400 tracking-wider">
                        {unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SCENE 04 CONTENT: 04 / INTERIOR | THE CABIN | "Step inside." --- */}
        <div
          ref={text3Ref}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-[15] max-w-2xl pointer-events-none select-none will-change-transform will-change-[opacity]"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
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

        {/* ========================================================================= */}
        {/* FINAL HERO CLIMAX: THE NEW EXPERIENCE / "Made to move you." / CTA         */}
        {/* Slow, Elegant, Minimal, Cinematic (Ending of luxury automotive ad)       */}
        {/* ========================================================================= */}
        <div
          ref={hero3Ref}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 select-none will-change-transform will-change-[opacity]"
        >
          {/* Subtle Radial Focus Mask behind Final Hero */}
          <div
            className="absolute inset-0 pointer-events-none z-[-1]"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(5,5,5,0.45) 0%, rgba(5,5,5,0.78) 60%, rgba(5,5,5,0.95) 100%)",
            }}
          />

          <div className="max-w-3xl flex flex-col items-center">
            {/* Tag / Category */}
            <span className="text-xs sm:text-sm font-mono tracking-[0.35em] text-neutral-400 uppercase mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-light">
              THE NEW EXPERIENCE
            </span>

            {/* Editorial Headline */}
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-white uppercase leading-tight mb-5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              &ldquo;Made to move you.&rdquo;
            </h2>

            {/* Minimal Luxury Divider */}
            <div className="w-16 h-[1px] bg-white/30 my-6" />

            {/* Premium CTA: EXPLORE THE CAR */}
            {/* White outline button, on hover: background becomes white, text becomes black */}
            <button
              onClick={onExplore}
              className="group relative inline-flex items-center justify-center gap-4 px-9 py-4 sm:px-12 sm:py-5 border border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 font-mono text-xs sm:text-sm font-medium tracking-[0.3em] uppercase rounded-sm cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.12)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 pointer-events-auto"
              aria-label="Explore the car"
            >
              <span>EXPLORE THE CAR</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <span className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase mt-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] font-light">
              INSPECT FULL SPECIFICATIONS & BESPOKE COMMISSIONS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
