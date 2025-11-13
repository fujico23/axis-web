# New Project

Next.js 15 + TypeScript + Prisma + Supabase プロジェクト

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. Supabase ローカル開発環境のセットアップ（推奨）

Supabase を使用する場合：

```bash
# Supabase CLI がインストールされていることを確認
supabase --version

# Supabase ローカル環境を起動
supabase start

# 起動後、表示される接続情報を .env.local に設定
```

Supabase を使用しない場合、`.env.local` の `DATABASE_URL` を実際の PostgreSQL 接続文字列に変更してください。

### 3. 環境変数の確認

`.env.local` ファイルが正しく設定されていることを確認してください：

- `DATABASE_URL` - データベース接続文字列
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL（Supabase を使用する場合）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名キー（Supabase を使用する場合）

### 4. データベースのマイグレーション

```bash
pnpm prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

## 技術スタック

- **Next.js 15.5.4** - React フレームワーク（App Router）
- **TypeScript 5** - 型安全性
- **Prisma 6.16.3** - ORM
- **Supabase** - バックエンドサービス
- **Tailwind CSS 4** - スタイリング
- **Biome** - リンター・フォーマッター
- **better-auth** - 認証
- **Radix UI** - UI コンポーネント

## スクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - プロダクションビルド
- `pnpm start` - プロダクションサーバーを起動
- `pnpm lint` - リンターを実行
- `pnpm format` - コードをフォーマット

