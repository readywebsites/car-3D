import { useEffect } from "react";
import { carConfig } from "../config/carConfig";
import { X, Volume2, VolumeX, FileText, ArrowRight } from "lucide-react";

export default function MenuDrawer({
  isOpen,
  onClose,
  onNavigate,
  soundActive,
  onToggleSound,
  onOpenExplore,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md sm:max-w-lg h-full bg-[#080808] border-l border-white/10 p-8 sm:p-12 flex flex-col justify-between overflow-y-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-[0.3em] text-white">
              {carConfig.name}
            </span>
            <span className="text-[10px] font-mono-tech tracking-[0.2em] text-white/40">
              INDEX
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white border border-white/10 hover:border-white/40 rounded-full transition-colors focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stages Navigation List */}
        <div className="py-8 space-y-6">
          <span className="text-[10px] font-mono-tech tracking-[0.3em] text-white/40 uppercase block">
            CINEMATIC STAGES
          </span>
          <div className="space-y-4">
            {carConfig.stages.map((stage, idx) => (
              <button
                key={stage.id}
                onClick={() => {
                  onNavigate(idx);
                  onClose();
                }}
                className="group w-full flex items-center justify-between text-left py-2 border-b border-white/5 hover:border-white/20 transition-all duration-300 focus:outline-none"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech text-xs tracking-[0.25em] text-white/40 group-hover:text-white transition-colors">
                      {stage.number}
                    </span>
                    <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white group-hover:translate-x-1.5 transition-transform duration-300">
                      {stage.title}
                    </span>
                  </div>
                  <span className="text-xs text-white/40 font-editorial italic ml-8 block mt-0.5">
                    {stage.quote}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          {/* Audio toggle button */}
          <button
            onClick={onToggleSound}
            className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-xs font-mono-tech tracking-[0.2em] uppercase text-white transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2">
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>CINEMATIC AUDIO</span>
            </span>
            <span className="text-white/60">{soundActive ? "ACTIVE" : "MUTED"}</span>
          </button>

          {/* Explore full dossier button */}
          <button
            onClick={() => {
              onClose();
              onOpenExplore();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-white text-black hover:bg-neutral-200 border border-white rounded-sm text-xs font-mono-tech font-semibold tracking-[0.2em] uppercase transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>VEHICLE SPEC SHEET</span>
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <span className="text-[9px] font-mono-tech tracking-[0.25em] text-white/30 uppercase">
              {carConfig.name} © 2026 / LIMITED PRODUCTION
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
