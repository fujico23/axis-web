import { randomUUID } from "node:crypto";
import type { Session } from "better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-in-production",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 本番環境ではtrueに推奨
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30日間
    updateAge: 60 * 60 * 24, // 1日ごとに更新
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1分間
    max: 100, // 最大100リクエスト
  },
  twoFactor: {
    enabled: true, // 2FAを有効化（任意）
  },
  advanced: {
    generateId: () => randomUUID(),
    // TLS1.2以上を強制（本番環境でHTTPSを使用することで実現）
    // cookiePrefix: "__Secure-", // HTTPS環境でのみ有効
  },
});

/**
 * セッションからユーザーがADMIN権限を持っているか確認
 */
export async function isAdmin(
  sessionData: { session: Session; user: any } | null,
): Promise<boolean> {
  if (!sessionData?.session?.userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionData.session.userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

