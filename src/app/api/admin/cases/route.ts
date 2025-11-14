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

export async function GET(request: Request) {
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

    // URLパラメータからフィルタとソート情報を取得
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const statusFilter = searchParams.get('status');
    const trademarkTypeFilter = searchParams.get('trademarkType');
    const classFilter = searchParams.get('classes');
    const searchQuery = searchParams.get('q');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // フィルタ条件を構築（管理者は全ユーザーのCaseを取得可能）
    const where: {
      deletedAt: null;
      status?: string;
      trademarkType?: string;
      classes?: { hasSome: string[] };
      OR?: Array<{
        caseNumber?: { contains: string; mode: 'insensitive' };
        title?: { contains: string; mode: 'insensitive' };
        applicant?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      deletedAt: null,
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (trademarkTypeFilter) {
      where.trademarkType = trademarkTypeFilter as 'TEXT' | 'LOGO';
    }

    if (classFilter) {
      const classArray = classFilter.split(',').map((c) => c.trim());
      where.classes = {
        hasSome: classArray,
      };
    }

    if (searchQuery) {
      where.OR = [
        {
          caseNumber: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          applicant: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ];
    }

    // ソート条件を構築
    let orderBy: {
      caseNumber?: 'asc' | 'desc';
      title?: 'asc' | 'desc';
      applicant?: 'asc' | 'desc';
      status?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
      updatedAt?: 'asc' | 'desc';
    } = {};
    const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy === 'caseNumber') {
      orderBy = { caseNumber: sortOrderValue };
    } else if (sortBy === 'title') {
      orderBy = { title: sortOrderValue };
    } else if (sortBy === 'applicant') {
      orderBy = { applicant: sortOrderValue };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrderValue };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrderValue };
    } else {
      orderBy = { updatedAt: sortOrderValue };
    }

    // Case一覧を取得（管理者は全ユーザーのCaseを取得）
    const cases = await prisma.case.findMany({
      where,
      orderBy,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        trademarkType: true,
        status: true,
        classes: true,
        applicant: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          cases,
          total: cases.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/cases error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '案件一覧の取得に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

