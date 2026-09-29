export default function SceneText({
  number,
  category,
  titleLine1,
  titleLine2,
  quote,
  detail,
  children,
  className = "",
}) {
  return (
    <div className={`max-w-3xl select-none pointer-events-none ${className}`}>
      {/* Editorial Number & Category Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <span className="font-mono-tech text-xs sm:text-sm tracking-[0.35em] text-white/70 uppercase">
          {number}
        </span>
        <span className="w-8 h-[1px] bg-white/30" />
        <span className="font-mono-tech text-[10px] sm:text-xs tracking-[0.3em] text-white/50 uppercase">
          {category}
        </span>
      </div>

      {/* Editorial Stacked Headline */}
      <div className="mb-4 sm:mb-6">
        {titleLine1 && (
          <span className="block font-display font-light text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-[0.85] text-white/95 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            {titleLine1}
          </span>
        )}
        <span className="block font-display font-medium text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter leading-[0.88] text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          {titleLine2}
        </span>
      </div>

      {/* Editorial Quote */}
      {quote && (
        <p className="text-xl sm:text-2xl md:text-3xl text-neutral-200 font-light tracking-wide italic font-editorial max-w-xl leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          &ldquo;{quote}&rdquo;
        </p>
      )}

      {/* Editorial Micro-detail */}
      {detail && (
        <p className="text-[11px] sm:text-xs font-light text-white/50 tracking-[0.2em] uppercase mt-5 max-w-md hidden sm:block drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {detail}
        </p>
      )}

      {/* Optional Children */}
      {children}
    </div>
  );
}
