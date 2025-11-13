"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  
  // TODO: 将来的にAPIに置き換える
  // 現在はモック: 検索結果の表示は後で実装
  
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43] mb-4">
          検索結果
        </h1>
        <p className="text-muted-foreground">
          検索結果の表示機能は後で実装予定です
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          検索パラメータ: {searchParams.toString()}
        </p>
      </div>
    </div>
  );
}

function SearchResultsFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="text-sm text-muted-foreground">読み込み中...</span>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchResultsFallback />}>
      <SearchResultsContent />
    </Suspense>
  );
}

