import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 管理者権限チェック用のヘルパー関数
async function checkAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return false;
  }

  // ADMIN, INTERNAL_STAFF, ATTORNEY のみアクセス可能
  return (
    user.role === 'ADMIN' ||
    user.role === 'INTERNAL_STAFF' ||
    user.role === 'ATTORNEY'
  );
}

export async function GET(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ログインが必要です',
          },
        },
        { status: 401 },
      );
    }

    // 管理者権限チェック
    const hasAccess = await checkAdminAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'このページにアクセスする権限がありません',
          },
        },
        { status: 403 },
      );
    }

    const caseId = params.caseId;

    // Caseの存在確認（管理者は全ユーザーのCaseを取得可能）
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
        trademarkType: true,
        applicant: true,
        classes: true,
        consultationRoute: true,
        trademarkDetails: true,
        classSelections: true,
        classCategory: true,
        productService: true,
        clientIntake: true,
        notes: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!caseRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '案件が見つかりません',
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: caseRecord,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/cases/[caseId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '案件の取得に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

