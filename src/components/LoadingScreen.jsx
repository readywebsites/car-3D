import { useEffect, useState, useRef } from "react";

export default function LoadingScreen({
  carName = "AURELIA",
  onComplete,
  onRemoved,
}) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    // Stepped progression: 0% -> 25% -> 50% -> 75% -> 100%
    // Total duration: ~1.1 seconds
    const steps = [0, 25, 50, 75, 100];
    let stepIndex = 0;
    let stepTimer;
    let fallbackTimer;

    const triggerComplete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      setProgress(100);

      // Start fade out immediately
      setIsFading(true);

      // Notify parent so GSAP & scroll controller initialize
      if (onComplete) {
        onComplete();
      }

      // Remove from DOM after fade completes (450ms)
      setTimeout(() => {
        setIsRemoved(true);
        if (onRemoved) {
          onRemoved();
        }
      }, 450);
    };

    const nextStep = () => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex]);
        // Average ~220ms per step = 4 * 220 = 880ms to 1000ms
        stepTimer = setTimeout(nextStep, 220);
      } else {
        triggerComplete();
      }
    };

    // Begin first step
    stepTimer = setTimeout(nextStep, 150);

    // Guaranteed fallback timer (1.4s max): Loading screen cannot get stuck
    fallbackTimer = setTimeout(() => {
      triggerComplete();
    }, 1400);

    return () => {
      if (stepTimer) clearTimeout(stepTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [onComplete, onRemoved]);

  if (isRemoved) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-8 sm:p-14 bg-[#050505] text-white transition-opacity duration-500 ease-out select-none ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
      aria-hidden={isFading}
    >
      <div className="flex justify-between items-center text-xs tracking-[0.3em] text-white/40 uppercase font-mono-tech">
        <span>{carName} AUTOMOTIVE</span>
        <span>CINEMATIC ARCHITECTURE</span>
      </div>

      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.4em] text-white/50 block mb-3 font-mono-tech">
          INITIALIZING STAGES
        </span>
        <div className="flex items-baseline gap-4">
          <span className="text-7xl sm:text-9xl font-light tracking-tighter font-display leading-none">
            {String(progress).padStart(2, "0")}
          </span>
          <span className="text-lg font-light text-white/40 tracking-widest">%</span>
        </div>
        <p className="text-xs sm:text-sm font-light text-white/60 tracking-wider mt-4">
          Preparing visual telemetry & scroll-driven camera timeline
        </p>
      </div>

      <div>
        <div className="w-full h-[1px] bg-white/10 relative overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] tracking-[0.25em] text-white/30 uppercase font-mono-tech">
          <span>01 CAR / 02 EXPERIENCE / 03 PERFORMANCE / 04 CABIN</span>
          <span>{progress === 100 ? "COMPLETE" : "LOADING"}</span>
        </div>
      </div>
    </div>
  );
}