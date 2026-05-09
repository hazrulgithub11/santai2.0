/**
 * Santai logo — 8-petal flower built from rotated ellipses.
 * Uses className instead of fixed width/height so Tailwind responsive classes
 * (w-8 h-8, w-14 h-14, etc.) control the rendered size.
 */
export function SantaiLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Santai logo"
    >
      {/* Each ellipse is a petal; rotate() spins it around the centre (16,16). */}
      {[0, 45, 90, 135].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="10"
          rx="3"
          ry="6"
          fill="white"
          fillOpacity="0.75"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4" fill="white" fillOpacity="0.95" />
    </svg>
  );
}
