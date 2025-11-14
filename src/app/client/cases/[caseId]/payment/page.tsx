'use client';

import { ArrowLeft, CreditCard, Building2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ATTORNEY_CONSULTATION_FEE } from '@/lib/pricing';
import { useUser } from '@/lib/useUser';

function PaymentContent() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const caseId = params.caseId as string;
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    'CARD' | 'BANK_TRANSFER' | null
  >(null);
  const [caseData, setCaseData] = useState<{
    caseNumber: string;
    title: string;
    classes: string[];
    consultationRoute: string | null;
  } | null>(null);

  useEffect(() => {
    // Case情報を取得
    const fetchCase = async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCaseData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch case:', error);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

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

  // 弁理士相談料のみ
  const totalPrice = ATTORNEY_CONSULTATION_FEE;

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('支払い方法を選択してください');
      return;
    }

    setIsProcessing(true);

    try {
      // 仮の支払い処理
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 支払い完了後、ステータスを更新
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'PREPARING_APPLICATION',
        }),
      });

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }

      // サンクス画面に遷移
      router.push(`/client/cases/${caseId}/payment/thanks`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('支払い処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

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
            お支払い
          </h1>
          <p className="text-lg text-[#2A3132]/70 dark:text-[#8EBA43]/70">
            弁理士相談料をお支払いください
          </p>
        </div>

        <div className="rounded-3xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
              弁理士相談料のお支払い
            </h2>
          </div>

          {caseData && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                  案件番号
                </p>
                <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                  {caseData.caseNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                  商標名
                </p>
                <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                  {caseData.title}
                </p>
              </div>

              <div className="border-t border-[#8EBA43]/20 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2A3132]/80 dark:text-[#8EBA43]/80">
                    弁理士相談料
                  </span>
                  <span className="font-semibold text-[#FD9731] dark:text-[#FD9731]">
                    ¥{ATTORNEY_CONSULTATION_FEE.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-[#8EBA43]/30 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
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
              </div>

              {/* 支払い方法選択 */}
              <div className="mt-8 pt-8 border-t border-[#8EBA43]/20">
                <h3 className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43] mb-4">
                  支払い方法を選択
                </h3>
                <RadioGroup
                  value={paymentMethod || ''}
                  onValueChange={(value) =>
                    setPaymentMethod(
                      value as 'CARD' | 'BANK_TRANSFER'
                    )
                  }
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-[#8EBA43]/20 hover:border-[#4d9731]/40 transition-all">
                    <RadioGroupItem
                      value="CARD"
                      id="card-payment"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="card-payment"
                        className="text-base font-semibold cursor-pointer text-[#2A3132] dark:text-[#8EBA43]"
                      >
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        クレジットカード
                      </Label>
                      <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                        VISA、Mastercard、JCB、American Express対応
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-[#8EBA43]/20 hover:border-[#4d9731]/40 transition-all">
                    <RadioGroupItem
                      value="BANK_TRANSFER"
                      id="bank-transfer"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="bank-transfer"
                        className="text-base font-semibold cursor-pointer text-[#2A3132] dark:text-[#8EBA43]"
                      >
                        <Building2 className="w-4 h-4 inline mr-2" />
                        銀行振り込み
                      </Label>
                      <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                        振込先口座情報は支払い完了後にメールでお送りします
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isProcessing}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !paymentMethod}
                  className="bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      処理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      支払いを完了する
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">読み込み中...</span>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

