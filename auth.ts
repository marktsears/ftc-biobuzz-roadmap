import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { displayNameFromGoogle, isAllowedAccount } from "@/lib/identity";
import { normName } from "@/lib/xp";

const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: hasGoogle
    ? [
        Google({
          authorization: {
            params: { prompt: "select_account" },
          },
        }),
      ]
    : [],
  pages: { error: "/auth/error" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const p = profile as { email?: string; hd?: string } | undefined;
      return isAllowedAccount(p?.email, p?.hd);
    },
    async jwt({ token, profile }) {
      if (profile) {
        const p = profile as { email?: string | null; name?: string | null; given_name?: string; family_name?: string };
        token.name = normName(displayNameFromGoogle(p));
        if (p.email) token.email = p.email;
      }
      return token;
    },
  },
});
