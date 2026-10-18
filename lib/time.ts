export const DAY = 86400000;

/** start of local day */
export const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** parse "YYYY-MM-DD" as a local date */
export const pd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const diffDays = (a: Date, b: Date) => Math.round((sod(a).getTime() - sod(b).getTime()) / DAY);
export const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtLong = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** djb2 hash used for stable item IDs */
export const hs = (s: string) => {
  let x = 5381;
  for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
  return (x >>> 0).toString(36);
};

export function ago(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.round((now.getTime() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
