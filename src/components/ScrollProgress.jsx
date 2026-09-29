import { carConfig } from "../config/carConfig";

export default function ScrollProgress({
  activeStage = 0,
  onNavigate,
}) {
  return (
    <aside
      className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 z-30 flex items-center gap-4 select-none pointer-events-auto"
      aria-label="Section Indicator"
    >
      {/* Thin Vertical Line */}
      <div className="relative w-[1px] h-32 sm:h-40 bg-white/15 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full bg-white transition-all duration-500 ease-out"
          style={{
            height: "25%",
            transform: `translateY(${activeStage * 100}%)`,
          }}
        />
      </div>

      {/* Minimal Stack: 01, 02, 03, 04 */}
      <div className="flex flex-col justify-between h-32 sm:h-40 py-0.5">
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
                    : "text-white/30 group-hover:text-white/70 opacity-40 font-normal"
                }`}
              >
                {scene.number}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}