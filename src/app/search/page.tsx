"use client";

import { useRouter } from "next/navigation";
import TrademarkSearchView from "@/components/trademark/trademark-search-view";

export default function TrademarkSearchPage() {
  const router = useRouter();

  return (
    <TrademarkSearchView
      onSubmit={(params, formData) => {
        // 検索結果ページに遷移（将来的にAPIに置き換える）
        params.set("next", "/client/cases/new");
        router.push(`/search/results?${params.toString()}`);
      }}
      showHeader={false}
    />
  );
}

