"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { User, Plus, Mail, ChevronDown, LogOut, UserCircle, Shield, FileText } from "lucide-react";
import { useUser } from "@/lib/useUser";

const getSidebarItems = (userRole: string | undefined) => {
  const items = [
    {
      label: "商標一覧",
      href: "/client/cases",
      icon: FileText,
    },
  ];

  // ADMIN, INTERNAL_STAFF, ATTORNEY の場合は管理者ポータルへのリンクを追加
  if (
    userRole === "ADMIN" ||
    userRole === "INTERNAL_STAFF" ||
    userRole === "ATTORNEY"
  ) {
    items.push({
      label: "管理者ポータル",
      href: "/admin/cases",
      icon: Shield,
    });
  }

  return items;
};

export default function AdminCasesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ユーザーの権限に基づいてサイドバーアイテムを生成
  const sidebarItems = useMemo(() => getSidebarItems(user?.role), [user?.role]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowAccountInfo(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // ログアウト成功後、ログインページへリダイレクト
        router.push("/login");
        router.refresh();
      } else {
        console.error("Logout failed");
        alert("ログアウトに失敗しました");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("ログアウト中にエラーが発生しました");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-gradient-to-r from-[#4d9731] to-[#8EBA43] dark:from-[#4d9731] dark:to-[#2A3132] backdrop-blur shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/client"
            className="font-bold text-xl tracking-tight text-white hover:text-white/90 transition-all duration-300"
          >
            スマート商標.com
          </Link>
          <div className="flex items-center gap-4">
            {/* 新規商標リンク */}
            <Link
              href="/client/cases/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#FD9731] to-[#f57c00] hover:from-[#f57c00] hover:to-[#FD9731] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              新規商標
            </Link>
            
            {/* ユーザーメニュー */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                type="button"
              >
                {/* アカウント名 */}
                <div className="text-sm font-medium text-white/90 flex items-center gap-1">
                  {loading ? "読込中..." : user?.name || "ゲスト"}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                </div>
                {/* ユーザーアイコン */}
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30 hover:ring-white/50 transition-all duration-300">
                  <User className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </button>

              {/* ドロップダウンメニュー */}
              {isDropdownOpen && user && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white dark:bg-[#2A3132] shadow-xl border border-[#8EBA43]/20 overflow-hidden z-50">
                  {showAccountInfo ? (
                    // アカウント情報表示
                    <>
                      <div className="p-4 bg-gradient-to-br from-[#8EBA43]/10 to-[#4d9731]/5 border-b border-[#8EBA43]/20">
                        <div className="text-sm font-semibold text-[#2A3132] dark:text-white mb-1">
                          アカウント情報
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#8EBA43]/5">
                          <User className="w-5 h-5 text-[#8EBA43] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground mb-1">お名前</div>
                            <div className="font-semibold text-foreground text-sm break-words">
                              {user.name || "未設定"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#8EBA43]/5">
                          <Mail className="w-5 h-5 text-[#8EBA43] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground mb-1">メールアドレス</div>
                            <div className="font-semibold text-foreground text-sm break-words">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAccountInfo(false)}
                          className="w-full mt-2 px-4 py-2 text-sm text-[#2A3132] dark:text-white hover:bg-[#8EBA43]/10 rounded-lg transition-colors"
                          type="button"
                        >
                          戻る
                        </button>
                      </div>
                    </>
                  ) : (
                    // メニューリスト
                    <div className="py-2">
                      <button
                        onClick={() => setShowAccountInfo(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#2A3132] dark:text-white hover:bg-[#8EBA43]/10 transition-colors"
                        type="button"
                      >
                        <UserCircle className="w-5 h-5 text-[#8EBA43]" />
                        <span>アカウント情報</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#2A3132] dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        <LogOut className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">
                          {isLoggingOut ? "ログアウト中..." : "ログアウト"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex bg-gradient-to-br from-[#8EBA43]/5 via-white to-[#4d9731]/5 dark:from-[#2A3132] dark:from-[#2A3132]/95 dark:to-[#4d9731]/10 pt-[73px]">
        {/* サイドバー */}
        <aside className="fixed top-[73px] left-0 bottom-0 w-56 border-r border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white/80 dark:bg-[#2A3132]/80 backdrop-blur overflow-y-auto">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/client/cases" &&
                  pathname?.startsWith("/client/cases/") &&
                  pathname !== "/client/cases/new") ||
                (item.href === "/admin/cases" &&
                  pathname?.startsWith("/admin/cases/"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white shadow-md"
                      : "text-[#2A3132]/70 dark:text-[#8EBA43]/70 hover:bg-[#8EBA43]/10 dark:hover:bg-[#4d9731]/20 hover:text-[#4d9731] dark:hover:text-[#8EBA43]",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 ml-56">
          <div className="mx-auto w-full max-w-7xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

