import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { carConfig } from "../config/carConfig";

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== "undefined") {
  window.ScrollTrigger = ScrollTrigger;
}

/**
 * EnginePerformanceSection
 * 
 * THIRD section of the premium automotive cinematic website.
 * Focuses on: ENGINE / PERFORMANCE
 *
 * Requirements fulfilled:
 * - Video file: /videos/03-engine.mp4 (customizable via videoSrc prop)
 * - Full Screen: 100vw x 100svh, object-fit: cover, engine remains the visual hero
 * - Scroll Control: Video controlled strictly by user's scroll (GSAP ScrollTrigger)
 *   0% -> video beginning, 25% -> 25%, 50% -> 50%, 75% -> 75%, 100% -> final frame
 *   Formula: video.currentTime = progress * video.duration, scrub: true
 *   Does NOT simply autoplay.
 * - Transition from Section 02 (02 WOMAN + CAR):
 *   Cinematic crossfade, scale, blur, opacity (no hard cut)
 *   Previous video: opacity 1 -> 0, scale 1 -> 1.05, blur 0 -> 4px
 *   Current video: opacity 0 -> 1, scale 1.05 -> 1, blur 4px -> 0
 * - Text:
 *   03 / PERFORMANCE
 *   PERFORMANCE
 *   "Power meets precision."
 * - Specifications:
 *   Minimal premium specifications:
 *   POWER: 000 HP, TORQUE: 000 Nm, DRIVE: AWD
 *   Strictly loaded from carConfig without inventing real specs.
 *   Animated using GSAP stagger.
 *   Small, elegant, editorial typography, no dashboard-style UI or colorful graphics.
 * - Section End:
 *   Reaches final engine frame.
 *   Smoothly transitions into the interior section (Section 04).
 */
