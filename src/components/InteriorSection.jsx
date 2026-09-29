import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== "undefined") {
  window.ScrollTrigger = ScrollTrigger;
}

/**
 * InteriorSection
 * 
 * FOURTH and FINAL section of the premium automotive cinematic website.
 * Focuses on: LUXURY CAR INTERIOR
 *
 * Requirements fulfilled:
 * - Video file: /videos/04-interior.mp4 (customizable via videoSrc prop)
 * - Full Screen: 100vw x 100svh, object-fit: cover, interior remains main focus
 * - Scroll Control: Video controlled strictly by user's scroll (GSAP ScrollTrigger)
 *   0% -> beginning of interior
 *   25% -> dashboard
 *   50% -> steering / cockpit
 *   75% -> seats / console
 *   100% -> final interior hero frame
 *   Formula: video.currentTime = progress * video.duration, scrub: true
 *   Does NOT simply autoplay.
 * - Transition from 03 ENGINE to 04 INTERIOR:
 *   Feels like the camera is entering the car.
 *   Uses cinematic crossfade, scale, blur, opacity (no hard cut).
 * - Text:
 *   04 / INTERIOR
 *   THE CABIN
 *   "Step inside."
 *   Minimal editorial typography.
 * - Final Hero:
 *   At the end of the video:
 *   THE NEW EXPERIENCE
 *   "Made to move you."
 *   Premium CTA: EXPLORE THE CAR
 *   Minimal white outline button, hover: background becomes white, text becomes black.
 * - Final Feel:
 *   Ending of a luxury automotive advertisement: Slow, Elegant, Minimal, Cinematic.
 */
