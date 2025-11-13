"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
};

type UserState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (!isMounted) return;

        if (!response.ok) {
          if (response.status === 401) {
            setState({ user: null, loading: false, error: null });
            return;
          }
          const errorData = await response.json().catch(() => null);
          setState({
            user: null,
            loading: false,
            error: errorData?.error?.message ?? "ユーザー情報の取得に失敗しました",
          });
          return;
        }

        const data = await response.json();
        const normalizedUser = data.user
          ? {
              ...data.user,
              role:
                typeof data.user.role === "string"
                  ? data.user.role.toUpperCase()
                  : data.user.role,
            }
          : null;
        setState({ user: normalizedUser, loading: false, error: null });
      } catch (err) {
        if (isMounted) {
          setState({
            user: null,
            loading: false,
            error: "ネットワークエラーが発生しました",
          });
        }
      }
    }

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

