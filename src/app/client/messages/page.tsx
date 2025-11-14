"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageSquare, Flag, Clock, User } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Communication = {
  caseId: string;
  caseNumber: string;
  title: string;
  unreadCount: number;
  hasFlaggedMessages: boolean;
  latestMessage: {
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
    createdAt: string;
    isRead: boolean;
  } | null;
  totalMessages: number;
};

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchCommunications = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/messages", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCommunications(data.data.communications || []);
            setTotalUnread(data.data.totalUnread || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch communications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, [user, userLoading, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "たった今";
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">通信一覧</h1>
        {totalUnread > 0 && (
          <Badge variant="destructive" className="text-sm">
            {totalUnread}件の未読
          </Badge>
        )}
      </div>

      {communications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/80 p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">まだ通信がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {communications.map((comm) => (
            <Link
              key={comm.caseId}
              href={`/client/messages/${comm.caseId}`}
              className="block rounded-2xl border border-border bg-card/80 p-6 hover:bg-card transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {comm.title}
                    </h3>
                    {comm.hasFlaggedMessages && (
                      <Flag className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" />
                    )}
                    {comm.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {comm.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    整理番号: {comm.caseNumber}
                  </p>
                  {comm.latestMessage && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {getRoleLabel(comm.latestMessage.sender.role)}: {comm.latestMessage.sender.name}
                        </span>
                        {comm.latestMessage.subject && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium">{comm.latestMessage.subject}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {comm.latestMessage.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(comm.latestMessage.createdAt)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{comm.totalMessages}件</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

