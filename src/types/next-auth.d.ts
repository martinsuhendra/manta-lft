declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    emailVerified?: Date | null;
    phoneNo?: string | null;
    remember?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      emailVerified?: Date | null;
      phoneNo?: string | null;
    };
  }

  interface DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      emailVerified?: Date | null;
      phoneNo?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string;
    role?: string;
    emailVerified?: Date | null;
    phoneNo?: string | null;
    defaultBrandId?: string;
    remember?: boolean;
    sessionExpiresAt?: number;
  }
}

// Helper type for client-side session with extended user properties
export interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    emailVerified?: Date | null;
    phoneNo?: string | null;
  };
  expires: string;
}
