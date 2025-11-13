import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ErrorCode = "AUTH_013";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_013: "サーバーエラーが発生しました。しばらく待ってから再度お試しください",
};

const ERROR_STATUS: Record<ErrorCode, number> = {
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

export async function POST(request: Request) {
  try {
    // セッション情報を取得
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // セッショントークンを取得
    const cookies = request.headers.get("cookie");
    const sessionToken = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("better-auth.session_token="))
      ?.split("=")[1];

    // セッションが存在する場合はDBから削除
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    // better-authのサインアウト処理を実行
    await auth.api.signOut({
      headers: request.headers,
    });

    // クッキーをクリア
    const response = NextResponse.json(
      { success: true, message: "ログアウトしました" },
      { status: 200 },
    );

    // セッションクッキーを削除
    response.cookies.set("better-auth.session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("AUTH_013");
  }
}

