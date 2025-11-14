'use client';

import { Building2, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import TrademarkSearchView from '@/components/trademark/trademark-search-view';
import type { TrademarkSearchFormData } from '@/components/trademark/trademark-search-view';
import type { UiConsultationRoute } from '@/lib/consultation-route';
import { normalizeUiConsultationRoute } from '@/lib/consultation-route';
import { PREFECTURES } from '@/lib/constants';
import { useUser } from '@/lib/useUser';

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
  const { user, loading: userLoading } = useUser();

  const caseId = searchParams.get('caseId');
  const [consultationRoute, setConsultationRoute] = useState<
    UiConsultationRoute | undefined
  >();

  // 基本情報入力フォームの状態
  const [formData, setFormData] = useState({
    applicantType: '法人' as '法人' | '個人',
    corporateName: '',
    representativeName: '',
    individualName: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    streetAddress: '',
  });

  // 相談ルート選択
  const [selectedRoute, setSelectedRoute] = useState<
    'AI_SELF_SERVICE' | 'ATTORNEY_CONSULTATION' | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  // バリデーション: 必須項目が入力されているかチェック
  const isFormValid = useMemo(() => {
    // 法人の場合
    if (formData.applicantType === '法人') {
      if (!formData.corporateName.trim() || !formData.representativeName.trim()) {
        return false;
      }
    } else {
      // 個人の場合
      if (!formData.individualName.trim()) {
        return false;
      }
    }

    // 住所の必須チェック
    if (
      !formData.postalCode.trim() ||
      !formData.prefecture.trim() ||
      !formData.city.trim() ||
      !formData.streetAddress.trim()
    ) {
      return false;
    }

    return true;
  }, [formData]);

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

  // 住所自動入力処理
  const handleAddressAutoFill = async () => {
    const postalCode = formData.postalCode.replace(/[^0-9]/g, '');
    if (postalCode.length !== 7) {
      alert('郵便番号は7桁で入力してください');
      return;
    }

    try {
      const response = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
      );
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        setFormData((prev) => ({
          ...prev,
          prefecture: result.address1 || '',
          city: result.address2 || '',
          streetAddress: result.address3 || '',
        }));
      } else {
        alert('郵便番号が見つかりませんでした');
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      alert('住所の取得に失敗しました');
    }
  };

  // Case IDがある場合は基本情報入力画面を表示
  if (caseId) {
    if (userLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">読み込み中...</span>
        </div>
      );
    }

    if (!user) {
      router.push('/login');
      return null;
    }

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#8EBA43]/5 to-white dark:from-[#2A3132] dark:to-[#1a1f20] pt-[73px] py-12 px-4">
        <div className="max-w-4xl mx-auto w-full">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>

          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
              基本情報入力
            </h1>
            <p className="text-lg text-[#2A3132]/70 dark:text-[#8EBA43]/70">
              出願に必要な基本情報を入力してください
            </p>
          </div>

          <div className="rounded-3xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
                出願人情報
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-base font-semibold mb-3 block text-[#2A3132] dark:text-[#8EBA43]">
                  種別
                </p>
                <RadioGroup
                  value={formData.applicantType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      applicantType: value as '法人' | '個人',
                    })
                  }
                  className="mt-3 grid-flow-col auto-cols-max items-center gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="法人" id="corporate" />
                    <Label htmlFor="corporate">法人</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="個人" id="individual" />
                    <Label htmlFor="individual">個人/個人事業主</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.applicantType === '法人' ? (
                <>
                  <div>
                    <Label htmlFor="corp-name">
                      法人名 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="corp-name"
                      value={formData.corporateName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateName: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rep-name">
                      担当者名 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="rep-name"
                      value={formData.representativeName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          representativeName: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="ind-name">
                    出願人名 <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="ind-name"
                    value={formData.individualName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        individualName: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="phone">
                  {formData.applicantType === '法人'
                    ? '担当者の連絡先電話番号'
                    : '出願人電話番号'}
                </Label>
                <input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                  出願人の住所
                </h3>
                <div className="flex gap-3 items-end">
                  <div className="w-48">
                    <Label htmlFor="postal-code">
                      郵便番号 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="postal-code"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="1234567"
                      maxLength={7}
                      className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddressAutoFill}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    住所を自動入力
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="prefecture">
                      都道府県 <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="prefecture"
                      value={formData.prefecture}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prefecture: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                      required
                    >
                      <option value="">選択してください</option>
                      {PREFECTURES.map((pref) => (
                        <option key={pref} value={pref}>
                          {pref}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="city">
                      市区町村 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          city: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street-address">
                    丁目・番地・建物名・部屋番号{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="street-address"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        streetAddress: e.target.value,
                      })
                    }
                    placeholder="1-2-3 ○○ビル 405号室"
                    className="mt-2 w-full rounded-lg border border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-2.5 transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] text-[#2A3132] dark:text-[#8EBA43]"
                    required
                  />
                </div>
              </div>

              {/* 相談ルート選択 */}
              <div className="mt-8 pt-8 border-t border-[#8EBA43]/20">
                <h3 className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43] mb-4">
                  相談ルートを選択
                </h3>
                <RadioGroup
                  value={selectedRoute || ''}
                  onValueChange={(value) =>
                    setSelectedRoute(
                      value as 'AI_SELF_SERVICE' | 'ATTORNEY_CONSULTATION'
                    )
                  }
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-[#8EBA43]/20 hover:border-[#4d9731]/40 transition-all">
                    <RadioGroupItem
                      value="AI_SELF_SERVICE"
                      id="simple-route"
                      disabled={!isFormValid}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="simple-route"
                        className={`text-base font-semibold cursor-pointer ${
                          !isFormValid
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#2A3132] dark:text-[#8EBA43]'
                        }`}
                      >
                        簡易ルート
                      </Label>
                      <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                        AIを活用した簡易な調査・願書作成
                      </p>
                      {!isFormValid && (
                        <p className="text-xs text-red-500 mt-1">
                          必須項目を入力してください
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-[#8EBA43]/20 hover:border-[#4d9731]/40 transition-all">
                    <RadioGroupItem
                      value="ATTORNEY_CONSULTATION"
                      id="attorney-route"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="attorney-route"
                        className="text-base font-semibold cursor-pointer text-[#2A3132] dark:text-[#8EBA43]"
                      >
                        弁理士相談型
                      </Label>
                      <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                        弁理士が直接対応・詳細調査
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={async () => {
                    if (!isFormValid) {
                      alert('必須項目を入力してください');
                      return;
                    }

                    if (!selectedRoute) {
                      alert('相談ルートを選択してください');
                      return;
                    }

                    setIsSaving(true);

                    try {
                      // 出願人情報を構築
                      const applicant =
                        formData.applicantType === '法人'
                          ? formData.corporateName
                          : formData.individualName;

                      // 住所を結合
                      const address = [
                        `〒${formData.postalCode}`,
                        formData.prefecture,
                        formData.city,
                        formData.streetAddress,
                      ]
                        .filter(Boolean)
                        .join(' ');

                      // clientIntake情報を構築
                      const clientIntake = {
                        applicantType:
                          formData.applicantType === '法人'
                            ? 'CORPORATE'
                            : 'INDIVIDUAL',
                        corporateName:
                          formData.applicantType === '法人'
                            ? formData.corporateName
                            : '',
                        representativeName:
                          formData.applicantType === '法人'
                            ? formData.representativeName
                            : '',
                        individualName:
                          formData.applicantType === '個人'
                            ? formData.individualName
                            : '',
                        phone: formData.phone,
                        postalCode: formData.postalCode,
                        prefecture: formData.prefecture,
                        city: formData.city,
                        addressLine: formData.streetAddress,
                        address,
                      };

                      // ステータスを決定
                      const status =
                        selectedRoute === 'AI_SELF_SERVICE'
                          ? 'PRELIMINARY_RESEARCH_IN_PROGRESS'
                          : 'TRADEMARK_REGISTERED';

                      // Case更新APIを呼び出し
                      const response = await fetch(`/api/cases/${caseId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          applicant,
                          clientIntake,
                          consultationRoute: selectedRoute,
                          status,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => null);
                        const message =
                          errorData?.error?.message ??
                          '基本情報の保存に失敗しました';
                        alert(message);
                        return;
                      }

                      // ルートに応じて遷移
                      if (selectedRoute === 'AI_SELF_SERVICE') {
                        // 簡易ルート: 商標の詳細ページに遷移
                        router.push(`/client/cases/${caseId}`);
                      } else {
                        // 弁理士相談型: 支払い画面に遷移
                        router.push(`/client/cases/${caseId}/payment`);
                      }
                    } catch (error) {
                      console.error('Failed to save case:', error);
                      alert('基本情報の保存中にエラーが発生しました');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={!isFormValid || !selectedRoute || isSaving}
                  className="bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存して次へ'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case IDがない場合は検索画面を表示
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
