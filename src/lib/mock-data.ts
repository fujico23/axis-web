export type CaseStageKey =
  | "draft"
  | "case_intake"
  | "pre_search"
  | "search_review"
  | "filing_ready"
  | "filed"
  | "examination"
  | "examination_result"
  | "oa_received"
  | "oa_response"
  | "decision"
  | "registration_payment"
  | "intention_confirmation"
  | "registered"
  | "renewal_ready"
  | "in_dispute";

export type CaseStage = {
  key: CaseStageKey;
  label: string;
  description: string;
  milestone?: string;
};

export const caseStages: CaseStage[] = [
  { key: "draft", label: "下書き", description: "下書き状態" },
  { key: "case_intake", label: "申込受付", description: "申込受付済み" },
  { key: "pre_search", label: "事前調査中", description: "事前調査を実施中" },
  { key: "search_review", label: "調査結果共有", description: "調査結果を共有済み" },
  { key: "filing_ready", label: "出願準備中", description: "出願準備中（入金済）" },
  { key: "filed", label: "出願受付済", description: "出願が受付済み" },
  { key: "examination", label: "審査中", description: "審査中" },
  { key: "examination_result", label: "最終結果受領", description: "最終結果を受領" },
  { key: "oa_received", label: "OA受領", description: "拒絶理由通知を受領" },
  { key: "oa_response", label: "中間対応中", description: "中間対応を実施中" },
  { key: "decision", label: "最終結果受領", description: "最終結果を受領" },
  { key: "registration_payment", label: "登録料納付中", description: "登録料納付中" },
  { key: "intention_confirmation", label: "意思表示確認", description: "意思表示を確認" },
  { key: "registered", label: "登録完了", description: "登録が完了" },
  { key: "renewal_ready", label: "更新待ち", description: "更新期限待ち" },
  { key: "in_dispute", label: "係争中", description: "異議申立・無効審判等" },
];

export function getStage(stageKey: CaseStageKey): CaseStage {
  return caseStages.find((s) => s.key === stageKey) ?? caseStages[0];
}

export type CaseListItem = {
  id: string;
  caseId?: string;
  customerNumber?: string;
  title: string;
  markType: "文字" | "図形" | "複合";
  trademarkImage?: string;
  trademarkText?: string;
  trademarkReading?: string;
  hasLogoText?: boolean;
  applicant: string;
  classes: string[];
  stageKey: CaseStageKey;
  hasUnreadCommunications?: boolean;
  createdAt: string;
  updatedAt: string;
};

