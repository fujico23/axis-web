"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ErrorBody = {
  error?: {
    message?: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [enableMfa, setEnableMfa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!acceptTerms) {
      setErrorMessage("利用規約とプライバシーポリシーへの同意が必要です");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("パスワードが一致しません");
      return;
    }

    if (password.length < 12) {
      setErrorMessage("パスワードは12文字以上にしてください");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          rememberMe: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ?? "アカウント登録に失敗しました";
        setErrorMessage(message);
        return;
      }

      await router.push("/client/cases");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("アカウント登録処理中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12"
      style={{ backgroundColor: "#4d9731" }}
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">スマート商標.com</h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            アカウント登録
          </h2>

          {errorMessage ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  氏名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例: 山田 太郎"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d9731] focus:border-transparent transition"
                  required
                />
              </div>

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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
                  placeholder="英数字・記号を含めて12文字以上"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d9731] focus:border-transparent transition"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="password-confirm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  パスワード（確認）
                </label>
                <input
                  id="password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="パスワードを再入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d9731] focus:border-transparent transition"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4d9731] focus:ring-[#4d9731]"
                />
                <span className="text-sm text-gray-700">
                  <Link
                    href="#"
                    className="hover:underline"
                    style={{ color: "#FD9731" }}
                  >
                    利用規約
                  </Link>
                  と
                  <Link
                    href="#"
                    className="hover:underline"
                    style={{ color: "#FD9731" }}
                  >
                    プライバシーポリシー
                  </Link>
                  に同意します
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMfa}
                  onChange={(event) => setEnableMfa(event.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4d9731] focus:ring-[#4d9731]"
                />
                <span className="text-sm text-gray-700">
                  MFA（多要素認証）を有効化する（推奨）
                </span>
              </label>
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
              {isSubmitting ? "登録処理中..." : "アカウントを登録"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちの方は{" "}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: "#FD9731" }}
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-white/70 text-xs">
          <p>※登録後はダッシュボードへ自動遷移します</p>
        </div>
      </div>
    </div>
  );
}

