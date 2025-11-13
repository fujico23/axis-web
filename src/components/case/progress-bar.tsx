'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProgressStep = {
  id: number;
  label: string;
  status: 'completed' | 'current' | 'pending';
};

type CaseProgressBarProps = {
  currentStatus: string;
};

type ProgressStepWithLabels = {
  id: number;
  label: string | { top: string; bottom: string };
  status: 'completed' | 'current' | 'pending';
};

// ステータスから進捗ステップを決定
function getProgressSteps(currentStatus: string): ProgressStepWithLabels[] {
  const steps: ProgressStepWithLabels[] = [
    { id: 1, label: '下書き', status: 'pending' },
    {
      id: 2,
      label: { top: '新規商標作成', bottom: '事前調査' },
      status: 'pending',
    },
    {
      id: 3,
      label: { top: '出願準備', bottom: '出願受付' },
      status: 'pending',
    },
    { id: 4, label: '審査中', status: 'pending' },
    { id: 5, label: '中間対応中', status: 'pending' },
    {
      id: 6,
      label: { top: '登録準備', bottom: '登録完了' },
      status: 'pending',
    },
  ];

  // ステータスに応じて進捗を設定
  if (currentStatus === 'DRAFT') {
    steps[0].status = 'current';
  } else if (currentStatus === 'TRADEMARK_REGISTERED') {
    steps[0].status = 'completed';
    steps[1].status = 'current';
  } else if (
    currentStatus === 'PRELIMINARY_RESEARCH_IN_PROGRESS' ||
    currentStatus === 'RESEARCH_RESULT_SHARED'
  ) {
    steps[0].status = 'completed';
    steps[1].status = 'current';
  } else if (
    currentStatus === 'PREPARING_APPLICATION' ||
    currentStatus === 'APPLICATION_CONFIRMED'
  ) {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'current';
  } else if (currentStatus === 'APPLICATION_SUBMITTED') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'current';
  } else if (currentStatus === 'UNDER_EXAMINATION') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[3].status = 'current';
  } else if (
    currentStatus === 'OA_RECEIVED' ||
    currentStatus === 'RESPONDING_TO_OA'
  ) {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[3].status = 'completed';
    steps[4].status = 'current';
  } else if (
    currentStatus === 'FINAL_RESULT_RECEIVED' ||
    currentStatus === 'PAYING_REGISTRATION_FEE'
  ) {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[3].status = 'completed';
    steps[4].status = 'completed';
    steps[5].status = 'current';
  } else if (
    currentStatus === 'REGISTRATION_COMPLETED' ||
    currentStatus === 'AWAITING_RENEWAL'
  ) {
    // 登録完了後は全て完了
    steps.forEach((step) => {
      step.status = 'completed';
    });
  }

  return steps;
}

export function CaseProgressBar({ currentStatus }: CaseProgressBarProps) {
  const steps = getProgressSteps(currentStatus);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const hasTwoLabels = typeof step.label === 'object';

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* ステップ */}
              <div
                className={cn(
                  'relative flex items-center justify-center h-16 px-2 flex-1',
                  isFirst ? 'arrow-step-first' : isLast ? 'arrow-step-last' : 'arrow-step-middle',
                  isCompleted
                    ? 'bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white'
                    : isCurrent
                      ? 'bg-gradient-to-r from-[#FD9731] to-[#f57c00] text-white animate-pulse-glow'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
                style={{
                  clipPath: isFirst
                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                    : isLast
                      ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                      : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                  marginLeft: isFirst ? '0' : '-12px',
                }}
              >
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {isCompleted ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {step.id}
                    </span>
                  )}
                  {hasTwoLabels ? (
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span className="text-[10px] font-semibold whitespace-nowrap">
                        {step.label.top}
                      </span>
                      <span className="text-[10px] font-semibold whitespace-nowrap">
                        {step.label.bottom}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {step.label}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-[#FD9731] animate-pulse" />
                  </div>
                )}
              </div>
              {/* 矢印（最後のステップ以外） */}
              {!isLast && (
                <div
                  className={cn(
                    'w-0 h-0 border-t-[32px] border-b-[32px] border-l-[12px] border-t-transparent border-b-transparent flex-shrink-0',
                    isCompleted
                      ? 'border-l-[#8EBA43]'
                      : 'border-l-gray-200 dark:border-l-gray-700'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

