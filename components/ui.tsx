import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { avatarColor, initials } from "@/lib/xp";

/* ---------- icons: simple 24px line icons ---------- */
const PATHS: Record<string, ReactNode> = {
  home: <path d="M4 11.5 12 4l8 7.5V20h-5.5v-5.5h-5V20H4z" />,
  week: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  map: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="7" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M8.3 11 15.7 8M8.3 13l7.4 3" />
    </>
  ),
  quest: <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
  robot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 4v4M9 13h.01M15 13h.01M3 13v2M21 13v2" />
    </>
  ),
  book: <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5zM5 20.5A2.5 2.5 0 0 0 7.5 23H19" />,
  hive: <path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9z" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.5 5.5 3.5-5.5 3.5z" />
    </>
  ),
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  design: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12v9M12 12 4 7.5M12 12l8-4.5" />
    </>
  ),
  build: <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.8 2.8-2.4-.6-.6-2.4z" />,
  plan: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5M12 16.5h.01" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  left: <path d="M19 12H5M11 6l-6 6 6 6" />,
  shuffle: <path d="M4 7h3.5c3 0 4.5 2 6 5s3 5 6 5H21M4 17h3.5c1.7 0 2.9-.7 3.9-1.9M14 8.9C15 7.7 16.2 7 18 7h3M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />,
  trophy: <path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 14v4M8.5 20h7" />,
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.3A3 3 0 0 1 16 12M17.5 14.2A5.5 5.5 0 0 1 21 19" />
    </>
  ),
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  hand: <path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V14c0 4-2 7-6 7-3 0-4.5-1.5-6-4l-2-3.3a1.4 1.4 0 0 1 2.3-1.5L8 14" />,
  print: <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Trinity-style pill button: outlined, italic serif, gold circle arrow ---------- */
export function Cta({ href, children, external, className = "", variant }: { href: string; children: ReactNode; external?: boolean; className?: string; variant?: "light" | "solid" }) {
  const cls = `cta ${variant ?? ""} ${className}`.trim();
  const inner = (
    <>
      <span>{children}</span>
      <i className="cta-dot" aria-hidden="true">
        <Icon name="arrow" size={16} />
      </i>
    </>
  );
  return external ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link className={cls} href={href}>
      {inner}
    </Link>
  );
}

export function CtaButton({ children, className = "", variant, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "light" | "solid" }) {
  return (
    <button type="button" className={`cta ${variant ?? ""} ${className}`.trim()} {...rest}>
      <span>{children}</span>
      <i className="cta-dot" aria-hidden="true">
        <Icon name="arrow" size={16} />
      </i>
    </button>
  );
}

/* ---------- progress ring ---------- */
export function Ring({ pct, size = 64, stroke = 7, color = "var(--navy)", track = "var(--line)", children, label }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="ring" style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * p) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

export function Bar({ pct, color, className = "" }: { pct: number; color?: string; className?: string }) {
  return (
    <div className={`bar ${className}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function Avatar({ name, size = 28, title }: { name: string; size?: number; title?: string }) {
  return (
    <span className="avatar" title={title ?? name} style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.4 }}>
      {initials(name)}
    </span>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone?: "full" | "late" | "now" | "gold" }) {
  return <span className={`pill ${tone ?? ""}`.trim()}>{children}</span>;
}

/** Trinity-style geometric decoration: half circles, rings and dots */
export function Shapes({ variant = "hero" }: { variant?: "hero" | "banner" | "foot" }) {
  return (
    <div className={`shapes shapes-${variant}`} aria-hidden="true">
      <i className="sh-arc" />
      <i className="sh-ring" />
      <i className="sh-dot" />
      <i className="sh-dots" />
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
