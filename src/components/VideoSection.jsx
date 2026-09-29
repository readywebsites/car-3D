export default function VideoSection({ data, children, className = "" }) {
  return (
    <section id={data.id} className={`cinematic-section ${className}`}>
      <video
        className="background-video"
        src={data.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/car-poster.jpg"
        onError={(e) => e.currentTarget.classList.add("video-error")}
      />
      <div className="video-overlay" />
      {children}
    </section>
  );
}