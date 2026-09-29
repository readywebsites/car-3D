import { carConfig } from "../config/carConfig";

export default function ScrollProgress({
  activeStage = 0,
  scrollProgress = 0,
  onNavigate,
}) {
  return (
    <aside
      className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 z-30 flex items-center gap-4 select-none pointer-events-auto"
      aria-label="Cinematic Progress"
    >
      {/* Thin Vertical Timeline Indicator Line */}
      <div className="relative w-[1px] h-32 sm:h-44 bg-white/15 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full bg-white transition-all duration-100 ease-out"
          style={{ height: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
        />
      </div>

      {/* Stage Number Stack: 01, 02, 03, 04 */}
      <div className="flex flex-col justify-between h-32 sm:h-44 py-0.5">
        {carConfig.scenes.map((scene, idx) => {
          const isActive = activeStage === idx;
          return (
            <button
              key={scene.id}
              onClick={() => onNavigate(idx)}
              className={`group flex items-center gap-2 text-left focus:outline-none transition-all duration-300 cursor-pointer ${
                isActive ? "-translate-x-1" : "translate-x-0"
              }`}
              aria-label={`Jump to stage ${scene.number}`}
            >
              <span
                className={`font-mono-tech text-[10px] sm:text-[11px] tracking-[0.25em] transition-all duration-300 ${
                  isActive
                    ? "text-white font-medium opacity-100 scale-105"
                    : "text-white/30 group-hover:text-white/70 opacity-40"
                }`}
              >
                {scene.number}
              </span>

              {/* Subtle active indicator mark */}
              <span
                className={`w-[3px] h-[3px] rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white scale-100 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                    : "bg-transparent scale-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}