/**
 * Global Next-Auth configuration & helpers
 *
 *  • `handlers` – { GET, POST } route handlers for `/api/auth/[...nextauth]`
 *  • `auth`      – `auth()` helper you can call in Server Components / Actions
 *  • `signIn`    – `signIn()` helper (client & server)
 *  • `signOut`   – `signOut()` helper (client & server)
 */
import bcrypt from "bcryptjs";
import { getServerSession, type User, type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { isDashboardPath } from "@/lib/auth-session";
import { prisma } from "@/lib/generated/prisma";
import { signInFormSchema } from "@/lib/validators";

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@acme.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        if (!raw) return null;

        const { email, password, remember } = signInFormSchema.parse(raw);
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            emailVerified: true,
            phoneNo: true,
          },
        });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneNo: user.phoneNo,
          remember,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: THIRTY_DAYS_IN_SECONDS,
    updateAge: ONE_DAY_IN_SECONDS,
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    newUser: "/sign-up",
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) {
        const pathname = url.split("?")[0];
        if (isDashboardPath(pathname)) {
          const params = new URLSearchParams({ callbackUrl: pathname });
          return `${baseUrl}/auth/continue?${params.toString()}`;
        }
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/public`;
    },
    async jwt({ token, user, trigger }: { token: JWT; user?: User; trigger?: "update" | "signIn" | "signUp" }) {
      const nowInSeconds = Math.floor(Date.now() / 1000);

      if (token.remember === false && token.sessionExpiresAt && nowInSeconds > token.sessionExpiresAt)
        return { ...token, sub: undefined, exp: 0 };

      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.phoneNo = user.phoneNo;
        token.remember = user.remember ?? false;
        token.sessionExpiresAt = nowInSeconds + (token.remember ? THIRTY_DAYS_IN_SECONDS : ONE_DAY_IN_SECONDS);
      }

      if (trigger === "update" || user) {
        const refreshedUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { emailVerified: true, role: true, phoneNo: true, id: true },
        });
        if (refreshedUser) {
          token.emailVerified = refreshedUser.emailVerified;
          token.role = refreshedUser.role;
          token.phoneNo = refreshedUser.phoneNo;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!token.sub) return null as unknown as Session;

      session.user.id = token.sub;
      session.user.role = token.role as string;
      session.user.emailVerified = token.emailVerified;
      session.user.phoneNo = token.phoneNo;
      return session;
    },
  },
};

// Create auth function for server-side session access
export function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}

// Client-side auth functions
export { signIn, signOut } from "next-auth/react";
