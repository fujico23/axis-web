import { APIError } from "better-auth";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ErrorCode = "AUTH_001" | "AUTH_003" | "AUTH_004" | "AUTH_007" | "AUTH_013";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_001: "有効なメールアドレスを入力してください",
  AUTH_003: "必須項目を入力してください",
  AUTH_004: "メールアドレスまたはパスワードが正しくありません",
  AUTH_007: "このアカウントは無効化されています",
  AUTH_013: "サーバーエラーが発生しました。しばらく待ってから再度お試しください",
};

const ERROR_STATUS: Record<ErrorCode, number> = {
  AUTH_001: 400,
  AUTH_003: 400,
  AUTH_004: 401,
  AUTH_007: 403,
  AUTH_013: 500,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const apiErrorCodeMap: Record<
  string,
  { code: ErrorCode; status?: number }
> = {
  INVALID_EMAIL_OR_PASSWORD: { code: "AUTH_004", status: 401 },
  CREDENTIAL_ACCOUNT_NOT_FOUND: { code: "AUTH_004", status: 401 },
  ACCOUNT_NOT_FOUND: { code: "AUTH_004", status: 401 },
  EMAIL_NOT_VERIFIED: { code: "AUTH_007", status: 403 },
};

function errorResponse(code: ErrorCode, statusOverride?: number) {
  const status = statusOverride ?? ERROR_STATUS[code] ?? 500;
  return NextResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

function formatCookieDuration(
  cookie: string,
  maxAgeSeconds: number,
  expiresAt: Date,
) {
  let updated = cookie;
  if (Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0) {
    if (/Max-Age=/i.test(updated)) {
      updated = updated.replace(/Max-Age=\d+/gi, `Max-Age=${maxAgeSeconds}`);
    } else {
      updated = `${updated}; Max-Age=${maxAgeSeconds}`;
    }
  }
  const expiresValue = expiresAt.toUTCString();
  if (/Expires=/i.test(updated)) {
    updated = updated.replace(/Expires=[^;]+/gi, `Expires=${expiresValue}`);
  } else {
    updated = `${updated}; Expires=${expiresValue}`;
  }
  return updated;
}

export async function POST(request: Request) {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return errorResponse("AUTH_003");
  }

  if (!parsedBody || typeof parsedBody !== "object") {
    return errorResponse("AUTH_003");
  }

  const { email, password, rememberMe } = parsedBody as {
    email?: unknown;
    password?: unknown;
    rememberMe?: unknown;
  };

  if (typeof email !== "string" || email.trim() === "") {
    return errorResponse("AUTH_003");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return errorResponse("AUTH_001");
  }

  if (typeof password !== "string" || password.length === 0) {
    return errorResponse("AUTH_003");
  }

  if (rememberMe !== undefined && typeof rememberMe !== "boolean") {
    return errorResponse("AUTH_003");
  }

  const persistentLogin = rememberMe === true;
  const sessionDurationDays = persistentLogin ? 90 : 30;
  const sessionDurationSeconds = sessionDurationDays * 24 * 60 * 60;

  try {
    const signInResult = await auth.api.signInEmail({
      body: {
        email: normalizedEmail,
        password,
      },
      headers: request.headers,
      request,
      returnHeaders: true,
    });

    const sessionToken = signInResult.response.token;
    const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
    const session = await prisma.session.update({
      where: { token: sessionToken },
      data: { expiresAt },
      select: { expiresAt: true },
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: signInResult.response.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    const roleResult = await prisma.$queryRaw<
      Array<{ role: string | null }>
    >`SELECT role FROM "users" WHERE id = ${signInResult.response.user.id} LIMIT 1`;

    const nowIso = new Date().toISOString();
    const resolvedRole = roleResult[0]?.role?.toLowerCase() ?? "client";
    const responsePayload = {
      user: {
        id: userRecord?.id ?? signInResult.response.user.id,
        name: userRecord?.name ?? signInResult.response.user.name ?? "",
        email: userRecord?.email ?? signInResult.response.user.email,
        emailVerified:
          userRecord?.emailVerified ?? signInResult.response.user.emailVerified,
        role: resolvedRole,
        lastLoginAt: nowIso,
      },
      session: {
        token: sessionToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    };

    const response = NextResponse.json(responsePayload, { status: 200 });
    const cookies: string[] = [];
    signInResult.headers?.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        cookies.push(value);
      }
    });

    if (cookies.length > 0) {
      cookies
        .map((cookie) => formatCookieDuration(cookie, sessionDurationSeconds, expiresAt))
        .forEach((cookie) => {
          response.headers.append("Set-Cookie", cookie);
        });
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      const apiCode = error.body?.code;
      if (apiCode && apiErrorCodeMap[apiCode]) {
        const mapped = apiErrorCodeMap[apiCode];
        return errorResponse(mapped.code, mapped.status ?? error.statusCode);
      }
      if (error.statusCode === 401) {
        return errorResponse("AUTH_004", 401);
      }
      if (error.statusCode === 403) {
        return errorResponse("AUTH_007", 403);
      }
    }

    return errorResponse("AUTH_013");
  }
}

