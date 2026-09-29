import SceneText from "../components/SceneText";
import { ChevronDown } from "lucide-react";

export default function CarScene({ scene, promptRef }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center px-6 sm:px-14 md:px-20 lg:px-28">
      <SceneText
        number={scene.number}
        category={scene.category}
        titleLine1={scene.titleLine1}
        titleLine2={scene.titleLine2}
        quote={scene.quote}
        detail={scene.detail}
      />

      {/* Opening Scroll Prompt */}
      <div
        ref={promptRef}
        className="absolute bottom-8 sm:bottom-12 left-6 sm:left-14 md:left-20 lg:left-28 z-20 flex items-center gap-3 text-white/40 pointer-events-none"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-mono-tech tracking-[0.3em] uppercase mb-2">
            SCROLL TO EXPLORE
          </span>
          <div className="w-[1px] h-8 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-pulse" />
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce opacity-60 ml-1" />
      </div>
    </div>
  );
}
