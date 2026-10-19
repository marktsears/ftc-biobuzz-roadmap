import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/Providers";
import { BottomNav, Footer, Header, PreviewBar, ProfileDialog, Ready, SignInBar, Toasts } from "@/components/Shell";
import "./globals.css";

// Trinity School's site is set in a classical serif. These are free stand-ins with the same feel.
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const ui = Montserrat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Trinity Robotics · BIOBUZZ Rails", template: "%s · Trinity Robotics" },
  description: "Week by week, the whole team on the same page. Trinity Robotics, FTC 2026–27 BIOBUZZ, teams 2827 and 3587.",
};
export const viewport: Viewport = { themeColor: "#1f3c6e", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ui.variable}`}>
      <body>
        <Providers>
          <a href="#main" className="skip">
            Skip to content
          </a>
          <Header />
          <SignInBar />
          <PreviewBar />
          <main id="main">
            <Ready>{children}</Ready>
          </main>
          <Footer />
          <BottomNav />
          <Toasts />
          <ProfileDialog />
        </Providers>
      </body>
    </html>
  );
}
