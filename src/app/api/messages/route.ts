import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 通信一覧を取得
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

    // ユーザーのロールを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ユーザーが見つかりません',
          },
        },
        { status: 404 },
      );
    }

    // ユーザーがアクセスできるCaseを取得
    let accessibleCases;
    if (user.role === 'CLIENT') {
      // クライアントの場合は自分のCaseのみ
      accessibleCases = await prisma.case.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
          caseNumber: true,
          title: true,
        },
      });
    } else if (user.role === 'ATTORNEY') {
      // 弁理士の場合は担当しているCase
      const attorney = await prisma.attorney.findUnique({
        where: { userId },
        select: { id: true },
      });
      
      if (!attorney) {
        accessibleCases = [];
      } else {
        accessibleCases = await prisma.case.findMany({
          where: {
            assignedAttorneyId: attorney.id,
            deletedAt: null,
          },
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        });
      }
    } else if (user.role === 'INTERNAL_STAFF' || user.role === 'ADMIN') {
      // 所内担当者・管理者の場合は担当しているCase
      const internalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
        select: { id: true },
      });
      
      if (!internalStaff && user.role !== 'ADMIN') {
        accessibleCases = [];
      } else {
        // ADMINの場合は全てのCase、INTERNAL_STAFFの場合は担当Caseのみ
        const whereCondition: any = {
          deletedAt: null,
        };
        
        if (user.role === 'INTERNAL_STAFF' && internalStaff) {
          whereCondition.assignedInternalStaffId = internalStaff.id;
        }
        
        accessibleCases = await prisma.case.findMany({
          where: whereCondition,
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        });
      }
    } else {
      accessibleCases = [];
    }

    const caseIds = accessibleCases.map(c => c.id);

    // 各Caseのメッセージを取得
    const messages = await prisma.message.findMany({
      where: {
        caseId: { in: caseIds },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reads: {
          where: {
            userId,
          },
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Caseごとにグループ化し、未読数とフラグ情報を計算
    const communicationList = accessibleCases.map(caseItem => {
      const caseMessages = messages.filter(m => m.caseId === caseItem.id);
      const unreadCount = caseMessages.filter(m => {
        // 送信者自身のメッセージは既読扱い
        if (m.senderId === userId) {
          return false;
        }
        // 既読レコードが存在しない場合は未読
        return m.reads.length === 0;
      }).length;
      
      const hasFlaggedMessages = caseMessages.some(m => m.isFlagged);
      const latestMessage = caseMessages[0] || null;

      return {
        caseId: caseItem.id,
        caseNumber: caseItem.caseNumber,
        title: caseItem.title,
        unreadCount,
        hasFlaggedMessages,
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          subject: latestMessage.subject,
          sender: latestMessage.sender,
          isFlagged: latestMessage.isFlagged,
          createdAt: latestMessage.createdAt,
          isRead: latestMessage.senderId === userId || latestMessage.reads.length > 0,
        } : null,
        totalMessages: caseMessages.length,
      };
    });

    // 未読があるもの、フラグがあるものを優先してソート
    const sortedList = communicationList.sort((a, b) => {
      // 未読数が多い順
      if (a.unreadCount !== b.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      // フラグがあるものを優先
      if (a.hasFlaggedMessages !== b.hasFlaggedMessages) {
        return a.hasFlaggedMessages ? -1 : 1;
      }
      // 最新メッセージの日時順
      if (a.latestMessage && b.latestMessage) {
        return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
      }
      return 0;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          communications: sortedList,
          totalUnread: sortedList.reduce((sum, item) => sum + item.unreadCount, 0),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '通信一覧の取得に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

