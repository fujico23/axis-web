"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Flag, FlagOff, User } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Message = {
  id: string;
  content: string;
  subject: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  isFlagged: boolean;
  attachments: any;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt: string | null;
};

type CaseData = {
  id: string;
  caseNumber: string;
  title: string;
};

export default function MessageDetailPage({
  params,
}: {
  params: { caseId: string };
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const caseId = params.caseId;

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/messages/${caseId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCaseData(data.data.case);
            setMessages(data.data.messages || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user, userLoading, router, caseId]);

  useEffect(() => {
    // メッセージが更新されたらスクロール
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          setMessages((prev) => [...prev, data.data.message]);
          setContent("");
          setSubject("");
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

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">案件が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/client/messages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{caseData.title}</h1>
          <p className="text-sm text-muted-foreground">
            整理番号: {caseData.caseNumber}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80">
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              まだメッセージがありません
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-4 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex-1 max-w-[70%] ${
                      isOwnMessage ? "items-end" : "items-start"
                    } flex flex-col gap-1`}
                  >
                    <div
                      className={`rounded-lg p-4 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {getRoleLabel(message.sender.role)}: {message.sender.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleFlag(message.id, message.isFlagged)}
                          className="text-xs hover:opacity-80 transition-opacity"
                          type="button"
                        >
                          {message.isFlagged ? (
                            <Flag className="w-4 h-4 text-yellow-500" fill="currentColor" />
                          ) : (
                            <FlagOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {message.subject && (
                        <div className="text-sm font-semibold mb-2">
                          {message.subject}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground px-1">
                      {formatDate(message.createdAt)}
                      {message.isRead && message.readAt && (
                        <span className="ml-2">既読</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4 space-y-2">
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
      </div>
    </div>
  );
}

