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
    signIn: async ({ user, account }) => {
      // Cho phép credentials login
      if (account?.provider === "credentials") {
        return true;
      }

      // OAuth login
      if (account && user.email) {
        // Kiểm tra xem account OAuth này đã được link với user nào chưa
        const existingAccount = await db.query.dbAccounts.findFirst({
          where: (a, { eq, and }) =>
            and(
              eq(a.provider, account.provider),
              eq(a.providerAccountId, account.providerAccountId)
            ),
        });

        // Nếu OAuth account đã tồn tại, cho phép đăng nhập
        if (existingAccount) {
          return true;
        }

        // Kiểm tra xem có user nào với email này không
        const existingUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, user.email!),
        });

        if (existingUser) {
          // User đã tồn tại với email này
          // Auto-link OAuth account mới với user hiện tại
          await db.insert(dbAccounts).values({
            userId: existingUser.id,
            type: account.type as "oauth" | "oidc" | "email" | "webauthn",
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token ?? null,
            access_token: account.access_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: account.session_state as string ?? null,
          });

          // Update user info nếu chưa có
          if (!existingUser.name || !existingUser.image) {
            await db
              .update(users)
              .set({
                name: existingUser.name || user.name,
                image: existingUser.image || user.image,
                emailVerified: existingUser.emailVerified || new Date(),
              })
              .where(eq(users.id, existingUser.id));
          }

          return true;
        }
      }

      // Cho phép tạo user mới với OAuth
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
