import SceneText from "../components/SceneText";
import { carConfig } from "../config/carConfig";

export default function EngineScene({ scene, specsRef }) {
  const perf = carConfig.performance;

  const specList = [
    { label: "POWER", value: perf.power },
    { label: "TORQUE", value: perf.torque },
    { label: "DRIVE", value: perf.drive },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-14 md:px-20 lg:px-28">
      <SceneText
        number={scene.number}
        category={scene.category}
        titleLine1={scene.titleLine1}
        titleLine2={scene.titleLine2}
        quote={scene.quote}
        detail={scene.detail}
      />

      {/* Editorial Technical Specifications */}
      <div
        ref={specsRef}
        className="mt-8 sm:mt-12 will-change-transform will-change-[opacity]"
        style={{ opacity: 0, transform: "translateY(30px)" }}
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 max-w-2xl">
          {specList.map((item, idx) => {
            // Split value and unit if applicable (e.g. "000 HP" -> "000", "HP")
            const parts = item.value.split(" ");
            const val = parts[0];
            const unit = parts.slice(1).join(" ");

            return (
              <div
                key={item.label}
                data-spec-item={idx}
                className="px-5 py-3.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-sm min-w-[125px]"
              >
                <span className="block text-[9px] font-mono-tech tracking-[0.28em] text-white/40 uppercase mb-1">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight">
                    {val}
                  </span>
                  {unit && (
                    <span className="text-xs font-mono-tech text-white/60 tracking-wider">
                      {unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[10px] font-mono-tech tracking-[0.25em] text-white/30 uppercase">
          CALIBRATED V8 TWIN-TURBOCHARGED ARCHITECTURE
        </div>
      </div>
    </div>
  );
}
