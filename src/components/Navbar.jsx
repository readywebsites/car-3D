import { useEffect, useState } from "react";
import { carConfig } from "../config/carConfig";
import { Volume2, VolumeX, Menu } from "lucide-react";

export default function Navbar({
  activeStage = 0,
  onNavigate,
  onOpenMenu,
  soundActive,
  onToggleSound,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25 || activeStage > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeStage]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-out px-6 sm:px-10 md:px-14 flex items-center justify-between pointer-events-auto ${
        scrolled || activeStage > 0
          ? "py-3 sm:py-3.5 bg-[rgba(0,0,0,0.35)] backdrop-blur-[18px] border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "py-5 sm:py-6 bg-transparent border-b border-transparent"
      }`}
    >
      {/* Left: CAR NAME */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate(0)}
          className="group text-left focus:outline-none cursor-pointer"
          aria-label={`${carConfig.name} Home`}
        >
          <span className="font-display font-light tracking-[0.35em] text-sm sm:text-base text-white group-hover:text-white/80 transition-colors uppercase">
            {carConfig.name}
          </span>
          <span className="hidden lg:inline-block ml-3 px-2 py-0.5 text-[9px] font-mono-tech tracking-[0.25em] text-white/40 border border-white/10 rounded-sm">
            {carConfig.series}
          </span>
        </button>
      </div>

      {/* Center: EXTERIOR | EXPERIENCE | PERFORMANCE | INTERIOR */}
      <nav
        className="hidden md:flex items-center gap-8 lg:gap-10"
        aria-label="Automotive Stages"
      >
        {carConfig.navItems.map((item, idx) => {
          const isActive = activeStage === idx;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(idx)}
              className={`relative py-1 text-xs tracking-[0.25em] uppercase transition-all duration-300 focus:outline-none cursor-pointer ${
                isActive
                  ? "text-white font-medium"
                  : "text-white/40 hover:text-white/80 font-normal"
              }`}
            >
              <span>{item.shortLabel || item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-white transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Sound Toggle & MENU */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md transition-all duration-300 focus:outline-none cursor-pointer group"
            title={soundActive ? "Mute ambient sound" : "Enable cinematic sound"}
            aria-label="Toggle cinematic audio"
          >
            {soundActive ? (
              <div className="flex items-center gap-1 text-white">
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
              </div>
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" />
            )}
            <span className="text-[9px] font-mono-tech tracking-[0.2em] uppercase text-white/50 group-hover:text-white transition-colors hidden sm:inline">
              {soundActive ? "SOUND" : "MUTED"}
            </span>
          </button>
        )}

        {/* MENU */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs tracking-[0.25em] uppercase text-white/80 hover:text-white border border-white/15 hover:border-white/40 bg-black/30 hover:bg-white/10 rounded-sm backdrop-blur-md transition-all duration-300 focus:outline-none cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-3.5 h-3.5" />
          <span className="font-mono-tech text-[11px]">MENU</span>
        </button>
      </div>
    </header>
  );
}