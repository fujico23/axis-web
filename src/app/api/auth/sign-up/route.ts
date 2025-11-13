import { APIError } from "better-auth";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateCustomerIdentifier } from "@/lib/number-generator";

type ErrorCode =
  | "AUTH_001"
  | "AUTH_002"
  | "AUTH_003"
  | "AUTH_004"
  | "AUTH_009"
  | "AUTH_013";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_001: "有効なメールアドレスを入力してください",
  AUTH_002:
    "パスワードは12文字以上で、英大文字・小文字・数字・記号を含む必要があります",
  AUTH_003: "必須項目を入力してください",
  AUTH_004: "メールアドレスまたはパスワードが正しくありません",
  AUTH_009: "このメールアドレスは既に登録されています",
  AUTH_013:
    "サーバーエラーが発生しました。しばらく待ってから再度お試しください",
};

const ERROR_STATUS: Record<ErrorCode, number> = {
  AUTH_001: 400,
  AUTH_002: 400,
  AUTH_003: 400,
  AUTH_004: 401,
  AUTH_009: 409,
  AUTH_013: 500,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

const apiErrorCodeMap: Record<
  string,
  { code: ErrorCode; status?: number }
> = {
  USER_ALREADY_EXISTS: { code: "AUTH_009", status: 409 },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: { code: "AUTH_009", status: 409 },
  PASSWORD_TOO_SHORT: { code: "AUTH_002", status: 400 },
  PASSWORD_TOO_LONG: { code: "AUTH_002", status: 400 },
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

  const { name, email, password, rememberMe } = parsedBody as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    rememberMe?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("AUTH_003");
  }

  const trimmedName = name.trim();

  if (trimmedName.length > 100) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_003",
          message: "氏名は100文字以内で入力してください",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 },
    );
  }

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

  if (!PASSWORD_PATTERN.test(password)) {
    return errorResponse("AUTH_002");
  }

  if (rememberMe !== undefined && typeof rememberMe !== "boolean") {
    return errorResponse("AUTH_003");
  }

  const persistentLogin = rememberMe === true;
  const sessionDurationDays = persistentLogin ? 90 : 30;
  const sessionDurationSeconds = sessionDurationDays * 24 * 60 * 60;

  try {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: trimmedName,
        email: normalizedEmail,
        password,
        rememberMe: persistentLogin,
      },
      headers: request.headers,
      request,
      returnHeaders: true,
    });

    const sessionToken = signUpResult.response.token;
    if (!sessionToken) {
      return errorResponse("AUTH_013");
    }

    const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
    const session = await prisma.session.update({
      where: { token: sessionToken },
      data: { expiresAt },
      select: { expiresAt: true },
    });

    await prisma.user.update({
      where: { id: signUpResult.response.user.id },
      data: { name: trimmedName },
    });

    // Clientレコードを自動作成
    const customerIdentifier = await generateCustomerIdentifier();
    
    await prisma.client.create({
      data: {
        userId: signUpResult.response.user.id,
        customerIdentifier,
      },
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: signUpResult.response.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const roleResult = await prisma.$queryRaw<
      Array<{ role: string | null }>
    >`SELECT role FROM "users" WHERE id = ${signUpResult.response.user.id} LIMIT 1`;

    const resolvedRole = roleResult[0]?.role?.toLowerCase() ?? "client";
    const responsePayload = {
      user: {
        id: userRecord?.id ?? signUpResult.response.user.id,
        name: userRecord?.name ?? signUpResult.response.user.name ?? "",
        email: userRecord?.email ?? signUpResult.response.user.email,
        emailVerified:
          userRecord?.emailVerified ?? signUpResult.response.user.emailVerified,
        createdAt: userRecord?.createdAt?.toISOString() ?? new Date().toISOString(),
        role: resolvedRole,
      },
      session: {
        token: sessionToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    };

    const response = NextResponse.json(responsePayload, { status: 201 });
    const cookies: string[] = [];
    signUpResult.headers?.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        cookies.push(value);
      }
    });

    if (cookies.length > 0) {
      cookies
        .map((cookie) =>
          formatCookieDuration(cookie, sessionDurationSeconds, expiresAt),
        )
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
    }

    return errorResponse("AUTH_013");
  }
}

