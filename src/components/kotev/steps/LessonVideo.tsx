/**
 * The lesson video inside a step's stage. Until a video is supplied the stage stays the
 * plain grey placeholder from the design.
 */
export function LessonVideo({ src, poster, title }: { src?: string; poster?: string; title: string }) {
  if (!src) return <span className="sr-only">{title}: הסרטון יתווסף בקרוב</span>;
  return (
    <video
      src={src}
      poster={poster}
      controls
      // No download in the player's menu, and no "save video" on right-click
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      playsInline
      preload="metadata"
      aria-label={title}
      className="absolute inset-0 size-full bg-foreground object-contain"
    />
  );
}
