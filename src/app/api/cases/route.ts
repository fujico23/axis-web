import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateCaseNumber } from '@/lib/number-generator';

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

    const userId = session.user.id;

    // URLパラメータからフィルタとソート情報を取得
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const statusFilter = searchParams.get('status');
    const trademarkTypeFilter = searchParams.get('trademarkType');
    const classFilter = searchParams.get('classes');
    const searchQuery = searchParams.get('q');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // フィルタ条件を構築
    const where: {
      userId: string;
      deletedAt: null;
      status?: string;
      trademarkType?: string;
      classes?: { hasSome: string[] };
      OR?: Array<{
        caseNumber?: { contains: string; mode: 'insensitive' };
        title?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      userId,
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
      ];
    }

    // ソート条件を構築
    let orderBy: { title?: 'asc' | 'desc'; status?: 'asc' | 'desc'; updatedAt?: 'asc' | 'desc' } = {};
    const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy === 'title') {
      orderBy = { title: sortOrderValue };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrderValue };
    } else {
      orderBy = { updatedAt: sortOrderValue };
    }

    // Case一覧を取得
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
    console.error('GET /api/cases error:', error);
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

type CaseCreatePayload = {
  title: string;
  trademarkType: 'TEXT' | 'LOGO';
  applicant: string;
  classes: string[];
  trademarkDetails: {
    text?: string;
    reading?: string;
    imageData?: string;
    logoText?: string;
    logoTextReading?: string;
  };
  classSelections?: Array<{
    classCode: string;
    details: string[];
  }>;
  classCategory?: string;
  productService?: string;
  consultationRoute?: 'AI_SELF_SERVICE' | 'ATTORNEY_CONSULTATION';
};

export async function POST(request: Request) {
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

    const userId = session.user.id;

    // Clientレコードの存在確認
    const client = await prisma.client.findUnique({
      where: { userId },
      select: {
        id: true,
        customerNumber: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'クライアント情報が登録されていません',
          },
        },
        { status: 404 },
      );
    }

    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'JSON形式で送信してください',
          },
        },
        { status: 400 },
      );
    }

    const payload = parsedBody as CaseCreatePayload;

    // バリデーション
    if (!payload.title || !payload.trademarkType || !payload.applicant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '必須項目が不足しています',
          },
        },
        { status: 400 },
      );
    }

    if (!payload.classes || payload.classes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '区分を1つ以上選択してください',
          },
        },
        { status: 400 },
      );
    }

    // 整理番号とsequenceNumberを生成
    const caseNumber = await generateCaseNumber(userId);

    // 既存の案件から最大sequenceNumberを取得
    const existingCases = await prisma.case.findMany({
      where: {
        userId,
      },
      orderBy: {
        sequenceNumber: 'desc',
      },
      take: 1,
    });

    const sequenceNumber =
      existingCases.length > 0 ? existingCases[0].sequenceNumber + 1 : 1;

    // Caseレコードを作成
    const caseRecord = await prisma.case.create({
      data: {
        caseNumber,
        sequenceNumber,
        title: payload.title,
        trademarkType: payload.trademarkType,
        applicant: payload.applicant,
        classes: payload.classes,
        trademarkDetails: payload.trademarkDetails,
        classSelections: payload.classSelections
          ? JSON.parse(JSON.stringify(payload.classSelections))
          : null,
        classCategory: payload.classCategory || null,
        productService: payload.productService || null,
        status: 'DRAFT',
        consultationRoute: payload.consultationRoute || null,
        consultationStarted: false,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: caseRecord.id,
          caseNumber: caseRecord.caseNumber,
          title: caseRecord.title,
        },
        message: '案件を作成しました',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/cases error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '案件の作成に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

