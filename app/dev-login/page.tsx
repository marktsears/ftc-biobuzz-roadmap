import { notFound } from "next/navigation";
import { DevLogin } from "@/components/DevLogin";

export const metadata = { title: "Test sign-in", robots: { index: false } };

/** Only exists under `next dev`. */
export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DevLogin />;
}
