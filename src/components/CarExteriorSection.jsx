import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * CarExteriorSection
 * 
 * FIRST section of a premium luxury automotive website.
 * Dedicated ONLY to the CAR EXTERIOR.
 *
 * Requirements fulfilled:
 * - Video file: /videos/01-car.mp4 (or custom via videoSrc prop)
 * - Visual: 100vw x 100svh, object-fit: cover, car as the main visual focus
 * - Scroll Control: Video controlled strictly by user's scroll (0% -> 0, 25% -> 25%, 50% -> 50%, 75% -> 75%, 100% -> final frame)
 *   Formula: video.currentTime = progress * video.duration
 *   Scrub: true
 * - Typography: 01 / EXTERIOR, THE MACHINE, "Designed to be noticed." (animated via opacity, translateY, scale; does not cover the car)
 * - Cinematic Effect: video scale 1.08 -> 1, text opacity 0 -> 1; when leaving: text opacity 1 -> 0, video scale 1 -> 1.04; smooth easing
 * - Style: Black, White, Dark charcoal, minimal luxury aesthetic
 * - Section End: Final frame remains visible briefly, then smooth transition into Section 02 (no hard cut)
 */
export default function CarExteriorSection({
  videoSrc = "/videos/01-car.mp4",
  nextSectionId = "section-02",
  onProgress = null,
  className = "",
}) {
  const sectionRef = useRef(null);
  const pinWrapperRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const promptRef = useRef(null);
  const transitionOverlayRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const durationRef = useRef(0);

  // Video seeking state to keep browser media decoder buttery smooth
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

  // Scrub video accurately based on scroll progress: video.currentTime = progress * video.duration
  const scrubVideo = useCallback(
    (progress) => {
      const video = videoRef.current;
      if (!video) return;

      const dur = durationRef.current || video.duration;
      if (!dur || isNaN(dur) || dur <= 0) return;

      // Keep strictly within [0, duration - 0.03] to ensure final frame remains crisp and doesn't black out
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

  // Video loaded metadata handler
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    durationRef.current = video.duration || 8;
    video.pause();
    video.currentTime = 0.001; // Render opening frame immediately
    setIsVideoReady(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      durationRef.current = video.duration || 8;
      video.pause();
      setIsVideoReady(true);
    }
  }, []);

  // Main GSAP ScrollTrigger orchestration
  useEffect(() => {
    const section = sectionRef.current;
    const pinWrapper = pinWrapperRef.current;
    const video = videoRef.current;
    const text = textRef.current;
    const prompt = promptRef.current;
    const overlay = transitionOverlayRef.current;

    if (!section || !pinWrapper || !video || !text) return;

    // Set initial element states
    // Video starts at scale 1.08
    gsap.set(video, {
      scale: 1.08,
      transformOrigin: "center center",
      willChange: "transform",
    });

    // Text starts hidden with opacity: 0, translateY: 35px, scale: 0.95
    gsap.set(text, {
      opacity: 0,
      y: 35,
      scale: 0.95,
      transformOrigin: "left bottom",
      willChange: "transform, opacity",
    });

    if (prompt) {
      gsap.set(prompt, { opacity: 1, y: 0 });
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

      // 1. Initial Prompt fades out immediately on user scroll
      if (prompt) {
        tl.to(
          prompt,
          {
            opacity: 0,
            y: -20,
            duration: 0.12,
            ease: "power1.out",
          },
          0.02
        );
      }

      // 2. WHILE SCROLLING:
      // Video scale: 1.08 -> 1.0 (settles smoothly as user scrolls)
      tl.to(
        video,
        {
          scale: 1.0,
          duration: 0.65,
          ease: "power1.out",
        },
        0.0
      );

      // Text appears slowly: opacity 0 -> 1, translateY -> 0, scale -> 1.0
      tl.to(
        text,
        {
          opacity: 1,
          y: 0,
          scale: 1.0,
          duration: 0.32,
          ease: "power2.out",
        },
        0.06
      );

      // Text remains prominent & legible over the car's exterior between 0.38 and 0.70

      // 3. WHEN LEAVING:
      // Text: opacity 1 -> 0, subtle translateY & scale exit
      tl.to(
        text,
        {
          opacity: 0,
          y: -25,
          scale: 0.98,
          duration: 0.16,
          ease: "power2.in",
        },
        0.70
      );

      // 4. SECTION END:
      // Final frame reached, transitioning into Section 02 with cinematic crossfade:
      // scale 1 -> 1.05, blur 0 -> 4px, opacity 1 -> 0
      tl.to(
        video,
        {
          scale: 1.05,
          filter: "blur(4px)",
          opacity: 0.1,
          duration: 0.14,
          ease: "power2.inOut",
        },
        0.86
      );

      // Ensure timeline end marker aligns with 1.00
      tl.to({}, { duration: 0.01 }, 1.0);
    }, section);

    return () => {
      ctx.revert();
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, [scrubVideo, onProgress]);

  // Smooth scroll handler for optional navigation
  const scrollToNextSection = useCallback(() => {
    const target = document.getElementById(nextSectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, [nextSectionId]);

  return (
    <section
      ref={sectionRef}
      id="section-exterior"
      className={`car-exterior-section relative w-full bg-[#050505] text-white ${className}`}
      style={{
        // Section container provides the scroll track for GSAP pin
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
        {/* Fullscreen Cinematic Video Container */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050505] z-0 pointer-events-none">
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

        {/* Restrained Luxury Vignette & Soft Gradient (keeps car readable, no colorful gradients) */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              "radial-gradient(circle at 65% 50%, rgba(5,5,5,0) 40%, rgba(5,5,5,0.45) 80%, rgba(5,5,5,0.85) 100%)",
          }}
        />

        {/* Minimal Left Radial Mask for Text Legibility (No excessive cards, car stays main focus) */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.35) 45%, transparent 80%)",
          }}
        />

        {/* Minimal Premium Typography (Placed left-bottom to leave car center unobstructed) */}
        <div
          ref={textRef}
          className="absolute left-6 sm:left-14 md:left-20 lg:left-28 bottom-16 sm:bottom-20 md:bottom-24 z-10 max-w-2xl pointer-events-none select-none"
        >
          {/* 01 / EXTERIOR */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase font-light">
              01 / EXTERIOR
            </span>
            <span className="w-10 h-[1px] bg-white/20" />
          </div>

          {/* THE MACHINE */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight text-white uppercase leading-[0.88] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] mb-4 sm:mb-5">
            THE MACHINE
          </h1>

          {/* "Designed to be noticed." */}
          <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light italic tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            &ldquo;Designed to be noticed.&rdquo;
          </p>
        </div>

        {/* Subtle Scroll Cue at Section Start (Fades away as user scrolls) */}
        <div
          ref={promptRef}
          className="absolute bottom-8 left-6 sm:left-14 md:left-20 lg:left-28 z-10 flex items-center gap-3 pointer-events-none select-none text-white/40"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
            SCROLL TO EXPLORE
          </span>
          <div className="w-8 h-[1px] bg-white/30" />
        </div>


        {/* Smooth Transition Overlay for Section 02 (Dark Charcoal dissolve, no hard cut) */}
        <div
          ref={transitionOverlayRef}
          className="absolute inset-0 bg-[#050505] z-30 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>
    </section>
  );
}
