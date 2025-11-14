"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/useUser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "クライアント",
  INTERNAL_STAFF: "所内担当",
  ATTORNEY: "弁理士",
  ADMIN: "管理者",
};

export default function AdminStaffPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT",
  });

  // 認証チェックと権限チェック
  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // 管理者権限チェック（ADMINのみアクセス可能）
    if (user.role !== "ADMIN") {
      router.push("/client/cases");
      return;
    }
  }, [user, userLoading, router]);

  // スタッフ一覧を取得
  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    // 権限チェック
    if (user.role !== "ADMIN") {
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/staff", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUsers(data.data.users || []);
          }
        } else if (response.status === 403) {
          // 権限がない場合はクライアント画面にリダイレクト
          router.push("/client/cases");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, userLoading, router]);

  // 権限変更
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (updatingUserId) {
      return; // 既に更新中
    }

    setUpdatingUserId(userId);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 一覧を再取得
          const refreshResponse = await fetch("/api/admin/staff", {
            credentials: "include",
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data) {
              setUsers(refreshData.data.users || []);
            }
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || "権限の変更に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("権限の変更中にエラーが発生しました");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // スタッフ追加
  const handleAddStaff = async () => {
    if (isAddingStaff) {
      return;
    }

    // バリデーション
    if (!newStaffForm.name || !newStaffForm.email || !newStaffForm.password) {
      alert("名前、メールアドレス、パスワードは必須です");
      return;
    }

    setIsAddingStaff(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newStaffForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // フォームをリセット
          setNewStaffForm({
            name: "",
            email: "",
            password: "",
            role: "CLIENT",
          });
          // モーダルを閉じる
          setIsAddStaffDialogOpen(false);
          // 一覧を再取得
          const refreshResponse = await fetch("/api/admin/staff", {
            credentials: "include",
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data) {
              setUsers(refreshData.data.users || []);
            }
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || "スタッフの追加に失敗しました");
      }
    } catch (error) {
      console.error("Failed to add staff:", error);
      alert("スタッフの追加中にエラーが発生しました");
    } finally {
      setIsAddingStaff(false);
    }
  };

  // フィルタリング
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // ローディング中または権限チェック中
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 権限がない場合は何も表示しない（リダイレクト処理中）
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="p-6 rounded-2xl border border-border bg-card/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">スタッフ管理</h2>
          <Button
            onClick={() => setIsAddStaffDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            スタッフ追加
          </Button>
        </div>
        <div className="space-y-4">
          {/* 検索入力 */}
          <div className="space-y-2">
            <label
              htmlFor="search"
              className="text-sm font-medium text-muted-foreground"
            >
              検索
            </label>
            <Input
              id="search"
              type="text"
              placeholder="名前、メールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* スタッフ追加モーダル */}
      <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スタッフ追加</DialogTitle>
            <DialogDescription>
              新しいスタッフを追加します。名前、メールアドレス、パスワード、権限を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-staff-name">名前</Label>
              <Input
                id="new-staff-name"
                type="text"
                placeholder="山田 太郎"
                value={newStaffForm.name}
                onChange={(e) =>
                  setNewStaffForm({ ...newStaffForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-staff-email">メールアドレス</Label>
              <Input
                id="new-staff-email"
                type="email"
                placeholder="example@example.com"
                value={newStaffForm.email}
                onChange={(e) =>
                  setNewStaffForm({ ...newStaffForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-staff-password">パスワード</Label>
              <Input
                id="new-staff-password"
                type="password"
                placeholder="パスワードを入力"
                value={newStaffForm.password}
                onChange={(e) =>
                  setNewStaffForm({ ...newStaffForm, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-staff-role">権限</Label>
              <Select
                value={newStaffForm.role}
                onValueChange={(value) =>
                  setNewStaffForm({ ...newStaffForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {ROLE_LABELS[newStaffForm.role] || newStaffForm.role}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">
                    {ROLE_LABELS.CLIENT}
                  </SelectItem>
                  <SelectItem value="INTERNAL_STAFF">
                    {ROLE_LABELS.INTERNAL_STAFF}
                  </SelectItem>
                  <SelectItem value="ATTORNEY">
                    {ROLE_LABELS.ATTORNEY}
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    {ROLE_LABELS.ADMIN}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddStaffDialogOpen(false)}
              disabled={isAddingStaff}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddStaff} disabled={isAddingStaff}>
              {isAddingStaff ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* スタッフ一覧テーブル */}
      <div className="rounded-2xl border border-border bg-card/80">
        <div className="overflow-x-auto">
          <table className="w-full table-auto divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  名前
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  メールアドレス
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  現在の権限
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  権限変更
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  作成日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {users.length === 0 && searchQuery === ""
                      ? "まだスタッフが登録されていません"
                      : "条件に一致するスタッフが見つかりませんでした"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="bg-background/60 hover:bg-muted/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      {userItem.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {userItem.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {ROLE_LABELS[userItem.role] || userItem.role}
                    </td>
                    <td className="px-4 py-3">
                      {userItem.id === user.id ? (
                        <span className="text-sm text-muted-foreground">
                          自分自身
                        </span>
                      ) : (
                        <Select
                          value={userItem.role}
                          onValueChange={(newRole) => {
                            if (newRole !== userItem.role) {
                              handleRoleChange(userItem.id, newRole);
                            }
                          }}
                          disabled={updatingUserId === userItem.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue>
                              {ROLE_LABELS[userItem.role] || userItem.role}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENT">
                              {ROLE_LABELS.CLIENT}
                            </SelectItem>
                            <SelectItem value="INTERNAL_STAFF">
                              {ROLE_LABELS.INTERNAL_STAFF}
                            </SelectItem>
                            <SelectItem value="ATTORNEY">
                              {ROLE_LABELS.ATTORNEY}
                            </SelectItem>
                            <SelectItem value="ADMIN">
                              {ROLE_LABELS.ADMIN}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(userItem.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

