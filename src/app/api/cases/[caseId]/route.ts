import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

type CaseUpdatePayload = {
  applicant?: string;
  clientIntake?: Record<string, unknown>;
  consultationRoute?: 'AI_SELF_SERVICE' | 'ATTORNEY_CONSULTATION';
  status?: string;
};

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

    const userId = session.user.id;
    const caseId = params.caseId;

    // Caseの存在確認と所有権確認
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        userId: true,
        caseNumber: true,
        title: true,
        status: true,
        trademarkType: true,
        applicant: true,
        classes: true,
        consultationRoute: true,
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

    if (caseRecord.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'この案件を閲覧する権限がありません',
          },
        },
        { status: 403 },
      );
    }

    // userIdを除外して返す
    const { userId: _, ...caseData } = caseRecord;

    return NextResponse.json(
      {
        success: true,
        data: caseData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/cases/[caseId] error:', error);
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

export async function PATCH(
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

    const userId = session.user.id;
    const caseId = params.caseId;

    // Caseの存在確認と所有権確認
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        userId: true,
        status: true,
        caseNumber: true,
        title: true,
        classes: true,
        consultationRoute: true,
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

    if (caseRecord.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'この案件を更新する権限がありません',
          },
        },
        { status: 403 },
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

    const payload = parsedBody as CaseUpdatePayload;

    // 更新データを構築
    const updateData: Record<string, unknown> = {};

    if (payload.applicant !== undefined) {
      updateData.applicant = payload.applicant;
    }

    if (payload.clientIntake !== undefined) {
      updateData.clientIntake = JSON.parse(
        JSON.stringify(payload.clientIntake)
      );
    }

    if (payload.consultationRoute !== undefined) {
      updateData.consultationRoute = payload.consultationRoute;
    }

    if (payload.status !== undefined) {
      // ステータスのバリデーション
      const validStatuses = [
        'DRAFT',
        'TRADEMARK_REGISTERED',
        'PRELIMINARY_RESEARCH_IN_PROGRESS',
        'RESEARCH_RESULT_SHARED',
        'PREPARING_APPLICATION',
        'APPLICATION_CONFIRMED',
        'APPLICATION_SUBMITTED',
        'UNDER_EXAMINATION',
        'OA_RECEIVED',
        'RESPONDING_TO_OA',
        'FINAL_RESULT_RECEIVED',
        'PAYING_REGISTRATION_FEE',
        'REGISTRATION_COMPLETED',
        'AWAITING_RENEWAL',
        'IN_DISPUTE',
        'REJECTED',
        'ABANDONED',
      ];

      if (validStatuses.includes(payload.status)) {
        updateData.status = payload.status;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '無効なステータスです',
            },
          },
          { status: 400 },
        );
      }
    }

    // Caseを更新
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
        consultationRoute: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedCase,
        message: '案件を更新しました',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /api/cases/[caseId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '案件の更新に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

