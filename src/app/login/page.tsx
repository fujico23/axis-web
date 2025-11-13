"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ErrorBody = {
  error?: {
    message?: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // リダイレクトパスをlocalStorageから取得
  useEffect(() => {
    const savedRedirectPath = localStorage.getItem("redirectAfterLogin");
    if (savedRedirectPath) {
      setRedirectPath(savedRedirectPath);
    }
  }, []);

  const parseErrorMessage = async (response: Response) => {
    try {
      const text = await response.text();
      if (!text) return null;
      const body = JSON.parse(text) as ErrorBody;
      return body.error?.message ?? null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      if (!response.ok) {
        const message =
          (await parseErrorMessage(response)) ?? "ログインに失敗しました";
        setErrorMessage(message);
        return;
      }

      // リダイレクトパスがある場合はそこへ、なければデフォルトの /client/cases へ
      const destination = redirectPath || "/client/cases";
      
      // リダイレクトパスをクリア
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
      }

      await router.push(destination);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("ログイン処理中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#4d9731" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">スマート商標.com</h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            ログイン
          </h2>

          {errorMessage ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@axis-ip.co.jp"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d9731] focus:border-transparent transition"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="パスワードを入力"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d9731] focus:border-transparent transition"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#4d9731] focus:ring-[#4d9731]"
                />
                <span className="ml-2 text-gray-600">ログイン状態を保持</span>
              </label>
              <a href="#" className="text-[#FD9731] hover:underline">
                パスワードを忘れた
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#4d9731" }}
              onMouseEnter={(event) => {
                if (!isSubmitting) event.currentTarget.style.backgroundColor = "#3d7a25";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "#4d9731";
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{" "}
              <Link
                href="/register"
                className="font-semibold hover:underline"
                style={{ color: "#FD9731" }}
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-white/70 text-xs">
          <p>※テストアカウントでログインできます</p>
        </div>
      </div>
    </div>
  );
}

