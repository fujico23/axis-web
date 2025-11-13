'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import TrademarkSearchView from '@/components/trademark/trademark-search-view';
import type { TrademarkSearchFormData } from '@/components/trademark/trademark-search-view';
import type { UiConsultationRoute } from '@/lib/consultation-route';
import { normalizeUiConsultationRoute } from '@/lib/consultation-route';

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readUnion<T extends string>(
  value: unknown,
  candidates: readonly T[],
  fallback: T
): T {
  return typeof value === 'string' && candidates.includes(value as T)
    ? (value as T)
    : fallback;
}

const TRADEMARK_TYPE_OPTIONS = ['文字商標', 'ロゴ・図形商標'] as const;
const LOGO_TEXT_OPTIONS = ['あり', 'なし'] as const;

type SearchPrefill = {
  trademark: string;
  yomi: string;
  type: '文字商標' | 'ロゴ・図形商標';
  classes: string[];
  logoHasText?: 'あり' | 'なし';
  trademarkImage?: string;
};

function NewCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [consultationRoute, setConsultationRoute] = useState<
    UiConsultationRoute | undefined
  >();

  const searchData = useMemo<SearchPrefill | null>(() => {
    const trademarkParam = searchParams.get('standard_character') ?? '';
    const trademarkImageParam = searchParams.get('trademark_image') ?? '';

    const classesParam = searchParams.get('selected_simgroup_ids') ?? '';
    const classes = classesParam
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const type = readUnion(
      searchParams.get('type'),
      TRADEMARK_TYPE_OPTIONS,
      '文字商標'
    );
    const hasTrademarkPayload =
      type === 'ロゴ・図形商標'
        ? Boolean(trademarkImageParam || trademarkParam)
        : Boolean(trademarkParam);

    if (!hasTrademarkPayload) {
      return null;
    }

    const logoParam = searchParams.get('logo_has_text');
    const logoHasText =
      typeof logoParam === 'string' &&
      LOGO_TEXT_OPTIONS.includes(
        logoParam as (typeof LOGO_TEXT_OPTIONS)[number]
      )
        ? (logoParam as 'あり' | 'なし')
        : undefined;

    return {
      trademark: trademarkParam,
      yomi: searchParams.get('yomi') ?? '',
      type,
      classes,
      logoHasText,
      trademarkImage: trademarkImageParam || undefined,
    };
  }, [searchParams]);

  const consultationRouteParamRaw = searchParams.get('consultation_route');
  const consultationRouteFromQuery = normalizeUiConsultationRoute(
    consultationRouteParamRaw
  );

  useEffect(() => {
    if (consultationRouteFromQuery) {
      setConsultationRoute(consultationRouteFromQuery);
    }
  }, [consultationRouteFromQuery]);

  const handleRouteSelection = useCallback((route: UiConsultationRoute) => {
    setConsultationRoute(route);
  }, []);

  const handleSearchSubmit = useCallback(
    (params: URLSearchParams, formData: TrademarkSearchFormData) => {
      // TODO: 将来的にAPIに置き換える
      // 現在はモック: 検索結果ページにリダイレクト（実装は後で）
      // 実際のAPI実装時は、ここで検索APIを呼び出し、結果を表示する
      params.set('next', '/client/cases/new');
      router.push(`/search/results?${params.toString()}`);
    },
    [router]
  );

  // searchDataがある場合は、フォームに反映して検索画面を表示
  const initialFormData: TrademarkSearchFormData | undefined = searchData
    ? {
        trademarkType: searchData.type,
        trademarkText:
          searchData.type === '文字商標' || searchData.logoHasText === 'あり'
            ? searchData.trademark
            : undefined,
        trademarkReading:
          searchData.type === '文字商標' || searchData.logoHasText === 'あり'
            ? searchData.yomi
            : undefined,
        trademarkImage: searchData.trademarkImage,
        logoHasText: searchData.logoHasText,
        classSelections: searchData.classes.map((code) => ({
          classCode: code,
          details: [],
        })),
      }
    : undefined;

  return (
    <TrademarkSearchView
      onSubmit={handleSearchSubmit}
      initialData={initialFormData}
      onSelectConsultationRoute={handleRouteSelection}
      selectedConsultationRoute={consultationRoute}
      showHeader={false}
    />
  );
}

function NewCaseFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="text-sm text-muted-foreground">読み込み中...</span>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={<NewCaseFallback />}>
      <NewCaseContent />
    </Suspense>
  );
}
