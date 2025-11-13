/**
 * 区分選択関連のユーティリティ
 */

export type AiClassSelection = {
  classCode: string;
  details: string[];
};

/**
 * 詳細項目をサニタイズ（空文字列を除外）
 */
export function sanitizeClassDetails(details: string[]): string[] {
  return details.filter((detail) => detail.trim().length > 0);
}

/**
 * 区分選択を追加または更新
 */
export function upsertClassSelection(
  selections: AiClassSelection[],
  classCode: string,
  details: string[],
): AiClassSelection[] {
  const existingIndex = selections.findIndex(
    (selection) => selection.classCode === classCode,
  );

  if (existingIndex >= 0) {
    const updated = [...selections];
    updated[existingIndex] = { classCode, details };
    return updated;
  }

  return [...selections, { classCode, details }];
}

