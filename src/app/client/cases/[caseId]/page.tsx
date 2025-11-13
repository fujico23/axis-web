'use client';

import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUser';

function CaseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const caseId = params.caseId as string;
  const [caseData, setCaseData] = useState<{
    caseNumber: string;
    title: string;
    status: string;
    trademarkType: string;
    applicant: string;
    classes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  if (userLoading || loading) {
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

  if (!caseData) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-muted-foreground">
          案件が見つかりません
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#8EBA43]/5 to-white dark:from-[#2A3132] dark:to-[#1a1f20] pt-[73px] py-12 px-4">
      <div className="max-w-4xl mx-auto w-full">
        <Button
          onClick={() => router.push('/client/cases')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          案件一覧に戻る
        </Button>

        <div className="text-center space-y-3 mb-8">
          <h1 className="text-3xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
            商標の詳細
          </h1>
        </div>

        <div className="rounded-3xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
              案件情報
            </h2>
          </div>

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

            <div>
              <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                ステータス
              </p>
              <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                {caseData.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                出願人
              </p>
              <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                {caseData.applicant}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                区分
              </p>
              <div className="flex flex-wrap gap-2">
                {caseData.classes.map((classCode) => (
                  <span
                    key={classCode}
                    className="px-3 py-1 bg-[#8EBA43]/10 dark:bg-[#4d9731]/20 rounded text-sm font-medium text-[#2A3132] dark:text-[#8EBA43]"
                  >
                    第{classCode}類
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">読み込み中...</span>
        </div>
      }
    >
      <CaseDetailContent />
    </Suspense>
  );
}

