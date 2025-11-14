'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUser';

function ThanksContent() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const caseId = params.caseId as string;

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
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
              お支払いが完了しました
            </h1>
            <p className="text-lg text-[#2A3132]/70 dark:text-[#8EBA43]/70">
              商標詳細ページで担当弁理士とのメール相談が可能になります
            </p>
          </div>

          <div className="bg-white dark:bg-[#2A3132] rounded-2xl border-2 border-[#8EBA43]/20 p-8 shadow-lg mt-8">
            <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-4">
              今後の進捗については、案件詳細ページでご確認いただけます。
            </p>

            <Button
              onClick={() => router.push(`/client/cases/${caseId}`)}
              className="w-full bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white hover:shadow-lg"
            >
              商標の詳細ページへ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">読み込み中...</span>
        </div>
      }
    >
      <ThanksContent />
    </Suspense>
  );
}

