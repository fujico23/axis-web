"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { caseStages } from "@/lib/mock-data";

type SortField = "title" | "stageKey" | "createdAt";
type SortDirection = "asc" | "desc";

enum MarkTypeFilter {
  ALL = "all",
  TEXT = "文字",
  LOGO = "図形",
  MIXED = "複合",
}

export default function ClientCasesPage() {
  // ロジックは後で実装するため、空の配列
  const cases: never[] = [];

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [markTypeFilter, setMarkTypeFilter] = useState<MarkTypeFilter>(
    MarkTypeFilter.ALL,
  );
  const [classFilter, setClassFilter] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // ロジックは後で実装
  const filteredAndSortedCases: never[] = [];

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
              <option value="all">すべて</option>
              {caseStages.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
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
              <option value={MarkTypeFilter.MIXED}>複合</option>
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
                  onClick={() => handleSort("stageKey")}
                >
                  <div className="flex items-center gap-1">
                    ステージ
                    {sortField === "stageKey" && (
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
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  まだ商標の登録はありません
                </td>
              </tr>
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