export default function EnginePerformanceSection({
  id = "section-03",
  videoSrc = "/videos/03-engine.mp4",
  prevVideoSrc = "/videos/02-woman.mp4",
  nextSectionId = "section-04",
  onProgress = null,
  className = "",
}) {
  const sectionRef = useRef(null);
  const pinWrapperRef = useRef(null);
  const prevVideoRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const specsRef = useRef(null);
  const transitionOverlayRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const durationRef = useRef(0);
  const prevDurationRef = useRef(0);

  // Video seeking state to keep browser media decoder smooth
  const isSeekingRef = useRef(false);
  const pendingTimeRef = useRef(null);
  const lastTimeRef = useRef(-1);
  const seekTimeoutRef = useRef(null);

  // Specifications loaded directly from carConfig
  const specsData = [
    { label: "POWER", value: carConfig.performance?.power || "000 HP" },
    { label: "TORQUE", value: carConfig.performance?.torque || "000 Nm" },
    { label: "DRIVE", value: carConfig.performance?.drive || "AWD" },
  ];

  // Direct safe seek implementation
  const performSeek = useCallback((time) => {
    const video = videoRef.current;
    if (!video) return;

    isSeekingRef.current = true;
    lastTimeRef.current = time;

    // Safety timeout in case seeked event doesn't fire
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

      // Avoid redundant seeks
      if (Math.abs(lastTimeRef.current - targetTime) < 0.02) return;

      if (isSeekingRef.current) {
        pendingTimeRef.current = targetTime;
      } else {
        performSeek(targetTime);
      }
    },
    [performSeek]
  );

  // Video loaded metadata handler for current video (03-engine.mp4)
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    durationRef.current = video.duration || 8;
    video.pause();
    video.currentTime = 0.001; // Render opening frame immediately
    setIsVideoReady(true);
  }, []);

  // Video loaded metadata handler for previous video (02-woman.mp4)
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
    const text = textRef.current;
    const specsContainer = specsRef.current;
    const overlay = transitionOverlayRef.current;

    if (!section || !pinWrapper || !currentVideo || !text) return;

    // Previous video element in Section 02 (if present in DOM)
    const prevSecVideo = document.querySelector("#section-02 video");

    // Set initial element states for cinematic crossfade
    // Current video starts: opacity 0, scale 1.05, blur(4px)
    gsap.set(currentVideo, {
      opacity: 0,
      scale: 1.05,
      filter: "blur(4px)",
      transformOrigin: "center center",
      willChange: "transform, opacity, filter",
    });

    // Previous video underlay starts: opacity 1, scale 1.0, blur(0px)
    if (prevVideo) {
      gsap.set(prevVideo, {
        opacity: 1,
        scale: 1.0,
        filter: "blur(0px)",
        transformOrigin: "center center",
        willChange: "transform, opacity, filter",
      });
    }

    // Text starts hidden with opacity: 0, translateY: 35px, scale: 0.95
    gsap.set(text, {
      opacity: 0,
      y: 35,
      scale: 0.95,
      transformOrigin: "left bottom",
      willChange: "transform, opacity",
    });

    // Specifications start hidden for staggered entrance
    const specItems = specsContainer ? specsContainer.querySelectorAll(".spec-item") : [];
    if (specItems.length > 0) {
      gsap.set(specItems, {
        opacity: 0,
        y: 24,
        scale: 0.95,
        willChange: "transform, opacity",
      });
    }

    if (overlay) {
      gsap.set(overlay, { opacity: 0, pointerEvents: "none" });
    }

    const ctx = gsap.context(() => {
      // Timeline pinned over smooth scroll distance (+=250%)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinWrapper,
          start: "top top",
          end: "+=250%",
          scrub: true, // Direct scroll scrubbing
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;

            // Direct formula requirement:
            // 0% -> video beginning, 25% -> 25%, 50% -> 50%, 75% -> 75%, 100% -> final frame
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

      // 1. CINEMATIC CROSSFADE FROM SECTION 02 (0.00 to 0.16)
      // Transition from: 02 WOMAN + CAR -> 03 ENGINE
      // Use cinematic: crossfade, scale, blur, opacity (no hard cut)
      if (prevVideo) {
        tl.to(
          prevVideo,
          {
            opacity: 0,
            scale: 1.05,
            filter: "blur(4px)",
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.0
        );
      }

      // Also sync Section 02 video element in DOM if visible
      if (prevSecVideo) {
        tl.to(
          prevSecVideo,
          {
            opacity: 0,
            scale: 1.05,
            filter: "blur(4px)",
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.0
        );
      }

      // Current video (03 ENGINE):
      // opacity 0 -> 1, scale 1.05 -> 1.0, blur 4px -> 0
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

      // 2. TEXT ENTRANCE (0.08 to 0.30)
      // 03 / PERFORMANCE, PERFORMANCE, "Power meets precision."
      tl.to(
        text,
        {
          opacity: 1,
          y: 0,
          scale: 1.0,
          duration: 0.22,
          ease: "power2.out",
        },
        0.08
      );

      // 3. SPECIFICATIONS STAGGERED ENTRANCE (0.16 to 0.38)
      // Small, elegant, animated using GSAP stagger
      if (specItems.length > 0) {
        tl.to(
          specItems,
          {
            opacity: 1,
            y: 0,
            scale: 1.0,
            stagger: 0.06,
            duration: 0.2,
            ease: "power2.out",
          },
          0.16
        );
      }

      // 4. HERO EXPERIENCE (0.35 to 0.70)
      // Engine remains the visual hero
      // Minimal typography and small specs stay legible without covering the engine

      // 5. TEXT & SPECS GENTLE EXIT (0.70 to 0.85)
      tl.to(
        text,
        {
          opacity: 0,
          y: -25,
          scale: 0.98,
          duration: 0.15,
          ease: "power2.in",
        },
        0.70
      );

      if (specItems.length > 0) {
        tl.to(
          specItems,
          {
            opacity: 0,
            y: -15,
            scale: 0.98,
            stagger: 0.04,
            duration: 0.14,
            ease: "power2.in",
          },
          0.72
        );
      }

      // 6. SECTION END & TRANSITION INTO INTERIOR (0.85 to 1.00)
      // Reaches final engine frame.
      // Video camera depth push towards section conclusion
      tl.to(
        currentVideo,
        {
          scale: 1.05,
          filter: "blur(4px)",
          opacity: 0.1,
          duration: 0.14,
          ease: "power2.inOut",
        },
        0.86
      );

      // Smooth dark cinematic dissolve into Interior section (Section 04)
      if (overlay) {
        tl.to(
          overlay,
          {
            opacity: 0.88,
            duration: 0.14,
            ease: "power1.inOut",
          },
          0.86
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
      className={`engine-performance-section relative w-full bg-[#050505] text-white ${className}`}
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
        {/* PREVIOUS VIDEO LAYER (02-woman.mp4) for seamless crossfade */}
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

        {/* CURRENT VIDEO LAYER (03-engine.mp4) - Main Hero Video */}
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

        {/* Restrained Luxury Vignette & Soft Gradient (keeps engine as visual hero) */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              "radial-gradient(circle at 65% 50%, rgba(5,5,5,0) 35%, rgba(5,5,5,0.45) 75%, rgba(5,5,5,0.88) 100%)",
          }}
        />

        {/* Minimal Left Radial Mask for Text Legibility (Engine remains heroic and visible) */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.80) 0%, rgba(5,5,5,0.40) 45%, transparent 80%)",
          }}
        />

        {/* Minimal Luxury Editorial Typography & Specifications */}
        <div
          ref={textRef}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-10 max-w-2xl pointer-events-none select-none"
        >
          {/* 03 / PERFORMANCE */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
              03 / PERFORMANCE
            </span>
            <span className="w-10 h-[1px] bg-white/20" />
          </div>

          {/* PERFORMANCE */}
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
            PERFORMANCE
          </h2>

          {/* "Power meets precision." */}
          <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            &ldquo;Power meets precision.&rdquo;
          </p>

          {/* MINIMAL PREMIUM SPECIFICATIONS (GSAP Staggered, small and elegant) */}
          <div
            ref={specsRef}
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

        {/* Smooth Transition Overlay into Interior Section (Section 04) */}
        <div
          ref={transitionOverlayRef}
          className="absolute inset-0 bg-[#050505] z-30 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>
    </section>
  );
}
