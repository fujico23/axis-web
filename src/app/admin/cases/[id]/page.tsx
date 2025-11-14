"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, FileText, Search, FileEdit, FileCode, MessageSquare, Receipt, Send, Flag, FlagOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  
  // メッセージ関連の状態
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // メッセージを取得
  useEffect(() => {
    if (!caseId || !user || userLoading || activeSection !== "communication") {
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await fetch(`/api/messages/${caseId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMessages(data.data.messages || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [caseId, user, userLoading, activeSection]);

  useEffect(() => {
    // メッセージが更新されたら一番上（最新メッセージ）にスクロール
    if (activeSection === "communication" && messages.length > 0) {
      // 最新メッセージは一番上にあるので、スクロール位置をリセット
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [messages, activeSection]);

  const handleSend = async () => {
    if (!content.trim()) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${caseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          subject: subject.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages((prev) => [data.data.message, ...prev]);
          setContent("");
          setSubject("");
          // 新しく送信したメッセージを選択状態にする
          setSelectedMessageId(data.data.message.id);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleToggleFlag = async (messageId: string, currentFlagged: boolean) => {
    try {
      const response = await fetch(`/api/messages/${caseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messageId,
          isFlagged: !currentFlagged,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, isFlagged: !currentFlagged }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle flag:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      CLIENT: "クライアント",
      INTERNAL_STAFF: "所内担当",
      ATTORNEY: "担当弁理士",
      ADMIN: "管理者",
    };
    return roleMap[role] || role;
  };

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
          <div className="rounded-2xl border border-border bg-card/80 flex flex-col h-[800px]">
            {/* 入力欄を上に配置 */}
            <div className="border-b border-border p-4 space-y-2 bg-muted/30 flex-shrink-0">
              <Input
                placeholder="件名（オプション）"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Textarea
                  placeholder="メッセージを入力..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSend();
                    }
                  }}
                  className="flex-1 min-h-[100px]"
                />
                <Button
                  onClick={handleSend}
                  disabled={!content.trim() || sending}
                  className="self-end"
                >
                  <Send className="w-4 h-4 mr-2" />
                  送信
                </Button>
              </div>
            </div>

            {/* メッセージ一覧と詳細の分割表示 */}
            <div className="flex flex-1 overflow-hidden">
              {/* メッセージリスト（左側） */}
              <div className="w-1/2 border-r border-border overflow-y-auto">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    読み込み中...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    まだメッセージがありません
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {messages.map((message) => {
                      const isSelected = selectedMessageId === message.id;
                      const preview = message.content.length > 100 
                        ? message.content.substring(0, 100) + '...'
                        : message.content;
                      
                      return (
                        <div
                          key={message.id}
                          onClick={() => setSelectedMessageId(isSelected ? null : message.id)}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            isSelected ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* フラグ */}
                            <div className="flex-shrink-0 pt-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFlag(message.id, message.isFlagged);
                                }}
                                className="hover:opacity-80 transition-opacity"
                                type="button"
                              >
                                {message.isFlagged ? (
                                  <Flag className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                ) : (
                                  <FlagOff className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>

                            {/* メッセージ情報 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {message.subject || '(件名なし)'}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground truncate">
                                  {getRoleLabel(message.sender.role)}: {message.sender.name}
                                </span>
                                {message.isRead && message.readAt && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0">既読</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {preview}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* メッセージ詳細（右側） */}
              <div className="w-1/2 overflow-y-auto">
                {selectedMessageId ? (
                  (() => {
                    const selectedMessage = messages.find(m => m.id === selectedMessageId);
                    if (!selectedMessage) return null;
                    
                    return (
                      <div className="p-6">
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">
                              {selectedMessage.subject || '(件名なし)'}
                            </h2>
                            <button
                              onClick={() => handleToggleFlag(selectedMessage.id, selectedMessage.isFlagged)}
                              className="hover:opacity-80 transition-opacity"
                              type="button"
                            >
                              {selectedMessage.isFlagged ? (
                                <Flag className="w-5 h-5 text-yellow-500" fill="currentColor" />
                              ) : (
                                <FlagOff className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          
                          <div className="space-y-2 border-b border-border pb-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-muted-foreground">送信者:</span>
                              <span className="text-foreground">
                                {getRoleLabel(selectedMessage.sender.role)}: {selectedMessage.sender.name}
                              </span>
                              <span className="text-muted-foreground">
                                &lt;{selectedMessage.sender.email}&gt;
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-muted-foreground">日時:</span>
                              <span className="text-foreground">
                                {formatDate(selectedMessage.createdAt)}
                              </span>
                              {selectedMessage.isRead && selectedMessage.readAt && (
                                <span className="text-muted-foreground">既読</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {selectedMessage.content}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    メッセージを選択してください
                  </div>
                )}
              </div>
            </div>
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

