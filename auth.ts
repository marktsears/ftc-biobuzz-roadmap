import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { displayNameFromGoogle, isAllowedAccount } from "@/lib/identity";
import { normName } from "@/lib/xp";

const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** `next dev` only: sign in as any allowed email without Google, to try the student and coach screens. */
const devLogin = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    ...(hasGoogle
      ? [
          Google({
            authorization: {
              params: { prompt: "select_account" },
            },
          }),
        ]
      : []),
    ...(devLogin
      ? [
          Credentials({
            id: "dev",
            name: "Test sign-in",
            credentials: { email: {}, name: {} },
            authorize: c => {
              const email = String(c?.email || "").trim().toLowerCase();
              if (!isAllowedAccount(email)) return null;
              return { id: email, email, name: String(c?.name || "").trim() || email.split("@")[0] };
            },
          }),
        ]
      : []),
  ],
  pages: { error: "/auth/error" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "dev") return devLogin;
      if (account?.provider !== "google") return false;
      const p = profile as { email?: string; hd?: string } | undefined;
      return isAllowedAccount(p?.email, p?.hd);
    },
    async jwt({ token, profile, user, account }) {
      if (profile) {
        const p = profile as { email?: string | null; name?: string | null; given_name?: string; family_name?: string };
        token.name = normName(displayNameFromGoogle(p));
        if (p.email) token.email = p.email;
      } else if (account?.provider === "dev" && user) {
        token.name = normName(user.name || "");
        token.email = user.email;
      }
      return token;
    },
  },
});
