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

import { prisma } from "@/lib/generated/prisma";
import { signInFormSchema } from "@/lib/validators";

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

        const { email, password } = signInFormSchema.parse(raw);
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
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    newUser: "/sign-up",
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If url is a relative path, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If url is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url;
      // Otherwise redirect to public site (role-based redirect handled in login form)
      return `${baseUrl}/public`;
    },
    async jwt({ token, user, trigger }: { token: JWT; user?: User; trigger?: "update" | "signIn" | "signUp" }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.phoneNo = user.phoneNo;
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
          token.defaultBrandId = "ALL";
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.sub as string;
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
