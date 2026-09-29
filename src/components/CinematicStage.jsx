import { useRef, useEffect } from "react";
import { carConfig } from "../config/carConfig";
import CarScene from "../sections/CarScene";
import WomanScene from "../sections/WomanScene";
import EngineScene from "../sections/EngineScene";
import InteriorScene from "../sections/InteriorScene";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";

export default function CinematicStage({
  videoRefs,
  sceneRefs,
  darkShutterRef,
  promptRef,
  specsRef,
  ctaRef,
  onExplore,
}) {
  const stageRef = useRef(null);
  const parallaxLayerRef = useRef(null);

  // Desktop Mouse Parallax (Section 14: Restrained subtle camera depth)
  useEffect(() => {
    const stage = stageRef.current;
    const target = parallaxLayerRef.current;
    if (!stage || !target) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const quickX = gsap.quickTo(target, "x", { duration: 1.2, ease: "power2.out" });
    const quickY = gsap.quickTo(target, "y", { duration: 1.2, ease: "power2.out" });

    const handleMouseMove = (e) => {
      const rect = stage.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      // Restrained parallax: maximum 10px horizontal, 6px vertical
      quickX(normX * 10);
      quickY(normY * 6);
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

  const scenes = carConfig.scenes;

  return (
    <div
      ref={stageRef}
      className="cinematic-stage sticky top-0 left-0 w-full h-screen h-[100svh] overflow-hidden select-none pointer-events-none z-10 bg-[#050505]"
    >
      {/* Parallax Container for subtle camera depth */}
      <div
        ref={parallaxLayerRef}
        className="absolute inset-[-2%] w-[104%] h-[104%] will-change-transform z-[1]"
      >
        {/* 4 STAGE VIDEOS (position: absolute; inset: 0) */}
        {scenes.map((scene, idx) => (
          <video
            key={scene.id}
            ref={(el) => (videoRefs.current[idx] = el)}
            src={scene.video}
            preload="auto"
            playsInline
            muted
            loop={false}
            autoPlay={false}
            className="absolute inset-0 w-full h-full object-cover will-change-transform will-change-[filter,opacity]"
          />
        ))}
      </div>

      {/* DARK SHUTTER OVERLAY FOR 02 -> 03 TRANSITION (Section 7) */}
      <div
        ref={darkShutterRef}
        className="absolute inset-0 bg-[#050505] pointer-events-none z-[6] opacity-0 will-change-[opacity]"
      />

      {/* CINEMATIC TEXTURE & VIGNETTE OVERLAYS */}
      <div className="film-grain z-[7]" />
      <div className="cinematic-vignette z-[4]" />
      <div className="cinematic-gradient-left z-[5]" />
      <div className="cinematic-gradient-bottom z-[5]" />

      {/* 4 SCENE CONTENT OVERLAYS */}
      {/* 01: Car Reveal */}
      <div
        ref={(el) => (sceneRefs.current[0] = el)}
        className="absolute inset-0 z-[10] will-change-transform will-change-[opacity] pointer-events-none"
      >
        <CarScene scene={scenes[0]} promptRef={promptRef} />
      </div>

      {/* 02: Woman + Car */}
      <div
        ref={(el) => (sceneRefs.current[1] = el)}
        className="absolute inset-0 z-[10] will-change-transform will-change-[opacity] pointer-events-none"
      >
        <WomanScene scene={scenes[1]} />
      </div>

      {/* 03: Engine / Performance */}
      <div
        ref={(el) => (sceneRefs.current[2] = el)}
        className="absolute inset-0 z-[10] will-change-transform will-change-[opacity] pointer-events-none"
      >
        <EngineScene scene={scenes[2]} specsRef={specsRef} />
      </div>

      {/* 04: Interior Sanctuary */}
      <div
        ref={(el) => (sceneRefs.current[3] = el)}
        className="absolute inset-0 z-[10] will-change-transform will-change-[opacity] pointer-events-none"
      >
        <InteriorScene scene={scenes[3]} />
      </div>

      {/* CLIMAX CALL-TO-ACTION (Independent Top Layer at z-[20]) */}
      <div
        ref={ctaRef}
        className="absolute inset-0 z-[20] flex flex-col items-center justify-center text-center px-6 pointer-events-none will-change-transform will-change-[opacity]"
        style={{ opacity: 0, transform: "translateY(40px)" }}
      >
        <div className="max-w-3xl flex flex-col items-center">
          <span className="text-[11px] font-mono-tech tracking-[0.4em] text-white/50 uppercase mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            THE GRAND TOURER REDEFINED
          </span>

          <h3 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-white uppercase leading-tight mb-8 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            {scenes[3].endCta?.headline || "EXPERIENCE THE DIFFERENCE"}
          </h3>

          <button
            onClick={onExplore}
            className="pointer-events-auto group relative inline-flex items-center gap-4 px-10 py-4 sm:px-12 sm:py-5 bg-white text-black font-mono-tech text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase rounded-sm hover:bg-neutral-200 transition-all duration-300 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Explore the car"
          >
            <span>{scenes[3].endCta?.buttonText || "EXPLORE"}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          <span className="text-[10px] font-mono-tech tracking-[0.25em] text-white/40 uppercase mt-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            CLICK TO INSPECT FULL SPECIFICATIONS & COMMISSION DETAILS
          </span>
        </div>
      </div>
    </div>
  );
}
