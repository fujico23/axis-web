"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, FileText, Search, FileEdit, FileCode, MessageSquare, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/useUser";

type CaseData = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  trademarkType: string;
  applicant: string;
  classes: string[];
  consultationRoute: string | null;
  trademarkDetails: unknown;
  classSelections: unknown;
  classCategory: string | null;
  productService: string | null;
  clientIntake: unknown;
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  TRADEMARK_REGISTERED: "新規商標済",
  PRELIMINARY_RESEARCH_IN_PROGRESS: "事前調査中",
  RESEARCH_RESULT_SHARED: "調査結果共有",
  PREPARING_APPLICATION: "出願準備中",
  APPLICATION_CONFIRMED: "願書確定",
  APPLICATION_SUBMITTED: "出願受付済",
  UNDER_EXAMINATION: "審査中",
  OA_RECEIVED: "OA受領",
  RESPONDING_TO_OA: "中間対応中",
  FINAL_RESULT_RECEIVED: "最終結果受領",
  PAYING_REGISTRATION_FEE: "登録料納付中",
  REGISTRATION_COMPLETED: "登録完了",
  AWAITING_RENEWAL: "更新待ち",
  IN_DISPUTE: "係争中",
  REJECTED: "拒絶確定",
  ABANDONED: "放棄",
};

export default function AdminCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "案件情報", icon: FileText },
    { id: "investigation", label: "LLM調査", icon: Search },
    { id: "draft", label: "願書ドラフト", icon: FileEdit },
    { id: "xml", label: "XMLデータ", icon: FileCode },
    { id: "communication", label: "通信一覧", icon: MessageSquare },
    { id: "billing", label: "請求書", icon: Receipt },
  ];

  // 認証チェックと権限チェック
  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // 管理者権限チェック
    if (
      user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY"
    ) {
      router.push("/client/cases");
      return;
    }
  }, [user, userLoading, router]);

  // Caseデータを取得
  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    // 権限チェック
    if (
      user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY"
    ) {
      return;
    }

    const fetchCase = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/cases/${caseId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCaseData(data.data);
          }
        } else if (response.status === 403) {
          router.push("/client/cases");
        }
      } catch (error) {
        console.error("Failed to fetch case:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId, user, userLoading, router]);

  // ローディング中または権限チェック中
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 権限がない場合は何も表示しない（リダイレクト処理中）
  if (
    !user ||
    (user.role !== "ADMIN" &&
      user.role !== "INTERNAL_STAFF" &&
      user.role !== "ATTORNEY")
  ) {
    return null;
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">案件が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* サイドバー */}
      <aside className="w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/cases")}
            className="w-full justify-start mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            案件一覧に戻る
          </Button>
          <div className="rounded-2xl border border-border bg-card/80 p-4 mb-4">
            <h1 className="text-lg font-bold mb-1">{caseData.title}</h1>
            <p className="text-xs text-muted-foreground mb-2">
              整理番号: {caseData.caseNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              ステータス: {STATUS_LABELS[caseData.status] || caseData.status}
            </p>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white shadow-md"
                      : "text-[#2A3132]/70 dark:text-[#8EBA43]/70 hover:bg-[#8EBA43]/10 dark:hover:bg-[#4d9731]/20 hover:text-[#4d9731] dark:hover:text-[#8EBA43]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 min-w-0">
        {/* 案件情報セクション */}
        {activeSection === "overview" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <h2 className="text-lg font-semibold mb-4">案件情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  整理番号
                </label>
                <p className="text-sm font-medium">{caseData.caseNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  商標名
                </label>
                <p className="text-sm font-medium">{caseData.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  出願人
                </label>
                <p className="text-sm font-medium">{caseData.applicant}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  商標タイプ
                </label>
                <p className="text-sm font-medium">
                  {caseData.trademarkType === "TEXT" ? "文字" : "図形"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  区分
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {caseData.classes.map((classCode) => (
                    <span
                      key={classCode}
                      className="px-2 py-0.5 bg-muted rounded text-xs"
                    >
                      第{classCode}類
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  相談ルート
                </label>
                <p className="text-sm font-medium">
                  {caseData.consultationRoute === "AI_SELF_SERVICE"
                    ? "簡易ルート"
                    : caseData.consultationRoute === "ATTORNEY_CONSULTATION"
                      ? "弁理士相談型"
                      : "未設定"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  ステータス
                </label>
                <p className="text-sm font-medium">
                  {STATUS_LABELS[caseData.status] || caseData.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  作成日
                </label>
                <p className="text-sm font-medium">
                  {new Date(caseData.createdAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>
            {caseData.notes && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">
                  メモ
                </label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {caseData.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* LLM調査セクション */}
        {activeSection === "investigation" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">LLM調査</h2>
              <Button>調査を実行</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              LLM調査機能は今後実装予定です。
            </p>
          </div>
        )}

        {/* 願書ドラフトセクション */}
        {activeSection === "draft" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">願書ドラフト</h2>
              <div className="flex gap-2">
                <Button variant="outline">ドラフト作成</Button>
                <Button variant="outline">ダウンロード</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              願書ドラフト機能は今後実装予定です。
            </p>
          </div>
        )}

        {/* XMLデータセクション */}
        {activeSection === "xml" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <h2 className="text-lg font-semibold mb-4">XMLデータ入力</h2>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                XMLファイルをドラッグ&ドロップするか、クリックして選択してください
              </p>
              <Button variant="outline">ファイルを選択</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              XMLデータ入力機能は今後実装予定です。
            </p>
          </div>
        )}

        {/* 通信一覧セクション */}
        {activeSection === "communication" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">通信一覧</h2>
              <Button>新規メッセージ</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              通信一覧機能は今後実装予定です。
            </p>
          </div>
        )}

        {/* 請求書セクション */}
        {activeSection === "billing" && (
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">請求書管理</h2>
              <Button>請求書作成</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              請求書管理機能は今後実装予定です。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

