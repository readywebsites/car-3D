import { useState, useCallback } from "react";
import { carConfig } from "./config/carConfig";
import Navbar from "./components/Navbar";
import ScrollProgress from "./components/ScrollProgress";
import CinematicExperience from "./components/CinematicExperience";
import LoadingScreen from "./components/LoadingScreen";
import ExploreModal from "./components/ExploreModal";
import MenuDrawer from "./components/MenuDrawer";
import { audioEngine } from "./utils/audioEngine";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [activeStage, setActiveStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(false);

  // Loading handlers
  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);

  const handleLoaderRemoved = useCallback(() => {
    setLoaderMounted(false);
  }, []);

  // Ambient sound toggle
  const toggleSound = useCallback(() => {
    const active = audioEngine.toggle();
    setSoundActive(active);
  }, []);

  // Smooth navigation to a specific stage
  const navigateToStage = useCallback((stageIndex) => {
    setActiveStage(stageIndex);

    const trackIds = [
      "section-exterior-track",
      "section-02-track",
      "section-03-track",
      "section-04-track",
    ];
    const targetEl = document.getElementById(trackIds[stageIndex]);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const container = document.getElementById("cinematic-master-story");
    if (container) {
      const totalScroll = container.scrollHeight - window.innerHeight;
      const stageRatios = [0.0, 0.25, 0.50, 0.75];
      const targetScroll = stageRatios[stageIndex] * totalScroll;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  }, []);

  const handleStageChange = useCallback((stage) => {
    setActiveStage(stage);
  }, []);

  const handleProgressChange = useCallback((p) => {
    setScrollProgress(p);
  }, []);

  return (
    <>
      {/* Luxury Stepped Loading Screen */}
      {loaderMounted && (
        <LoadingScreen
          carName={carConfig.name}
          onComplete={handleLoadingComplete}
          onRemoved={handleLoaderRemoved}
        />
      )}

      <div className="relative min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
        {/* Minimal Luxury Navigation Bar: CAR | EXPERIENCE | PERFORMANCE | INTERIOR */}
        <Navbar
          activeStage={activeStage}
          onNavigate={navigateToStage}
          onOpenMenu={() => setIsMenuOpen(true)}
          soundActive={soundActive}
          onToggleSound={toggleSound}
        />

        {/* Minimal Vertical Scroll Progress Indicator: 01 | 02 | 03 | 04 */}
        <ScrollProgress
          activeStage={activeStage}
          scrollProgress={scrollProgress}
          onNavigate={navigateToStage}
        />

        {/* ======================================================== */}
        {/* ONE UNIFIED PREMIUM CINEMATIC SCROLL EXPERIENCE           */}
        {/* 01 CAR -> 02 WOMAN -> 03 ENGINE -> 04 INTERIOR           */}
        {/* Single sticky 100svh viewport, user scroll controls video */}
        {/* ======================================================== */}
        <CinematicExperience
          onStageChange={handleStageChange}
          onProgressChange={handleProgressChange}
          onExplore={() => setIsExploreOpen(true)}
          enabled={!loading}
        />

        {/* Luxury Navigation Menu Drawer */}
        <MenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={navigateToStage}
          soundActive={soundActive}
          onToggleSound={toggleSound}
          onOpenExplore={() => setIsExploreOpen(true)}
        />

        {/* Interactive Exploration & Bespoke Commission Modal */}
        <ExploreModal
          isOpen={isExploreOpen}
          onClose={() => setIsExploreOpen(false)}
        />
      </div>
    </>
  );
}