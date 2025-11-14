import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 特定のCaseのメッセージ一覧を取得
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

    // Caseの存在確認とアクセス権限確認
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        userId: true,
        caseNumber: true,
        title: true,
        assignedAttorneyId: true,
        assignedInternalStaffId: true,
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

    // アクセス権限チェック
    let hasAccess = false;
    if (user.role === 'CLIENT') {
      hasAccess = caseRecord.userId === userId;
    } else if (user.role === 'ATTORNEY') {
      const attorney = await prisma.attorney.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = attorney ? caseRecord.assignedAttorneyId === attorney.id : false;
    } else if (user.role === 'INTERNAL_STAFF') {
      const internalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = internalStaff ? caseRecord.assignedInternalStaffId === internalStaff.id : false;
    } else if (user.role === 'ADMIN') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'この案件の通信を閲覧する権限がありません',
          },
        },
        { status: 403 },
      );
    }

    // メッセージ一覧を取得
    const messages = await prisma.message.findMany({
      where: {
        caseId,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // メッセージを既読にする（送信者自身のメッセージは除く）
    const unreadMessages = messages.filter(m => {
      if (m.senderId === userId) {
        return false; // 送信者自身のメッセージは既読扱い
      }
      return m.reads.length === 0;
    });

    // 未読メッセージを既読にする
    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map(m => ({
          messageId: m.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    const messagesWithReadStatus = messages.map(m => ({
      id: m.id,
      content: m.content,
      subject: m.subject,
      sender: m.sender,
      isFlagged: m.isFlagged,
      attachments: m.attachments,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      isRead: m.senderId === userId || m.reads.length > 0,
      readAt: m.reads[0]?.readAt || null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          case: {
            id: caseRecord.id,
            caseNumber: caseRecord.caseNumber,
            title: caseRecord.title,
          },
          messages: messagesWithReadStatus,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/messages/[caseId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'メッセージの取得に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

// メッセージを送信
export async function POST(
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

    const body = await request.json();
    const { content, subject, isFlagged, attachments } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'メッセージ内容は必須です',
          },
        },
        { status: 400 },
      );
    }

    // Caseの存在確認とアクセス権限確認
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        userId: true,
        assignedAttorneyId: true,
        assignedInternalStaffId: true,
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

    // アクセス権限チェック
    let hasAccess = false;
    if (user.role === 'CLIENT') {
      hasAccess = caseRecord.userId === userId;
    } else if (user.role === 'ATTORNEY') {
      const attorney = await prisma.attorney.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = attorney ? caseRecord.assignedAttorneyId === attorney.id : false;
    } else if (user.role === 'INTERNAL_STAFF') {
      const internalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = internalStaff ? caseRecord.assignedInternalStaffId === internalStaff.id : false;
    } else if (user.role === 'ADMIN') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'この案件にメッセージを送信する権限がありません',
          },
        },
        { status: 403 },
      );
    }

    // メッセージを作成
    const message = await prisma.message.create({
      data: {
        caseId,
        senderId: userId,
        content: content.trim(),
        subject: subject?.trim() || null,
        isFlagged: Boolean(isFlagged),
        attachments: attachments || null,
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: {
            id: message.id,
            content: message.content,
            subject: message.subject,
            sender: message.sender,
            isFlagged: message.isFlagged,
            attachments: message.attachments,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            isRead: true, // 送信者自身のメッセージは既読扱い
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/messages/[caseId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'メッセージの送信に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

// メッセージのフラグを更新
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
    const body = await request.json();
    const { messageId, isFlagged } = body;

    if (!messageId || typeof isFlagged !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'メッセージIDとフラグ状態は必須です',
          },
        },
        { status: 400 },
      );
    }

    // メッセージの存在確認とアクセス権限確認
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        case: {
          select: {
            id: true,
            userId: true,
            assignedAttorneyId: true,
            assignedInternalStaffId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'メッセージが見つかりません',
          },
        },
        { status: 404 },
      );
    }

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

    // アクセス権限チェック
    let hasAccess = false;
    if (user.role === 'CLIENT') {
      hasAccess = message.case.userId === userId;
    } else if (user.role === 'ATTORNEY') {
      const attorney = await prisma.attorney.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = attorney ? message.case.assignedAttorneyId === attorney.id : false;
    } else if (user.role === 'INTERNAL_STAFF') {
      const internalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
        select: { id: true },
      });
      hasAccess = internalStaff ? message.case.assignedInternalStaffId === internalStaff.id : false;
    } else if (user.role === 'ADMIN') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'このメッセージのフラグを変更する権限がありません',
          },
        },
        { status: 403 },
      );
    }

    // フラグを更新
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isFlagged,
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: {
            id: updatedMessage.id,
            isFlagged: updatedMessage.isFlagged,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /api/messages/[caseId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'フラグの更新に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

