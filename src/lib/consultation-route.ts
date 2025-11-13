/**
 * 相談ルート関連の型定義
 */

export type UiConsultationRoute = "ai_self_service" | "attorney_consultation";

/**
 * クエリパラメータから相談ルートを正規化
 */
export function normalizeUiConsultationRoute(
  value: string | null | undefined,
): UiConsultationRoute | undefined {
  if (value === "attorney_consultation" || value === "ai_self_service") {
    return value;
  }
  return undefined;
}

