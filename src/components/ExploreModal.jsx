import { useState } from "react";
import { carConfig } from "../config/carConfig";
import { X, Check, ShieldCheck, Sparkles, Send } from "lucide-react";

export default function ExploreModal({ isOpen, onClose }) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    finish: "Obsidian Metallic",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setFormSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/15 rounded-sm p-6 sm:p-10 md:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.9)] my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors border border-white/10 hover:border-white/40 rounded-full focus:outline-none"
          aria-label="Close explore modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 text-xs font-mono-tech tracking-[0.3em] text-white/40 uppercase mb-2">
            <span>OFFICIAL DOSSIER</span>
            <span>/</span>
            <span>BESPOKE ALLOCATION</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
            {carConfig.name} <span className="text-white/40 font-light">{carConfig.series}</span>
          </h2>
          <p className="text-sm font-light text-white/60 tracking-wider mt-2 max-w-xl">
            {carConfig.exploreData?.description ||
              "Every curve honed by aerodynamic wind tunnels. Every surface clad in bespoke aniline leather and satin carbon weave."}
          </p>
        </div>

        {/* Telemetry Grid */}
        <div className="mb-10">
          <span className="text-[10px] font-mono-tech tracking-[0.3em] text-white/40 uppercase block mb-4">
            CORE TELEMETRY SPECIFICATIONS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {carConfig.exploreData?.telemetry?.map((spec, i) => (
              <div
                key={i}
                className="p-4 bg-white/[0.03] border border-white/10 rounded-sm hover:border-white/20 transition-colors"
              >
                <span className="block text-[9px] font-mono-tech tracking-[0.2em] text-white/40 mb-1">
                  {spec.label}
                </span>
                <span className="text-sm sm:text-base font-medium font-mono-tech text-white">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Engineering Highlights */}
        <div className="mb-10">
          <span className="text-[10px] font-mono-tech tracking-[0.3em] text-white/40 uppercase block mb-4">
            ENGINEERING & CRAFTSMANSHIP
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {carConfig.features?.map((f) => (
              <div
                key={f.code}
                className="p-4 bg-white/[0.02] border border-white/10 rounded-sm"
              >
                <div className="flex items-center gap-2 text-[10px] font-mono-tech text-white/40 mb-2">
                  <Sparkles className="w-3 h-3 text-white/60" />
                  <span>{f.code}</span>
                </div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-white mb-2">
                  {f.title}
                </h4>
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Private Commission Inquiry Section */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/15 rounded-sm">
          {formSubmitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl font-display font-semibold tracking-tight text-white mb-2">
                COMMISSION REQUEST LOGGED
              </h3>
              <p className="text-xs text-white/60 tracking-wider max-w-md mx-auto mb-6">
                Thank you, {formData.name}. A personal concierge from our Bespoke Commissioning Atelier will contact you at {formData.email} within 24 hours.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="text-xs font-mono-tech text-white/50 hover:text-white underline tracking-widest uppercase"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tech tracking-[0.25em] text-white/50 uppercase mb-2">
                <ShieldCheck className="w-4 h-4 text-white/80" />
                <span>ALLOCATION RESERVATION</span>
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-white mb-2">
                REQUEST BESPOKE COMMISSION
              </h3>
              <p className="text-xs text-white/50 tracking-wider mb-6">
                Direct access to limited production build slots and factory customization.
              </p>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-tech tracking-[0.2em] text-white/40 uppercase mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Lord Sterling"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-sm text-sm text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-mono-tech"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-tech tracking-[0.2em] text-white/40 uppercase mb-1">
                    CONFIDENTIAL EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="concierge@bespoke.com"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-sm text-sm text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-mono-tech"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono-tech tracking-[0.2em] text-white/40 uppercase mb-1">
                    PREFFERED EXTERIOR FINISH
                  </label>
                  <select
                    value={formData.finish}
                    onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-sm text-sm text-white focus:outline-none focus:border-white transition-colors font-mono-tech"
                  >
                    <option value="Obsidian Metallic" className="bg-[#0f0f0f]">
                      Obsidian Metallic (Deep Carbon Black)
                    </option>
                    <option value="Liquid Platinum" className="bg-[#0f0f0f]">
                      Liquid Platinum (Hyper Silver)
                    </option>
                    <option value="Monaco Red" className="bg-[#0f0f0f]">
                      Monaco Red (Deep Anodized Cherry)
                    </option>
                    <option value="Bespoke Raw Carbon" className="bg-[#0f0f0f]">
                      Satin Raw Twill Carbon Weave
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-black font-mono-tech text-xs font-semibold tracking-[0.25em] uppercase rounded-sm hover:bg-neutral-200 transition-all duration-300"
                  >
                    <span>TRANSMIT COMMISSION DOSSIER</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
