'use client';

import { ArrowLeft, LogIn, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NICE_CLASS_OPTIONS } from '@/lib/trademark-classes';
import {
  BASE_APPLICATION_PRICE,
  ATTORNEY_CONSULTATION_FEE,
  ATTORNEY_TOTAL_PRICE,
  FIRST_CLASS_FEE,
  ADDITIONAL_CLASS_FEE,
} from '@/lib/pricing';
import { normalizeUiConsultationRoute } from '@/lib/consultation-route';
import { useUser } from '@/lib/useUser';

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  const trademark = searchParams.get('standard_character') || '';
  const yomi = searchParams.get('yomi') || '';
  const selectedClassesParam = searchParams.get('selected_simgroup_ids') || '';
  const selectedClasses = selectedClassesParam
    ? selectedClassesParam.split(',').filter((c) => c.trim())
    : [];
  const trademarkTypeParam = searchParams.get('type');
  const trademarkImageParam = searchParams.get('trademark_image') || '';
  const logoHasTextParam = searchParams.get('logo_has_text');
  const nextPath = searchParams.get('next');
  const isLogoTrademark = trademarkTypeParam === 'ロゴ・図形商標';
  const consultationRouteParam = searchParams.get('consultation_route');
  const consultationRoute = normalizeUiConsultationRoute(
    consultationRouteParam
  );
  const isAttorneyConsultation = consultationRoute === 'attorney_consultation';
  
  // 区分選択関連のパラメータ
  const classCategoryParam = searchParams.get('class_category') || '';
  const classCategoryDetailParam = searchParams.get('class_category_detail') || '';
  const productServiceParam = searchParams.get('product_service') || '';

  // 価格計算
  const applicationFee = isAttorneyConsultation
    ? ATTORNEY_TOTAL_PRICE
    : BASE_APPLICATION_PRICE;
  const stampFee = FIRST_CLASS_FEE;
  const additionalClassesFee =
    selectedClasses.length > 1
      ? (selectedClasses.length - 1) * ADDITIONAL_CLASS_FEE
      : 0;
  const totalPrice = applicationFee + stampFee + additionalClassesFee;

  // Case作成処理
  const handleCreateCase = async () => {
    if (userLoading) {
      return;
    }

    if (!user) {
      // 未ログインの場合はログインモーダルを表示
      setShowLoginDialog(true);
      return;
    }

    setIsCreatingCase(true);

    try {
      // 商標情報を構築
      const trademarkDetails: Record<string, string> = {};
      if (isLogoTrademark) {
        if (trademarkImageParam) {
          trademarkDetails.imageData = trademarkImageParam;
        }
        if (logoHasTextParam === 'あり' && trademark) {
          trademarkDetails.logoText = trademark;
          if (yomi) {
            trademarkDetails.logoTextReading = yomi;
          }
        }
      } else {
        if (trademark) {
          trademarkDetails.text = trademark;
        }
        if (yomi) {
          trademarkDetails.reading = yomi;
        }
      }

      // タイトルを生成
      const title = trademark || (isLogoTrademark ? 'ロゴ・図形商標' : '新規商標');

      // 出願人（仮の値、後で基本情報入力画面で更新）
      const applicant = '未入力';

      // 区分選択情報を構築（区分コードのみの場合、detailsは空配列）
      const classSelections = selectedClasses.map((classCode) => ({
        classCode,
        details: [],
      }));

      // Case作成APIを呼び出し
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          trademarkType: isLogoTrademark ? 'LOGO' : 'TEXT',
          applicant,
          classes: selectedClasses,
          trademarkDetails,
          classSelections: classSelections.length > 0 ? classSelections : undefined,
          classCategory: classCategoryParam || undefined,
          productService: productServiceParam || undefined,
          consultationRoute: isAttorneyConsultation
            ? 'ATTORNEY_CONSULTATION'
            : 'AI_SELF_SERVICE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ?? '案件の作成に失敗しました';
        alert(message);
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        // 基本情報入力画面に遷移（Case IDをクエリパラメータで渡す）
        const targetPath = '/client/cases/new';
        const url = new URL(targetPath, window.location.origin);
        url.searchParams.set('caseId', result.data.id);

        // 検索パラメータも引き継ぐ
        if (trademark) {
          url.searchParams.set('standard_character', trademark);
        }
        if (yomi) {
          url.searchParams.set('yomi', yomi);
        }
        if (selectedClasses.length > 0) {
          url.searchParams.set(
            'selected_simgroup_ids',
            selectedClasses.join(',')
          );
        }
        if (trademarkTypeParam) {
          url.searchParams.set('type', trademarkTypeParam);
        }
        if (
          logoHasTextParam === 'あり' ||
          logoHasTextParam === 'なし'
        ) {
          url.searchParams.set('logo_has_text', logoHasTextParam);
        }
        if (isLogoTrademark && trademarkImageParam) {
          url.searchParams.set('trademark_image', trademarkImageParam);
        }
        if (consultationRouteParam) {
          url.searchParams.set('consultation_route', consultationRouteParam);
        }

        router.push(`${url.pathname}${url.search}`);
      }
    } catch (error) {
      console.error('Failed to create case:', error);
      alert('案件の作成中にエラーが発生しました');
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleLoginRedirect = () => {
    // 現在のページURLを保存してログインページへ遷移
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインコンテンツ */}
      <div className="flex-1 bg-gradient-to-b from-[#8EBA43]/5 to-white dark:from-[#2A3132] dark:to-[#1a1f20] pt-[73px] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              検索条件を変更
            </Button>
            <h1 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
              類似商標検索結果
            </h1>
          </div>

          {/* 2カラムレイアウト */}
          <div className="flex gap-8">
            {/* 左側：検索結果とお見積もり */}
            <div className="flex-1 space-y-8">
              {/* 検索結果の表示は後で実装予定 */}
              <div className="text-center py-12 rounded-2xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] p-8">
                <p className="text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                  検索結果の表示機能は後で実装予定です
                </p>
              </div>

              {/* お見積もりカード（左側下部） */}
              <div className="rounded-2xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] overflow-hidden shadow-lg">
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-[#4d9731] to-[#8EBA43] p-5">
                  <h2 className="text-xl font-bold text-white">お見積もり</h2>
                </div>

                {/* 見積もり内容 */}
                <div className="p-6 space-y-6">
                  {/* 商標情報 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                        商標
                      </span>
                      <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        {trademark || (isLogoTrademark ? 'ロゴ・図形商標' : '')}
                      </span>
                    </div>
                    {isLogoTrademark && trademarkImageParam && (
                      <div>
                        <p className="text-xs text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                          アップロードした画像
                        </p>
                        <div className="rounded-lg border border-dashed border-[#8EBA43]/40 bg-white dark:bg-[#2A3132] p-3 flex items-center justify-center">
                          <img
                            src={trademarkImageParam}
                            alt="アップロードされた商標ロゴのプレビュー"
                            className="max-h-40 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                        区分数
                      </span>
                      <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        {selectedClasses.length}区分
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#8EBA43]/20" />

                  {/* 料金詳細 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2A3132]/80 dark:text-[#8EBA43]/80">
                        出願手数料
                      </span>
                      <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        ¥{BASE_APPLICATION_PRICE.toLocaleString()}
                      </span>
                    </div>
                    {isAttorneyConsultation && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#2A3132]/80 dark:text-[#8EBA43]/80">
                          弁理士相談料
                        </span>
                        <span className="font-semibold text-[#FD9731] dark:text-[#FD9731]">
                          ¥{ATTORNEY_CONSULTATION_FEE.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2A3132]/80 dark:text-[#8EBA43]/80">
                        特許庁印紙代 (1区分)
                      </span>
                      <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        ¥{FIRST_CLASS_FEE.toLocaleString()}
                      </span>
                    </div>
                    {selectedClasses.length > 1 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#2A3132]/80 dark:text-[#8EBA43]/80">
                          追加区分 ({selectedClasses.length - 1}区分)
                        </span>
                        <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                          ¥{additionalClassesFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t-2 border-[#8EBA43]/30" />

                  {/* 合計金額 */}
                  <div className="bg-gradient-to-r from-[#8EBA43]/10 to-transparent p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[#2A3132] dark:text-[#8EBA43]">
                        合計金額
                      </span>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#4d9731] dark:text-[#8EBA43]">
                          ¥{totalPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                          (税込)
                        </div>
                      </div>
                    </div>
                    {isAttorneyConsultation && (
                      <div className="mt-2 px-3 py-2 bg-[#FD9731]/10 border border-[#FD9731]/30 rounded-lg">
                        <p className="text-xs text-[#FD9731] font-semibold">
                          弁理士相談型を選択されています
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 注意事項 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      ※ 登録査定後の登録料は別途必要です
                      <br />※ 拒絶理由通知への対応は別途ご相談となります
                    </p>
                  </div>

                  {/* 出願ボタン */}
                  <Button
                    onClick={handleCreateCase}
                    disabled={userLoading || isCreatingCase}
                    className="w-full py-4 text-base font-bold rounded-xl bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {userLoading
                      ? '読込中...'
                      : isCreatingCase
                        ? '案件を作成中...'
                        : 'この内容で出願準備を進める'}
                  </Button>
                </div>
              </div>
            </div>

            {/* 右側:検索条件カード */}
            <div className="w-96 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* 検索条件サマリー */}
                <div className="rounded-2xl border border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] overflow-hidden shadow-lg">
                  {/* ヘッダー */}
                  <div className="flex items-center gap-3 p-5 border-b border-[#8EBA43]/10 bg-gradient-to-r from-[#8EBA43]/10 to-transparent">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
                      検索条件
                    </h2>
                  </div>

                  {/* 検索条件内容 */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-1">
                        商標
                      </p>
                      <p className="text-lg font-bold text-[#2A3132] dark:text-[#8EBA43]">
                        {trademark || (isLogoTrademark ? 'ロゴ・図形商標' : '')}
                      </p>
                    </div>
                    {yomi && (
                      <div>
                        <p className="text-xs font-semibold text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-1">
                          よみがな
                        </p>
                        <p className="text-sm text-[#2A3132] dark:text-[#8EBA43]">
                          {yomi}
                        </p>
                      </div>
                    )}
                    {isLogoTrademark && trademarkImageParam && (
                      <div>
                        <p className="text-xs font-semibold text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                          アップロードした商標画像
                        </p>
                        <div className="rounded-xl border border-dashed border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 p-3 flex items-center justify-center">
                          <img
                            src={trademarkImageParam}
                            alt="商標画像プレビュー"
                            className="max-h-48 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-1">
                        選択区分
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedClasses.map((classCode) => {
                          const classOption = NICE_CLASS_OPTIONS.find(
                            (opt) => opt.code === classCode
                          );
                          return (
                            <span
                              key={classCode}
                              className="text-xs px-2 py-1 bg-[#8EBA43]/10 dark:bg-[#4d9731]/20 rounded text-[#2A3132] dark:text-[#8EBA43] font-medium"
                            >
                              第{classOption?.code || classCode}類
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ログイン促進ダイアログ */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#2A3132] dark:text-[#8EBA43]">
              <LogIn className="w-5 h-5" />
              ログインが必要です
            </DialogTitle>
            <DialogDescription className="text-[#2A3132]/70 dark:text-[#8EBA43]/70">
              商標出願を行うにはログインが必要です。
              <br />
              アカウントをお持ちでない場合は、新規登録をお願いします。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
              className="w-full sm:w-auto"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white hover:shadow-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              ログイン / 新規登録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
