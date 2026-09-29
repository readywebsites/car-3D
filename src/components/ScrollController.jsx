import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { audioEngine } from "../utils/audioEngine";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollController({
  storyRef,
  videoRefs,
  sceneRefs,
  darkShutterRef,
  promptRef,
  specsRef,
  ctaRef,
  onStageChange,
  onProgressChange,
  enabled = true,
}) {
  const scrubbersRef = useRef([]);

  useEffect(() => {
    if (!enabled || !storyRef.current) return;

    // Initialize video scrub states & event listeners
    const videos = videoRefs.current;
    scrubbersRef.current = videos.map((video, idx) => {
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
          // Safety timeout: release lock after 150ms if browser stalls
          if (state.seekTimeout) clearTimeout(state.seekTimeout);
          state.seekTimeout = setTimeout(() => {
            state.seeking = false;
          }, 150);
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
      } catch (e) {
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

      const clampedTime = Math.max(0, Math.min(duration - 0.04, progressNormalized * duration));
      if (Math.abs(state.lastTime - clampedTime) < 0.02) return;

      state.targetTime = clampedTime;

      if (state.seeking) {
        state.pendingTime = clampedTime;
      } else {
        applySeek(video, clampedTime, state);
      }
    }

    // Set up GSAP Timeline and ScrollTrigger
    const ctx = gsap.context(() => {
      const v0 = videos[0];
      const v1 = videos[1];
      const v2 = videos[2];
      const v3 = videos[3];

      const s0 = sceneRefs.current[0];
      const s1 = sceneRefs.current[1];
      const s2 = sceneRefs.current[2];
      const s3 = sceneRefs.current[3];

      const shutter = darkShutterRef.current;
      const prompt = promptRef.current;
      const specs = specsRef.current;
      const cta = ctaRef.current;

      let lastActiveStage = -1;

      // Master Scroll-Driven Cinematic Timeline (0 to 100 scale)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6, // Smooth cinematic scrub response
          onUpdate: (self) => {
            const p = self.progress;
            if (onProgressChange) onProgressChange(p);

            // Determine active stage
            let currentStage = 0;
            if (p >= 0.72) {
              currentStage = 3;
            } else if (p >= 0.46) {
              currentStage = 2;
            } else if (p >= 0.21) {
              currentStage = 1;
            } else {
              currentStage = 0;
            }

            if (lastActiveStage !== currentStage) {
              lastActiveStage = currentStage;
              if (onStageChange) onStageChange(currentStage);
            }

            // SCRUB CONTROL: Local scrub progress for active & transitioning videos
            // Video 0 (Car): 0.00 to 0.28
            if (p <= 0.28) {
              const t0 = Math.max(0, Math.min(1, p / 0.24));
              scrubVideo(0, t0);
            }

            // Video 1 (Woman): 0.17 to 0.52
            if (p >= 0.17 && p <= 0.52) {
              const t1 = Math.max(0, Math.min(1, (p - 0.20) / (0.44 - 0.20)));
              scrubVideo(1, t1);
            }

            // Video 2 (Engine): 0.43 to 0.77
            if (p >= 0.43 && p <= 0.77) {
              const t2 = Math.max(0, Math.min(1, (p - 0.46) / (0.69 - 0.46)));
              scrubVideo(2, t2);
            }

            // Video 3 (Interior): 0.67 to 1.00
            if (p >= 0.67) {
              const t3 = Math.max(0, Math.min(1, (p - 0.69) / (0.94 - 0.69)));
              scrubVideo(3, t3);
            }

            // Modulate ambient sound with scroll velocity
            const velocity = Math.abs(self.getVelocity() || 0);
            audioEngine.modulate(velocity / 1000);
          },
        },
      });

      // -------------------------------------------------------------------------
      // INITIAL STYLES
      // -------------------------------------------------------------------------
      gsap.set(v0, { opacity: 1, scale: 1.0, filter: "blur(0px)", zIndex: 4 });
      gsap.set(v1, { opacity: 0, scale: 1.05, filter: "blur(4px)", zIndex: 3 });
      gsap.set(v2, { opacity: 0, scale: 1.05, filter: "blur(4px)", zIndex: 2 });
      gsap.set(v3, { opacity: 0, scale: 1.05, filter: "blur(4px)", zIndex: 1 });

      gsap.set(s0, { opacity: 1, y: 0 });
      gsap.set(s1, { opacity: 0, y: 35 });
      gsap.set(s2, { opacity: 0, y: 35 });
      gsap.set(s3, { opacity: 0, y: 35 });
      if (specs) gsap.set(specs, { opacity: 0, y: 30 });
      if (cta) gsap.set(cta, { opacity: 0, y: 40 });

      // -------------------------------------------------------------------------
      // STAGE 01 — CAR REVEAL (0 to 25)
      // -------------------------------------------------------------------------
      if (prompt) {
        tl.to(prompt, { opacity: 0, y: -20, duration: 5, ease: "power2.in" }, 2);
      }

      // Scene 0 text fades as user scrolls
      tl.to(s0, { opacity: 0, y: -30, duration: 8, ease: "power2.in" }, 12);
      tl.to(v0, { scale: 1.03, duration: 18, ease: "none" }, 0);

      // TRANSITION 01 -> 02: CAR -> WOMAN (Section 4 specs)
      // Previous: opacity 1 -> 0, scale 1 -> 1.05, blur 0 -> 4px
      // Next: opacity 0 -> 1, scale 1.05 -> 1, blur 4px -> 0
      tl.to(
        v0,
        {
          opacity: 0,
          scale: 1.05,
          filter: "blur(4px)",
          duration: 8,
          ease: "power2.inOut",
        },
        18
      );

      tl.to(
        v1,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          duration: 8,
          ease: "power2.inOut",
        },
        19
      );

      // -------------------------------------------------------------------------
      // STAGE 02 — WOMAN + CAR (25 to 50)
      // -------------------------------------------------------------------------
      tl.to(s1, { opacity: 1, y: 0, duration: 7, ease: "power2.out" }, 23);
      tl.to(v1, { scale: 1.03, duration: 16, ease: "none" }, 24);
      tl.to(s1, { opacity: 0, y: -30, duration: 7, ease: "power2.in" }, 37);

      // TRANSITION 02 -> 03: WOMAN -> DARK CINEMATIC FADE -> ENGINE (Section 7 specs)
      if (shutter) {
        tl.to(shutter, { opacity: 0.95, duration: 5, ease: "power2.in" }, 42);
      }
      tl.to(
        v1,
        {
          opacity: 0,
          scale: 1.05,
          filter: "blur(4px)",
          duration: 5,
          ease: "power2.in",
        },
        42
      );

      // Elevate v2 z-index and reveal
      tl.set(v2, { zIndex: 5 }, 45);
      tl.to(
        v2,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          duration: 6,
          ease: "power2.out",
        },
        46
      );
      if (shutter) {
        tl.to(shutter, { opacity: 0, duration: 5, ease: "power2.out" }, 47);
      }

      // -------------------------------------------------------------------------
      // STAGE 03 — ENGINE / PERFORMANCE (50 to 75)
      // -------------------------------------------------------------------------
      tl.to(s2, { opacity: 1, y: 0, duration: 7, ease: "power2.out" }, 49);
      if (specs) {
        tl.to(specs, { opacity: 1, y: 0, duration: 7, ease: "power2.out" }, 51);
      }
      tl.to(v2, { scale: 1.03, duration: 16, ease: "none" }, 50);

      tl.to(s2, { opacity: 0, y: -30, duration: 7, ease: "power2.in" }, 62);
      if (specs) {
        tl.to(specs, { opacity: 0, y: -25, duration: 7, ease: "power2.in" }, 62);
      }

      // TRANSITION 03 -> 04: ENGINE -> SMOOTH CROSSFADE -> INTERIOR (Section 8 specs)
      tl.set(v3, { zIndex: 6 }, 66);
      tl.to(
        v2,
        {
          opacity: 0,
          scale: 1.05,
          filter: "blur(4px)",
          duration: 9,
          ease: "power2.inOut",
        },
        67
      );

      tl.to(
        v3,
        {
          opacity: 1,
          scale: 1.0,
          filter: "blur(0px)",
          duration: 9,
          ease: "power2.inOut",
        },
        68
      );

      // -------------------------------------------------------------------------
      // STAGE 04 — INTERIOR & CLIMAX (75 to 100)
      // -------------------------------------------------------------------------
      tl.to(s3, { opacity: 1, y: 0, duration: 7, ease: "power2.out" }, 74);
      tl.to(v3, { scale: 1.04, duration: 20, ease: "none" }, 75);
      tl.to(s3, { opacity: 0, y: -25, duration: 6, ease: "power2.in" }, 84);

      if (cta) {
        tl.to(cta, { opacity: 1, y: 0, duration: 8, ease: "power2.out" }, 89);
      }

      // Set explicit total duration to 100
      tl.to({}, { duration: 0.1 }, 100);

      ScrollTrigger.refresh();
    }, storyRef);

    return () => {
      ctx.revert();
      scrubbersRef.current.forEach((st) => st._cleanup?.());
    };
  }, [enabled]);

  return null;
}
