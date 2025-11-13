"use client";

import Link from "next/link";
import {
  Search,
  UserCircle,
  LogIn,
  ArrowRight,
  BrainCircuit,
  Zap,
  TrendingUp,
  Lightbulb,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { useUser } from "@/lib/useUser";

export default function HomePage() {
  const { user, loading } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#8EBA43]/30 bg-gradient-to-r from-[#4d9731] to-[#8EBA43] backdrop-blur-lg shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-bold text-2xl tracking-tight text-white hover:text-white/90 transition-opacity duration-300"
          >
            スマート商標.com
          </Link>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-10 bg-white/20 animate-pulse rounded-md" />
            ) : user ? (
              <Link href="/client/cases">
                <Button className="rounded-full bg-white text-[#4d9731] hover:bg-white/90 shadow-md hover:shadow-lg transition-all">
                  <UserCircle className="w-4 h-4 mr-2" />
                  マイページ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="rounded-full border-white text-white hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    ログイン
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-full bg-gradient-to-r from-[#FD9731] to-[#f57c00] text-white hover:from-[#f57c00] hover:to-[#FD9731] shadow-md hover:shadow-lg transition-all">
                    無料で新規登録
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 pt-[72px]">
        {/* ヒーローセクション */}
        <section className="relative py-28 px-4">
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center space-y-6">
              <ScrollFadeIn delay={0.1}>
                <div className="inline-block">
                  <div className="flex flex-wrap gap-3 justify-center mb-6">
                    <span className="px-4 py-2 bg-[#8EBA43]/20 text-[#4d9731] text-sm font-bold rounded-full border border-[#8EBA43]/30">
                      AI × 弁理士
                    </span>
                    <span className="px-4 py-2 bg-[#4d9731]/20 text-[#4d9731] text-sm font-bold rounded-full border border-[#4d9731]/30">
                      戦略的ブランド保護
                    </span>
                    <span className="px-4 py-2 bg-[#8EBA43]/20 text-[#4d9731] text-sm font-bold rounded-full border border-[#8EBA43]/30">
                      定額・明朗会計
                    </span>
                  </div>
                </div>
              </ScrollFadeIn>

              <ScrollFadeIn delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tighter">
                  AIが加速する、
                  <br />
                  新時代のインテリジェント商標サービス
                </h1>
              </ScrollFadeIn>

              <ScrollFadeIn delay={0.3}>
                <p className="text-2xl md:text-3xl font-semibold text-[#4d9731]">
                  あなたのビジネスを、
                  <br className="md:hidden" />
                  ブランド戦略の力で次のステージへ
                </p>
              </ScrollFadeIn>

              <ScrollFadeIn delay={0.4}>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  最先端AI技術と創業50年以上の実績を誇る弁理士の知見を融合。
                  <br />
                  単なる商標登録に留まらず、貴社のビジネス成長を加速させる高付加価値なブランド戦略パートナーとして伴走します。
                </p>
              </ScrollFadeIn>

              {/* CTAボタン */}
              <ScrollFadeIn delay={0.5}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                  <Link href="/search">
                    <Button
                      size="lg"
                      className="px-10 py-7 text-xl font-bold rounded-full bg-gradient-to-r from-[#FD9731] to-[#f57c00] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Search className="w-6 h-6 mr-3" />
                      AIで無料商標検索
                    </Button>
                  </Link>
                </div>
              </ScrollFadeIn>
            </div>
          </div>
        </section>

        {/* 選ばれる3つの理由 */}
        <section className="py-24 px-4 bg-muted">
          <div className="max-w-6xl mx-auto">
            <ScrollFadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                スマート商標が選ばれる理由
              </h2>
              <p className="text-center text-muted-foreground mb-16">
                私たちは、テクノロジーと専門知識で、これからのブランド保護を再定義します。
              </p>
            </ScrollFadeIn>

            <div className="grid md:grid-cols-3 gap-8">
              {/* 理由1 */}
              <ScrollFadeIn delay={0.1}>
                <div className="group p-8 rounded-2xl border bg-background hover:border-[#8EBA43]/50 hover:-translate-y-2 transition-all duration-300">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#4d9731] mb-4">
                    AIと専門家のハイブリッド
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    最新AIによる高精度な先行商標調査と、経験豊富な弁理士による戦略的なアドバイスを組み合わせ、登録可能性を最大化します。
                  </p>
                </div>
              </ScrollFadeIn>

              {/* 理由2 */}
              <ScrollFadeIn delay={0.2}>
                <div className="group p-8 rounded-2xl border bg-background hover:border-[#8EBA43]/50 hover:-translate-y-2 transition-all duration-300">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#4d9731] mb-4">
                    事業成長を見据えた戦略提案
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    お客様のビジネスモデルと将来の展望を深く理解し、単なる手続き代行ではない、事業成長に貢献するブランド戦略を共に構築します。
                  </p>
                </div>
              </ScrollFadeIn>

              {/* 理由3 */}
              <ScrollFadeIn delay={0.3}>
                <div className="group p-8 rounded-2xl border bg-background hover:border-[#8EBA43]/50 hover:-translate-y-2 transition-all duration-300">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#4d9731] mb-4">
                    透明性の高い料金体系
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    区分加算なしの一律手数料で、複雑な料金計算は一切不要。安心してご依頼いただける、業界最高水準のコストパフォーマンスを実現しました。
                  </p>
                </div>
              </ScrollFadeIn>
            </div>
          </div>
        </section>

        {/* 料金セクション */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <ScrollFadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                シンプルでパワフルな料金プラン
              </h2>
              <p className="text-center text-xl text-[#4d9731] font-semibold mb-12">
                必要なのは、事業を守るための投資だけ。
              </p>
            </ScrollFadeIn>

            <ScrollFadeIn delay={0.2}>
              <div className="bg-muted rounded-3xl shadow-lg p-8 md:p-12 border">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <span className="font-semibold text-muted-foreground">AI商標調査</span>
                      <span className="text-2xl font-bold text-[#4d9731]">0円</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <span className="font-semibold text-muted-foreground">専門家による調査報告</span>
                      <span className="text-2xl font-bold text-[#4d9731]">0円</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-[#8EBA43]">
                      <span className="font-semibold text-foreground">出願手数料</span>
                      <span className="text-3xl font-bold text-[#4d9731]">40,000円</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <span className="font-semibold text-muted-foreground">区分加算</span>
                      <span className="text-2xl font-bold text-[#4d9731]">なし</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <span className="font-semibold text-muted-foreground">登録時成功報酬</span>
                      <span className="text-2xl font-bold text-[#4d9731]">0円</span>
                    </div>
                    <div className="p-4 bg-[#8EBA43]/10 rounded-lg border border-[#8EBA43]/30">
                      <p className="text-sm text-[#4d9731]">
                        ※ 特許庁への印紙代は別途発生します。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">事務所へのお支払い総額</p>
                      <p className="text-4xl md:text-5xl font-bold text-[#4d9731]">40,000円</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">（税別・区分数問わず）</p>
                    </div>
                    <div className="bg-[#8EBA43]/10 border border-[#8EBA43]/30 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-[#4d9731] mb-1">全額返金保証</p>
                      <p className="text-xs text-[#4d9731]/80">
                        調査の結果、出願を断念される場合は
                        <br />
                        手数料を全額返金いたします。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="py-24 px-4 bg-muted">
          <div className="max-w-6xl mx-auto">
            <ScrollFadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
                あらゆるブランド課題を、スマートに解決
              </h2>
            </ScrollFadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <ScrollFadeIn delay={0.1}>
                <div className="p-8 rounded-2xl bg-background border">
                  <h3 className="text-xl font-bold text-[#4d9731] mb-4 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-[#4d9731]" />
                    よくあるお悩み
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>ブランド戦略の立て方がわからない</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>商標の重要性はわかるが、手続きが複雑で後回しに…</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>どの特許事務所に頼めばいいか判断できない</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>費用が不明瞭で、最終的にいくらかかるか不安</span>
                    </li>
                  </ul>
                </div>
              </ScrollFadeIn>

              <ScrollFadeIn delay={0.2}>
                <div className="p-8 rounded-2xl bg-background border">
                  <h3 className="text-xl font-bold text-[#4d9731] mb-4 flex items-center gap-2">
                    <BarChart className="w-6 h-6 text-[#4d9731]" />
                    従来のサービスの問題点
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>料金体系が複雑で、結局どこが安いのか不明</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>「安い」だけで、戦略的な視点が欠けている</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>担当者によって品質にバラつきがある</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4d9731] mt-1">●</span>
                      <span>相談のハードルが高く、気軽に質問できない</span>
                    </li>
                  </ul>
                </div>
              </ScrollFadeIn>
            </div>

            <ScrollFadeIn delay={0.3}>
              <div className="text-center p-8 bg-gradient-to-r from-[#4d9731] to-[#8EBA43] rounded-3xl text-white shadow-lg">
                <p className="text-3xl font-bold mb-4">
                  スマート商標が、そのすべてを解決します
                </p>
                <p className="text-xl text-white/90">
                  専門知識は不要です。私たちと、最強のブランドを育てましょう。
                </p>
              </div>
            </ScrollFadeIn>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-28 px-4 bg-background">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <ScrollFadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                さあ、あなたのブランド価値を最大化しませんか？
              </h2>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.1}>
              <p className="text-lg text-muted-foreground">
                まずは無料のAI商標検索から。
                <br />
                わずか数分で、あなたのブランドの可能性を診断します。
              </p>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Link href="/search">
                  <Button
                    size="lg"
                    className="px-12 py-7 text-xl font-bold rounded-full bg-gradient-to-r from-[#FD9731] to-[#f57c00] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Search className="w-6 h-6 mr-3" />
                    無料でAI商標検索を試す
                  </Button>
                </Link>
              </div>
            </ScrollFadeIn>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t bg-muted py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl text-foreground mb-4">
                スマート商標.com
              </h3>
              <p className="text-sm text-muted-foreground">
                AIと専門家が導く、
                <br />
                次世代のブランド戦略パートナー
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">クイックリンク</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/search"
                    className="hover:text-primary transition-colors"
                  >
                    AI商標検索
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-primary transition-colors"
                  >
                    新規登録
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary transition-colors"
                  >
                    ログイン
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">運営</h4>
              <p className="text-sm text-muted-foreground mb-2">
                アクシス国際弁理士法人
              </p>
              <p className="text-xs text-muted-foreground/80">代表弁理士：中島 拓</p>
            </div>
          </div>
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground/80">
              &copy; 2025 スマート商標.com / AXIS Patent International. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
