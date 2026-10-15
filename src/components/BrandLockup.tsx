type Variant = "nav" | "footer" | "mark";

/**
 * The CareJourney India mark: a care cross at the start of a route that ends at a destination dot.
 * Drawn as SVG so it stays sharp at any size; the route draws itself once on page load
 * (see .brand-mark-route in globals.css, which is skipped for reduced motion).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="20" fill="#062d56" />
      <path
        className="brand-mark-route"
        d="M11 28C13.2 17 21.6 12.6 29.4 12.4"
        pathLength={1}
        fill="none"
        stroke="#28d2b8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M11 23.6v8.8M6.6 28h8.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="brand-mark-dest" cx="30" cy="12.4" r="3.5" fill="#fff" />
    </svg>
  );
}

export default function BrandLockup({
  href = "/#top",
  variant = "nav",
}: {
  href?: string | null;
  variant?: Variant;
}) {
  const content = (
    <>
      <BrandMark className={`brand-mark brand-mark-${variant}`} />
      {variant === "mark" ? (
        <span className="sr-only">CareJourney India</span>
      ) : (
        <span className={`brand-word brand-word-${variant}`}>
          <span className="brand-word-main">CareJourney</span>
          <span className="brand-word-sub"> India</span>
        </span>
      )}
    </>
  );
  const className = `brand-lockup brand-lockup-${variant}`;
  if (!href) return <span className={className}>{content}</span>;
  return (
    <a href={href} className={className} aria-label="CareJourney India, home">
      {content}
    </a>
  );
}
