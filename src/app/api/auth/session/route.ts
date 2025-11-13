import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ErrorCode = "AUTH_008" | "AUTH_013";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_008: "セッションが無効です。再度ログインしてください",
  AUTH_013: "サーバーエラーが発生しました。しばらく待ってから再度お試しください",
};

const ERROR_STATUS: Record<ErrorCode, number> = {
  AUTH_008: 401,
  AUTH_013: 500,
};

function errorResponse(code: ErrorCode) {
  return NextResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
        timestamp: new Date().toISOString(),
      },
    },
    { status: ERROR_STATUS[code] },
  );
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return errorResponse("AUTH_008");
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!userRecord) {
      return errorResponse("AUTH_008");
    }

    const roleResult = await prisma.$queryRaw<
      Array<{ role: string | null }>
    >`SELECT role FROM "users" WHERE id = ${session.user.id} LIMIT 1`;

    const resolvedRole = roleResult[0]?.role?.toLowerCase() ?? "client";

    return NextResponse.json(
      {
        user: {
          id: userRecord.id,
          name: userRecord.name ?? "",
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          role: resolvedRole,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Session fetch error:", error);
    return errorResponse("AUTH_013");
  }
}

