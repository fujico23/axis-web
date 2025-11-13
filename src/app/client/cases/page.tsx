"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/useUser";

type SortField = "title" | "status" | "updatedAt";
type SortDirection = "asc" | "desc";

enum MarkTypeFilter {
  ALL = "all",
  TEXT = "TEXT",
  LOGO = "LOGO",
}

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

export default function ClientCasesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [markTypeFilter, setMarkTypeFilter] = useState<MarkTypeFilter>(
    MarkTypeFilter.ALL,
  );
  const [classFilter, setClassFilter] = useState("");
  const [sortField, setSortField] = useState<SortField | null>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Case一覧を取得
  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchCases = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (stageFilter !== "all") {
          params.set("status", stageFilter);
        }
        if (markTypeFilter !== MarkTypeFilter.ALL) {
          params.set("trademarkType", markTypeFilter);
        }
        if (classFilter) {
          params.set("classes", classFilter);
        }
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (sortField) {
          params.set("sortBy", sortField);
          params.set("sortOrder", sortDirection);
        }

        const response = await fetch(`/api/cases?${params.toString()}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCases(data.data.cases || []);
          }
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
    classFilter,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  // ステータスを日本語ラベルに変換
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      DRAFT: "下書き",
      TRADEMARK_REGISTERED: "新規商標済",
      PRELIMINARY_RESEARCH_IN_PROGRESS: "事前調査中",
      RESEARCH_RESULT_SHARED: "調査結果共有",
      PREPARING_APPLICATION: "出願準備中",
      APPLICATION_CONFIRMED: "願書確定",
      APPLICATION_SUBMITTED: "出願受付済",
      UNDER_EXAMINATION: "審査中",
      OA_RECEIVED: "OA受領",
      RESPONDING_TO_OA: "中間対応中",
      FINAL_RESULT_RECEIVED: "最終結果受領",
      PAYING_REGISTRATION_FEE: "登録料納付中",
      REGISTRATION_COMPLETED: "登録完了",
      AWAITING_RENEWAL: "更新待ち",
      IN_DISPUTE: "係争中",
      REJECTED: "拒絶確定",
      ABANDONED: "放棄",
    };
    return statusMap[status] || status;
  };

  // 商標タイプを日本語に変換
  const getTrademarkTypeLabel = (type: string): string => {
    return type === "TEXT" ? "文字" : type === "LOGO" ? "図形" : type;
  };

  const filteredAndSortedCases = useMemo(() => {
    return cases;
  }, [cases]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-border bg-card/80">
        <h2 className="text-lg font-semibold mb-4">検索</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              placeholder="整理番号、商標名で検索..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

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
              onChange={(event) => setStageFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
              onChange={(event) =>
                setMarkTypeFilter(event.target.value as MarkTypeFilter)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={MarkTypeFilter.ALL}>すべて</option>
              <option value={MarkTypeFilter.TEXT}>文字</option>
              <option value={MarkTypeFilter.LOGO}>図形</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="classFilter"
              className="text-sm font-medium text-muted-foreground"
            >
              区分
            </label>
            <Input
              id="classFilter"
              type="text"
              placeholder="例: 9, 42"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredAndSortedCases.length} 件の案件が見つかりました
          {(searchQuery ||
            stageFilter !== "all" ||
            markTypeFilter !== MarkTypeFilter.ALL ||
            classFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStageFilter("all");
                setMarkTypeFilter(MarkTypeFilter.ALL);
                setClassFilter("");
              }}
              className="ml-2 text-primary hover:underline"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80">
        <div className="overflow-x-auto">
          <table className="w-full table-auto divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {/* 通知列 */}
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  整理番号
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  区分
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    ステータス
                    {sortField === "status" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  詳細
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    読み込み中...
                  </td>
                </tr>
              ) : filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    まだ商標の登録はありません
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-2 py-4">
                      {/* 通知アイコン（後で実装） */}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      {caseItem.caseNumber}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/client/cases/${caseItem.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {caseItem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {caseItem.classes.map((classCode) => (
                          <span
                            key={classCode}
                            className="px-2 py-0.5 bg-muted rounded text-xs"
                          >
                            第{classCode}類
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {getStatusLabel(caseItem.status)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/client/cases/${caseItem.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href="/client/cases/new"
        className="fixed bottom-8 right-8 z-50 group"
      >
        <div className="w-20 h-20 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#FD9731] to-[#f57c00] shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:from-[#f57c00] hover:to-[#FD9731]">
          <Plus className="w-8 h-8 text-white font-bold" strokeWidth={3} />
          <span className="text-white font-bold text-xs mt-1">新規商標</span>
        </div>
      </Link>
    </div>
  );
}

