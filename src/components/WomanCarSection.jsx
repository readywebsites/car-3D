import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== "undefined") {
  window.ScrollTrigger = ScrollTrigger;
}

/**
 * WomanCarSection
 * 
 * SECOND section of the premium automotive cinematic website.
 * Focuses on: WOMAN + CAR EXPERIENCE
 *
 * Requirements fulfilled:
 * - Video file: /videos/02-woman.mp4 (customizable via videoSrc prop)
 * - Full Screen: 100vw x 100svh, object-fit: cover, woman and car remain visually important
 * - Scroll Control: Video controlled strictly by user's scroll (GSAP ScrollTrigger)
 *   0% -> first frame, 25% -> 25%, 50% -> 50%, 75% -> 75%, 100% -> final frame
 *   Formula: video.currentTime = progress * video.duration, scrub: true
 *   Does NOT autoplay independently.
 * - Transition from Section 01:
 *   Previous video (01 CAR): opacity 1 -> 0, scale 1 -> 1.05, blur 0 -> 4px
 *   Current video (02 WOMAN + CAR): opacity 0 -> 1, scale 1.05 -> 1, blur 4px -> 0
 *   No hard cuts.
 * - Text:
 *   02 / EXPERIENCE
 *   THE EXPERIENCE
 *   "Meet the machine."
 *   Minimal text, animated with subtle fade, translateY, scale.
 * - Premium Style:
 *   Video remains the hero without covering woman or car.
 *   Luxury editorial typography, black / white / subtle gray, no excessive UI.
 * - Section End:
 *   Woman + car scene reaches its final frame.
 *   Smoothly transitions into the engine section (Section 03).
 */
export default function WomanCarSection({
  id = "section-02",
  videoSrc = "/videos/02-woman.mp4",
  prevVideoSrc = "/videos/01-car.mp4",
  nextSectionId = "section-03",
  onProgress = null,
  className = "",
}) {
  const sectionRef = useRef(null);
  const pinWrapperRef = useRef(null);
  const prevVideoRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const transitionOverlayRef = useRef(null);

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

  // Video loaded metadata handler for current video (02-woman.mp4)
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    durationRef.current = video.duration || 8;
    video.pause();
    video.currentTime = 0.001; // Render opening frame immediately
    setIsVideoReady(true);
  }, []);

  // Video loaded metadata handler for previous video (01-car.mp4)
  const handlePrevLoadedMetadata = useCallback(() => {
    const prevVideo = prevVideoRef.current;
    if (!prevVideo) return;

    prevDurationRef.current = prevVideo.duration || 8;
    prevVideo.pause();
    // Render the final frame of Section 01 as the transition starting point
    try {
      prevVideo.currentTime = Math.max(0, (prevVideo.duration || 8) - 0.03);
    } catch {
      // safe fallback
    }
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
    const overlay = transitionOverlayRef.current;

    if (!section || !pinWrapper || !currentVideo || !text) return;

    // Previous video element in Section 01 (if present in DOM)
    const extVideo = document.querySelector("#section-exterior video");

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
            // 0% -> frame 0, 25% -> 25%, 50% -> 50%, 75% -> 75%, 100% -> final frame
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

      // 1. CINEMATIC CROSSFADE FROM SECTION 01 (0.00 to 0.16)
      // Previous video:
      // opacity 1 -> 0
      // scale 1 -> 1.05
      // blur 0 -> 4px
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

      // Also gently sync external Section 01 video if visible in DOM
      if (extVideo) {
        tl.to(
          extVideo,
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

      // Current video (02 WOMAN + CAR):
      // opacity 0 -> 1
      // scale 1.05 -> 1
      // blur 4px -> 0
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

      // 2. TEXT ENTRANCE (0.08 to 0.32)
      // Minimal luxury typography subtly enters:
      // fade: 0 -> 1
      // translateY: 35 -> 0
      // scale: 0.95 -> 1.0
      tl.to(
        text,
        {
          opacity: 1,
          y: 0,
          scale: 1.0,
          duration: 0.24,
          ease: "power2.out",
        },
        0.08
      );

      // 3. HERO EXPERIENCE (0.32 to 0.70)
      // Text remains prominent, elegant, and readable over the scene
      // Woman and car remain completely unobstructed in the hero frame

      // 4. TEXT GENTLE EXIT (0.70 to 0.85)
      // Minimal text fades and recedes gracefully before section conclusion
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

      // 5. SECTION END & TRANSITION INTO ENGINE SECTION (0.85 to 1.00)
      // Woman + car scene reaches its final frame.
      // Transition curves into Section 03: scale 1 -> 1.05, blur 0 -> 4px, opacity 1 -> 0
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

      // Smooth dark cinematic dissolve / shutter into Engine section (Section 03)
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
      className={`woman-car-section relative w-full bg-[#050505] text-white ${className}`}
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
        {/* PREVIOUS VIDEO LAYER (01-car.mp4) for seamless cinematic crossfade */}
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

        {/* CURRENT VIDEO LAYER (02-woman.mp4) - Main Hero Video */}
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

        {/* Restrained Luxury Vignette & Soft Gradient (keeps woman & car hero visually important) */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              "radial-gradient(circle at 60% 50%, rgba(5,5,5,0) 40%, rgba(5,5,5,0.45) 80%, rgba(5,5,5,0.85) 100%)",
          }}
        />

        {/* Minimal Left Radial Mask for Text Legibility (Woman and car remain unobstructed) */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.35) 45%, transparent 80%)",
          }}
        />

        {/* Minimal Luxury Editorial Typography (Placed bottom-left, does not cover woman or car) */}
        <div
          ref={textRef}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-10 max-w-2xl pointer-events-none select-none"
        >
          {/* 02 / EXPERIENCE */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
              02 / EXPERIENCE
            </span>
            <span className="w-10 h-[1px] bg-white/20" />
          </div>

          {/* THE EXPERIENCE */}
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
            THE EXPERIENCE
          </h2>

          {/* "Meet the machine." */}
          <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            &ldquo;Meet the machine.&rdquo;
          </p>
        </div>

        {/* Smooth Transition Overlay into Engine Section (Section 03) */}
        <div
          ref={transitionOverlayRef}
          className="absolute inset-0 bg-[#050505] z-30 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>
    </section>
  );
}
