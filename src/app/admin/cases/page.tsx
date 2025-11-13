"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/useUser";

type SortField = "caseNumber" | "title" | "applicant" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "DRAFT", label: "下書き" },
  { value: "TRADEMARK_REGISTERED", label: "新規商標済" },
  { value: "PRELIMINARY_RESEARCH_IN_PROGRESS", label: "事前調査中" },
  { value: "RESEARCH_RESULT_SHARED", label: "調査結果共有" },
  { value: "PREPARING_APPLICATION", label: "出願準備中" },
  { value: "APPLICATION_CONFIRMED", label: "願書確定" },
  { value: "APPLICATION_SUBMITTED", label: "出願受付済" },
  { value: "UNDER_EXAMINATION", label: "審査中" },
  { value: "OA_RECEIVED", label: "OA受領" },
  { value: "RESPONDING_TO_OA", label: "中間対応中" },
  { value: "FINAL_RESULT_RECEIVED", label: "最終結果受領" },
  { value: "PAYING_REGISTRATION_FEE", label: "登録料納付中" },
  { value: "REGISTRATION_COMPLETED", label: "登録完了" },
  { value: "AWAITING_RENEWAL", label: "更新待ち" },
  { value: "IN_DISPUTE", label: "係争中" },
  { value: "REJECTED", label: "拒絶確定" },
  { value: "ABANDONED", label: "放棄" },
];

type CaseItem = {
  id: string;
  caseNumber: string;
  title: string;
  trademarkType: string;
  status: string;
  classes: string[];
  applicant: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateIso));
}

export default function AdminCasesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [markTypeFilter, setMarkTypeFilter] = useState<string>("all");

  // ソート状態
  const [sortField, setSortField] = useState<SortField | null>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 認証チェックと権限チェック
  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // 管理者権限チェック（ADMIN, INTERNAL_STAFF, ATTORNEY のみアクセス可能）
    if (
      user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY"
    ) {
      router.push("/client/cases");
      return;
    }
  }, [user, userLoading, router]);

  // Case一覧を取得
  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    // 権限チェック
    if (
      user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY"
    ) {
      return;
    }

    const fetchCases = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (stageFilter !== "all") {
          params.set("status", stageFilter);
        }
        if (markTypeFilter !== "all") {
          params.set("trademarkType", markTypeFilter);
        }
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (sortField) {
          params.set("sortBy", sortField);
          params.set("sortOrder", sortDirection);
        }

        const response = await fetch(`/api/admin/cases?${params.toString()}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCases(data.data.cases || []);
          }
        } else if (response.status === 403) {
          // 権限がない場合はクライアント画面にリダイレクト
          router.push("/client/cases");
        }
      } catch (error) {
        console.error("Failed to fetch cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [
    user,
    userLoading,
    router,
    stageFilter,
    markTypeFilter,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  // ソートハンドラー
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 新しいフィールドの場合は昇順から開始
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // フィルタリング&ソートされた案件リスト
  const filteredAndSortedCases = useMemo(() => {
    // API側でフィルタリングとソートが行われているので、そのまま返す
    return cases;
  }, [cases]);

  const dateFormatter = (value: string) => formatDate(value);

  // ローディング中または権限チェック中
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 権限がない場合は何も表示しない（リダイレクト処理中）
  if (
    !user ||
    (user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY")
  ) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 検索セクション */}
      <div className="p-6 rounded-2xl border border-border bg-card/80">
        <h2 className="text-lg font-semibold mb-4">検索</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 検索入力 */}
          <div className="space-y-2">
            <label
              htmlFor="search"
              className="text-sm font-medium text-muted-foreground"
            >
              キーワード検索
            </label>
            <Input
              id="search"
              type="text"
              placeholder="整理番号、商標名、出願人で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* ステージフィルター */}
          <div className="space-y-2">
            <label
              htmlFor="stage"
              className="text-sm font-medium text-muted-foreground"
            >
              ステージ
            </label>
            <select
              id="stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 商標タイプフィルター */}
          <div className="space-y-2">
            <label
              htmlFor="markType"
              className="text-sm font-medium text-muted-foreground"
            >
              商標タイプ
            </label>
            <select
              id="markType"
              value={markTypeFilter}
              onChange={(e) => setMarkTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">すべて</option>
              <option value="TEXT">文字</option>
              <option value="LOGO">図形</option>
            </select>
          </div>
        </div>

        {/* 検索結果サマリー */}
        <div className="mt-4 text-sm text-muted-foreground">
          {filteredAndSortedCases.length} 件の案件が見つかりました
          {(searchQuery ||
            stageFilter !== "all" ||
            markTypeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStageFilter("all");
                setMarkTypeFilter("all");
              }}
              className="ml-2 text-primary hover:underline"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      </div>

      {/* 案件リストテーブル */}
      <div className="rounded-2xl border border-border bg-card/80">
        <div className="overflow-x-auto">
          <table className="w-full table-auto divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {/* 通知列 */}
                </th>
                <th
                  className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("caseNumber")}
                >
                  <div className="flex items-center gap-1">
                    整理番号
                    {sortField === "caseNumber" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    商標名
                    {sortField === "title" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("applicant")}
                >
                  <div className="flex items-center gap-1">
                    出願人
                    {sortField === "applicant" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1">
                    作成日
                    {sortField === "createdAt" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-1">
                    更新日
                    {sortField === "updatedAt" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  案件詳細
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {cases.length === 0 &&
                    searchQuery === "" &&
                    stageFilter === "all" &&
                    markTypeFilter === "all"
                      ? "まだ案件が登録されていません"
                      : "条件に一致する案件が見つかりませんでした"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((item) => (
                  <tr key={item.id} className="bg-background/60 hover:bg-muted/50 transition-colors">
                    <td className="whitespace-nowrap px-2 py-3 text-sm text-center">
                      {/* 通知アイコン（後で実装） */}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      {item.caseNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                      {item.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {item.applicant}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {dateFormatter(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {dateFormatter(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/cases/${item.id}`}>開く</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

