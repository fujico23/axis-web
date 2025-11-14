'use client';

import { ArrowLeft, FileText, RotateCcw, Send, Flag, FlagOff } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUser } from '@/lib/useUser';
import { CaseProgressBar } from '@/components/case/progress-bar';

function CaseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const caseId = params.caseId as string;
  const [caseData, setCaseData] = useState<{
    caseNumber: string;
    title: string;
    status: string;
    trademarkType: string;
    applicant: string;
    classes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'messages'>('info');
  
  // メッセージ関連の状態
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCaseData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch case:', error);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  // メッセージを取得
  useEffect(() => {
    if (!caseId || !user || userLoading) {
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await fetch(`/api/messages/${caseId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMessages(data.data.messages || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [caseId, user, userLoading, activeTab]);

  useEffect(() => {
    // メッセージが更新されたら一番上（最新メッセージ）にスクロール
    if (activeTab === 'messages' && messages.length > 0) {
      // 最新メッセージは一番上にあるので、スクロール位置をリセット
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [messages, activeTab]);

  const handleSend = async () => {
    if (!content.trim()) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          subject: subject.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages((prev) => [data.data.message, ...prev]);
          setContent('');
          setSubject('');
          // 新しく送信したメッセージを選択状態にする
          setSelectedMessageId(data.data.message.id);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleToggleFlag = async (messageId: string, currentFlagged: boolean) => {
    try {
      const response = await fetch(`/api/messages/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      console.error('Failed to toggle flag:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      CLIENT: 'クライアント',
      INTERNAL_STAFF: '所内担当',
      ATTORNEY: '担当弁理士',
      ADMIN: '管理者',
    };
    return roleMap[role] || role;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-muted-foreground">
          案件が見つかりません
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#8EBA43]/5 to-white dark:from-[#2A3132] dark:to-[#1a1f20] pt-[73px] py-12 px-4">
      <div className="max-w-4xl mx-auto w-full">
        <Button
          onClick={() => router.push('/client/cases')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          案件一覧に戻る
        </Button>

        {/* タブ */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'border-b-2 border-[#8EBA43] text-[#4d9731] dark:text-[#8EBA43]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            商標情報
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'messages'
                ? 'border-b-2 border-[#8EBA43] text-[#4d9731] dark:text-[#8EBA43]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            通信一覧
          </button>
        </div>

        {activeTab === 'info' && (
          <>
            {/* 進捗バー */}
            <div className="mb-6">
              <CaseProgressBar currentStatus={caseData.status} />
            </div>

            {/* アクションボタン */}
            <div className="mb-6 flex justify-center">
              {caseData.status === 'DRAFT' && (
                <Button
                  onClick={() => {
                    router.push(`/client/cases/new?caseId=${caseId}`);
                  }}
                  className="bg-gradient-to-r from-[#FD9731] to-[#f57c00] text-white hover:shadow-lg rounded-full px-8 py-6 text-base font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  検討再開
                </Button>
              )}
            </div>

            {/* レイアウト: 商標情報を右寄せに配置 */}
            <div className="flex justify-end">
              {/* 商標情報 */}
              <div className="w-96 rounded-3xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
                    商標情報
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                      案件番号
                    </p>
                    <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                      {caseData.caseNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                      商標名
                    </p>
                    <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                      {caseData.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                      出願人
                    </p>
                    <p className="text-lg font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                      {caseData.applicant}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-2">
                      区分
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {caseData.classes.map((classCode) => (
                        <span
                          key={classCode}
                          className="px-3 py-1 bg-[#8EBA43]/10 dark:bg-[#4d9731]/20 rounded text-sm font-medium text-[#2A3132] dark:text-[#8EBA43]"
                        >
                          第{classCode}類
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'messages' && (
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
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">読み込み中...</span>
        </div>
      }
    >
      <CaseDetailContent />
    </Suspense>
  );
}

