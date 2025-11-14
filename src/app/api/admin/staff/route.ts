import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateCustomerNumber } from '@/lib/number-generator';

// 管理者権限チェック用のヘルパー関数
async function checkAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return false;
  }

  // ADMINのみアクセス可能
  return user.role === 'ADMIN';
}

// スタッフ一覧取得
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

    // 全ユーザーを取得（CLIENT, INTERNAL_STAFF, ATTORNEY, ADMIN）
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          users,
          total: users.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/staff error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'スタッフ一覧の取得に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

// 権限変更
export async function PATCH(request: Request) {
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
            message: '権限を変更する権限がありません',
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

    const { userId, role } = parsedBody as { userId: string; role: string };

    // バリデーション
    if (!userId || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'userIdとroleは必須です',
          },
        },
        { status: 400 },
      );
    }

    // 権限の値チェック
    const validRoles = ['CLIENT', 'INTERNAL_STAFF', 'ATTORNEY', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '無効な権限です',
          },
        },
        { status: 400 },
      );
    }

    // 自分自身の権限を変更しようとしている場合はエラー
    if (userId === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '自分自身の権限は変更できません',
          },
        },
        { status: 400 },
      );
    }

    // ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
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

    // 権限変更前のロール
    const oldRole = targetUser.role;

    // 権限を変更
    await prisma.user.update({
      where: { id: userId },
      data: { role: role as 'CLIENT' | 'INTERNAL_STAFF' | 'ATTORNEY' | 'ADMIN' },
    });

    // 権限に応じてAttorneyまたはInternalStaffレコードを作成/削除
    if (role === 'ATTORNEY') {
      // Attorneyレコードが存在しない場合は作成
      const existingAttorney = await prisma.attorney.findUnique({
        where: { userId },
      });

      if (!existingAttorney) {
        await prisma.attorney.create({
          data: {
            userId,
          },
        });
      }

      // InternalStaffレコードが存在する場合は削除
      const existingInternalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
      });

      if (existingInternalStaff) {
        await prisma.internalStaff.delete({
          where: { userId },
        });
      }
    } else if (role === 'INTERNAL_STAFF') {
      // InternalStaffレコードが存在しない場合は作成
      const existingInternalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
      });

      if (!existingInternalStaff) {
        await prisma.internalStaff.create({
          data: {
            userId,
          },
        });
      }

      // Attorneyレコードが存在する場合は削除
      const existingAttorney = await prisma.attorney.findUnique({
        where: { userId },
      });

      if (existingAttorney) {
        await prisma.attorney.delete({
          where: { userId },
        });
      }
    } else {
      // CLIENTまたはADMINの場合は、AttorneyとInternalStaffレコードを削除
      const existingAttorney = await prisma.attorney.findUnique({
        where: { userId },
      });

      if (existingAttorney) {
        await prisma.attorney.delete({
          where: { userId },
        });
      }

      const existingInternalStaff = await prisma.internalStaff.findUnique({
        where: { userId },
      });

      if (existingInternalStaff) {
        await prisma.internalStaff.delete({
          where: { userId },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          userId,
          oldRole,
          newRole: role,
        },
        message: '権限を変更しました',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /api/admin/staff error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '権限の変更に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

// スタッフ追加
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

    // 管理者権限チェック
    const hasAccess = await checkAdminAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'スタッフを追加する権限がありません',
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

    const { name, email, password, role } = parsedBody as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // バリデーション
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '名前、メールアドレス、パスワード、権限は必須です',
          },
        },
        { status: 400 },
      );
    }

    // 権限の値チェック
    const validRoles = ['CLIENT', 'INTERNAL_STAFF', 'ATTORNEY', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '無効な権限です',
          },
        },
        { status: 400 },
      );
    }

    // メールアドレスの正規化
    const normalizedEmail = email.trim().toLowerCase();

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'このメールアドレスは既に登録されています',
          },
        },
        { status: 400 },
      );
    }

    // ユーザー作成（better-authを使用）
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: normalizedEmail,
        password,
        rememberMe: false,
      },
      headers: request.headers,
      request,
      returnHeaders: true,
    });

    if (!signUpResult.response.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ユーザーの作成に失敗しました',
          },
        },
        { status: 500 },
      );
    }

    const newUserId = signUpResult.response.user.id;

    // 権限を設定
    await prisma.user.update({
      where: { id: newUserId },
      data: { role: role as 'CLIENT' | 'INTERNAL_STAFF' | 'ATTORNEY' | 'ADMIN' },
    });

    // 権限に応じてAttorneyまたはInternalStaffレコードを作成
    if (role === 'ATTORNEY') {
      await prisma.attorney.create({
        data: {
          userId: newUserId,
        },
      });
    } else if (role === 'INTERNAL_STAFF') {
      await prisma.internalStaff.create({
        data: {
          userId: newUserId,
        },
      });
    } else if (role === 'CLIENT') {
      // CLIENTの場合はClientレコードを作成（既にsign-upで作成されている可能性があるが、念のため）
      const existingClient = await prisma.client.findUnique({
        where: { userId: newUserId },
      });

      if (!existingClient) {
        const customerNumber = await generateCustomerNumber();
        await prisma.client.create({
          data: {
            userId: newUserId,
            customerNumber,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUserId,
          name: name.trim(),
          email: normalizedEmail,
          role,
        },
        message: 'スタッフを追加しました',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/admin/staff error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'スタッフの追加に失敗しました',
        },
      },
      { status: 500 },
    );
  }
}

