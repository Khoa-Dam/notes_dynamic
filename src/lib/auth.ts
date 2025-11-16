import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";

import { authConfig } from "@/config/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";
import { db } from "./db";
import { users, dbAccounts } from "./db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db),

  basePath: "/api/auth",

  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },

  events: {
    linkAccount: async ({ user }) => {
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id!));
    },
  },

  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Chỉ cho phép link OAuth account với existing user nếu user đã đăng ký bằng credentials (có password)
      // Không tự động link 2 OAuth accounts khác nhau với nhau
      if (account?.provider !== "credentials" && user.email && account) {
        // Kiểm tra xem account OAuth này đã được link với user nào chưa
        const existingAccount = await db.query.dbAccounts.findFirst({
          where: (a, { eq, and }) =>
            and(
              eq(a.provider, account.provider),
              eq(a.providerAccountId, account.providerAccountId)
            ),
        });

        // Nếu account đã được link với user khác, không cho phép
        if (existingAccount) {
          // Account đã được link, cho phép đăng nhập
          return true;
        }

        // Kiểm tra xem có user nào với email này không
        const existingUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, user.email!),
        });

        if (existingUser) {
          // Chỉ cho phép link nếu user đã đăng ký bằng credentials (có password)
          // Nếu user đã đăng ký bằng OAuth khác, không cho phép link
          if (existingUser.password) {
            // User đã đăng ký bằng email/password, cho phép link OAuth account
            return true;
          } else {
            // User đã đăng ký bằng OAuth khác, không cho phép link account OAuth mới
            // Trả về false để NextAuth throw AccessDenied error
            return false;
          }
        }
      }

      return true;
    },

    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.username = token.username as string | null | undefined;
      }

      return session;
    },

    jwt: async ({ token }) => {
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, token.sub!),
      });

      if (user) {
        token.username = user.username;
      }

      return token;
    },

    redirect: () => DEFAULT_LOGIN_REDIRECT,
  },
});

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};