export default function InteriorSection({
  id = "section-04",
  videoSrc = "/videos/04-interior.mp4",
  prevVideoSrc = "/videos/03-engine.mp4",
  onProgress = null,
  onExplore = null,
  className = "",
}) {
  const sectionRef = useRef(null);
  const pinWrapperRef = useRef(null);
  const prevVideoRef = useRef(null);
  const videoRef = useRef(null);
  const initialTextRef = useRef(null);
  const finalHeroRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const durationRef = useRef(0);
  const prevDurationRef = useRef(0);

  // Video seeking state to keep browser media decoder smooth
  const isSeekingRef = useRef(false);
  const pendingTimeRef = useRef(null);
  const lastTimeRef = useRef(-1);
  const seekTimeoutRef = useRef(null);

  // Direct safe seek implementation
  const performSeek = useCallback((time) => {
    const video = videoRef.current;
    if (!video) return;

    isSeekingRef.current = true;
    lastTimeRef.current = time;

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      isSeekingRef.current = false;
      if (pendingTimeRef.current !== null) {
        const next = pendingTimeRef.current;
        pendingTimeRef.current = null;
        performSeek(next);
      }
    }, 120);

    try {
      video.currentTime = time;
    } catch {
      isSeekingRef.current = false;
    }
  }, []);

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }

    if (pendingTimeRef.current !== null) {
      const next = pendingTimeRef.current;
      pendingTimeRef.current = null;
      performSeek(next);
    }
  }, [performSeek]);

  // Scrub video accurately based on scroll progress:
  // video.currentTime = progress * video.duration
  const scrubVideo = useCallback(
    (progress) => {
      const video = videoRef.current;
      if (!video) return;

      const dur = durationRef.current || video.duration;
      if (!dur || isNaN(dur) || dur <= 0) return;

      // Keep strictly within [0, duration - 0.03] to ensure final frame remains crisp
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const targetTime = Math.min(dur - 0.03, Math.max(0, clampedProgress * dur));

      if (Math.abs(lastTimeRef.current - targetTime) < 0.02) return;

      if (isSeekingRef.current) {
        pendingTimeRef.current = targetTime;
      } else {
        performSeek(targetTime);
      }
    },
    [performSeek]
  );

  // Loaded metadata handler for current video (04-interior.mp4)
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    durationRef.current = video.duration || 8;
    video.pause();
    video.currentTime = 0.001; // Render opening frame immediately
    setIsVideoReady(true);
  }, []);

  // Loaded metadata handler for previous video (03-engine.mp4)
  const handlePrevLoadedMetadata = useCallback(() => {
    const prevVideo = prevVideoRef.current;
    if (!prevVideo) return;

    prevDurationRef.current = prevVideo.duration || 8;
    prevVideo.pause();
    try {
      prevVideo.currentTime = Math.max(0, (prevVideo.duration || 8) - 0.03);
    } catch {}
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      durationRef.current = video.duration || 8;
      video.pause();
      setIsVideoReady(true);
    }

    const prevVideo = prevVideoRef.current;
    if (prevVideo && prevVideo.readyState >= 1) {
      prevDurationRef.current = prevVideo.duration || 8;
      prevVideo.pause();
      try {
        prevVideo.currentTime = Math.max(0, (prevVideo.duration || 8) - 0.03);
      } catch {}
    }
  }, []);

  // Main GSAP ScrollTrigger orchestration
  useEffect(() => {
    const section = sectionRef.current;
    const pinWrapper = pinWrapperRef.current;
    const currentVideo = videoRef.current;
    const prevVideo = prevVideoRef.current;
    const initialText = initialTextRef.current;
    const finalHero = finalHeroRef.current;

    if (!section || !pinWrapper || !currentVideo || !initialText) return;

    const prevSecVideo = document.querySelector("#section-03 video");

    // Camera Entering Car transition setup:
    // Current video starts at scale 1.08 pushing inward, opacity 0, blur(4px)
    gsap.set(currentVideo, {
      opacity: 0,
      scale: 1.08,
      filter: "blur(4px)",
      transformOrigin: "center center",
      willChange: "transform, opacity, filter",
    });

    // Previous video underlay starts at opacity 1, scale 1.0, blur(0px)
    if (prevVideo) {
      gsap.set(prevVideo, {
        opacity: 1,
        scale: 1.0,
        filter: "blur(0px)",
        transformOrigin: "center center",
        willChange: "transform, opacity, filter",
      });
    }

    // Initial Cabin text starts hidden
    gsap.set(initialText, {
      opacity: 0,
      y: 35,
      scale: 0.95,
      transformOrigin: "left bottom",
      willChange: "transform, opacity",
    });

    // Final Hero Climax starts hidden and inert
    if (finalHero) {
      gsap.set(finalHero, {
        opacity: 0,
        y: 35,
        scale: 0.96,
        pointerEvents: "none",
        willChange: "transform, opacity",
      });
    }

    const ctx = gsap.context(() => {
      // Timeline pinned over smooth scroll distance (+=280% for deliberate luxury pacing)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinWrapper,
          start: "top top",
          end: "+=280%",
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;

            // Direct formula requirement:
            // 0% -> beginning, 25% -> dashboard, 50% -> steering, 75% -> seats, 100% -> final hero frame
            // video.currentTime = progress * video.duration
            scrubVideo(p);

            if (onProgress) {
              onProgress(p);
            }
          },
        },
      });

      // -----------------------------------------------------------
      // TIMELINE PACING (0.00 to 1.00)
      // -----------------------------------------------------------

      // 1. TRANSITION: CAMERA ENTERING THE CAR (0.00 to 0.16)
      // Previous video pushes forward: scale 1.0 -> 1.08, opacity 1 -> 0, blur 0 -> 4px
      if (prevVideo) {
        tl.to(
          prevVideo,
          {
            opacity: 0,
            scale: 1.08,
            filter: "blur(4px)",
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.0
        );
      }

      if (prevSecVideo) {
        tl.to(
          prevSecVideo,
          {
            opacity: 0,
            scale: 1.08,
            filter: "blur(4px)",
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.0
        );
      }

      // Current video pulls from scale 1.08 -> 1.0 (smooth continuous entrance),
      // opacity: 0 -> 1, blur: 4px -> 0
      tl.to(
        currentVideo,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          duration: 0.16,
          ease: "power2.inOut",
        },
        0.0
      );

      // 2. INITIAL TEXT ENTRANCE (0.08 to 0.30)
      // 04 / INTERIOR, THE CABIN, "Step inside."
      tl.to(
        initialText,
        {
          opacity: 1,
          y: 0,
          scale: 1.0,
          duration: 0.22,
          ease: "power2.out",
        },
        0.08
      );

      // 3. CABIN EXPLORATION (0.30 to 0.65)
      // 25% dashboard -> 50% steering / cockpit -> 75% seats / console
      // The interior remains the main hero

      // 4. INITIAL TEXT GENTLE EXIT (0.62 to 0.76)
      tl.to(
        initialText,
        {
          opacity: 0,
          y: -25,
          scale: 0.98,
          duration: 0.14,
          ease: "power2.in",
        },
        0.62
      );

      // 5. FINAL HERO CLIMAX (0.78 to 1.00)
      // At the end of the video:
      // Show: THE NEW EXPERIENCE, "Made to move you.", EXPLORE THE CAR button
      // Slow, Elegant, Minimal, Cinematic (ending of a luxury automotive advertisement)
      tl.to(
        currentVideo,
        {
          scale: 1.02,
          duration: 0.22,
          ease: "power1.out",
        },
        0.78
      );

      if (finalHero) {
        tl.to(
          finalHero,
          {
            opacity: 1,
            y: 0,
            scale: 1.0,
            duration: 0.22,
            ease: "power2.out",
            onStart: () => {
              finalHero.style.pointerEvents = "auto";
            },
            onReverseComplete: () => {
              finalHero.style.pointerEvents = "none";
            },
          },
          0.78
        );
      }

      // Ensure timeline end marker aligns with 1.00
      tl.to({}, { duration: 0.01 }, 1.0);
    }, section);

    return () => {
      ctx.revert();
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, [scrubVideo, onProgress]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`interior-section relative w-full bg-[#050505] text-white ${className}`}
      style={{
        position: "relative",
      }}
    >
      {/* Pinned Viewport Container (100vw x 100svh) */}
      <div
        ref={pinWrapperRef}
        className="pinned-stage sticky top-0 left-0 w-full h-screen h-[100svh] overflow-hidden select-none"
        style={{
          width: "100vw",
          height: "100svh",
        }}
      >
        {/* PREVIOUS VIDEO LAYER (03-engine.mp4) for seamless camera-entering transition */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050505] z-0 pointer-events-none">
          <video
            ref={prevVideoRef}
            src={prevVideoSrc}
            playsInline
            muted
            preload="auto"
            autoPlay={false}
            tabIndex={-1}
            aria-hidden="true"
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{
              width: "100vw",
              height: "100svh",
              objectFit: "cover",
            }}
            onLoadedMetadata={handlePrevLoadedMetadata}
          />
        </div>

        {/* CURRENT VIDEO LAYER (04-interior.mp4) - Main Hero Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-[1] pointer-events-none">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted
            preload="auto"
            autoPlay={false}
            tabIndex={-1}
            aria-hidden="true"
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{
              width: "100vw",
              height: "100svh",
              objectFit: "cover",
            }}
            onLoadedMetadata={handleLoadedMetadata}
            onSeeked={handleSeeked}
          />
        </div>

        {/* Restrained Luxury Vignette & Soft Gradient (keeps interior craft front and center) */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(5,5,5,0.1) 30%, rgba(5,5,5,0.5) 75%, rgba(5,5,5,0.92) 100%)",
          }}
        />

        {/* Minimal Left Gradient for Initial Typography Legibility */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.80) 0%, rgba(5,5,5,0.35) 45%, transparent 80%)",
          }}
        />

        {/* INITIAL CABIN TYPOGRAPHY (04 / INTERIOR, THE CABIN, "Step inside.") */}
        <div
          ref={initialTextRef}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-10 max-w-2xl pointer-events-none select-none"
        >
          {/* 04 / INTERIOR */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
              04 / INTERIOR
            </span>
            <span className="w-10 h-[1px] bg-white/20" />
          </div>

          {/* THE CABIN */}
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
            THE CABIN
          </h2>

          {/* "Step inside." */}
          <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            &ldquo;Step inside.&rdquo;
          </p>
        </div>

        {/* ========================================================================= */}
        {/* FINAL HERO: THE NEW EXPERIENCE / "Made to move you." / EXPLORE THE CAR     */}
        {/* Slow, Elegant, Minimal, Cinematic (Ending of luxury automotive advertisement) */}
        {/* ========================================================================= */}
        <div
          ref={finalHeroRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 select-none"
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
              className="group relative inline-flex items-center justify-center gap-4 px-9 py-4 sm:px-12 sm:py-5 border border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 font-mono text-xs sm:text-sm font-medium tracking-[0.3em] uppercase rounded-sm cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.12)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
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
    </section>
  );
}
