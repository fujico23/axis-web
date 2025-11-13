"use client";

import { Award, Layers, Plus, Search, X, Upload, UserCheck } from "lucide-react";
import { useMemo, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AI_CLASS_DETAILS,
  CATEGORY_OPTIONS,
  NICE_CLASS_OPTIONS,
  isAiCategoryOption,
  type AiCategoryOption,
} from "@/lib/trademark-classes";
import type { AiClassSelection } from "@/lib/trademark-class-selection";
import {
  sanitizeClassDetails,
  upsertClassSelection,
} from "@/lib/trademark-class-selection";
import { formatCurrency } from "@/lib/case-format";
import {
  ATTORNEY_CONSULTATION_FEE,
  ATTORNEY_TOTAL_PRICE,
  BASE_APPLICATION_PRICE,
} from "@/lib/pricing";
import type { UiConsultationRoute } from "@/lib/consultation-route";

export type TrademarkSearchFormData = {
  trademarkType: "文字商標" | "ロゴ・図形商標";
  trademarkText?: string;
  trademarkReading?: string;
  trademarkImage?: string;
  logoHasText?: "あり" | "なし";
  classCategory?: AiCategoryOption;
  classCategoryDetail?: string;
  productService?: string;
  classSelections?: AiClassSelection[];
};

type TrademarkSearchViewProps = {
  onSubmit: (
    params: URLSearchParams,
    formData: TrademarkSearchFormData,
  ) => void;
  initialData?: TrademarkSearchFormData;
  onSelectConsultationRoute?: (route: UiConsultationRoute) => void;
  selectedConsultationRoute?: UiConsultationRoute;
  showHeader?: boolean;
};

/**
 * 画像アップロード処理（モック）
 * TODO: 将来的にAPIに置き換える
 */
async function uploadImageMock(file: File): Promise<{
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}> {
  // モック実装: ローカルでプレビュー用のURLを生成
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve({
        success: true,
        publicUrl: dataUrl,
        filePath: `mock/${file.name}`,
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: "ファイルの読み込みに失敗しました",
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 画像削除処理（モック）
 * TODO: 将来的にAPIに置き換える
 */
async function deleteImageMock(filePath: string): Promise<void> {
  // モック実装: 何もしない
  return Promise.resolve();
}

export default function TrademarkSearchView({
  onSubmit,
  initialData,
  onSelectConsultationRoute,
  selectedConsultationRoute,
  showHeader = true,
}: TrademarkSearchViewProps) {
  const [formData, setFormData] = useState<TrademarkSearchFormData>({
    trademarkType: initialData?.trademarkType ?? "文字商標",
    trademarkText: initialData?.trademarkText ?? "",
    trademarkReading: initialData?.trademarkReading ?? "",
    trademarkImage: initialData?.trademarkImage ?? "",
    logoHasText: initialData?.logoHasText,
    classCategory: initialData?.classCategory,
    classCategoryDetail: initialData?.classCategoryDetail ?? "",
    productService: initialData?.productService ?? "",
    classSelections: initialData?.classSelections ?? [],
  });

  const [showClassModal, setShowClassModal] = useState(false);
  const [currentClassCode, setCurrentClassCode] = useState<string>("");
  const [modalStep, setModalStep] = useState<"class" | "detail">("class");
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [consultationRoute, setConsultationRoute] = useState<UiConsultationRoute>(
    selectedConsultationRoute ?? "ai_self_service",
  );

  // 画像アップロード関連
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.trademarkImage || null,
  );
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasTrademarkInput =
    formData.trademarkType === "文字商標" ||
    formData.logoHasText === "あり"
      ? Boolean(formData.trademarkText?.trim().length)
      : Boolean(formData.trademarkImage);

  const canSearch =
    hasTrademarkInput &&
    Boolean(formData.classSelections && formData.classSelections.length > 0);

  const detailOptions = useMemo(() => {
    if (!currentClassCode) {
      return [];
    }
    return AI_CLASS_DETAILS[currentClassCode] ?? [];
  }, [currentClassCode]);

  // 画像アップロード処理
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadError(null);

      // TODO: 将来的にAPIに置き換える
      const result = await uploadImageMock(file);

      if (result.success && result.publicUrl) {
        setImagePreview(result.publicUrl);
        setUploadedFilePath(result.filePath || null);
        setFormData((prev) => ({
          ...prev,
          trademarkImage: result.publicUrl,
        }));
      } else {
        setUploadError(result.error || "アップロードに失敗しました");
      }

      setIsUploading(false);
    },
    [],
  );

  // ファイル選択時の処理
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  // ドラッグ&ドロップ処理
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  // 画像削除処理
  const handleImageRemove = useCallback(async () => {
    if (uploadedFilePath) {
      // TODO: 将来的にAPIに置き換える
      await deleteImageMock(uploadedFilePath);
    }
    setImagePreview(null);
    setUploadedFilePath(null);
    setFormData((prev) => ({
      ...prev,
      trademarkImage: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedFilePath]);

  const handleSubmit = () => {
    const params = new URLSearchParams();

    if (formData.trademarkText) {
      params.set("standard_character", formData.trademarkText);
    }
    if (formData.trademarkReading) {
      params.set("yomi", formData.trademarkReading);
    }
    if (formData.trademarkType) {
      params.set("type", formData.trademarkType);
    }
    if (formData.logoHasText) {
      params.set("logo_has_text", formData.logoHasText);
    }
    if (formData.classSelections && formData.classSelections.length > 0) {
      const classIds = formData.classSelections
        .map((selection) => selection.classCode)
        .join(",");
      params.set("selected_simgroup_ids", classIds);
    }
    if (formData.classCategory) {
      params.set("class_category", formData.classCategory);
    }
    if (formData.classCategoryDetail) {
      params.set("class_category_detail", formData.classCategoryDetail);
    }
    if (formData.productService) {
      params.set("product_service", formData.productService);
    }
    if (
      formData.trademarkType === "ロゴ・図形商標" &&
      formData.trademarkImage
    ) {
      params.set("trademark_image", formData.trademarkImage);
    }

    if (consultationRoute === "attorney_consultation") {
      params.set("consultation_route", consultationRoute);
    }

    onSubmit(params, formData);
  };

  return (
    <div className="flex flex-col w-full">
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-gradient-to-r from-[#4d9731] to-[#8EBA43] dark:from-[#4d9731] dark:to-[#2A3132] backdrop-blur shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a
              href="/"
              className="font-bold text-xl tracking-tight text-white hover:text-white/90 transition-all duration-300"
            >
              スマート商標.com
            </a>
          </div>
        </header>
      )}

      <div className={`flex-1 bg-gradient-to-b from-[#8EBA43]/5 to-white dark:from-[#2A3132] dark:to-[#1a1f20] ${showHeader ? 'pt-[73px]' : ''} py-12 px-4`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3 pt-8">
            <h1 className="text-3xl font-bold text-[#2A3132] dark:text-[#8EBA43] mb-2">
              商標検索
            </h1>
            <p className="text-lg text-[#2A3132]/70 dark:text-[#8EBA43]/70">
              登録したい商標情報を入力してください
            </p>
          </div>

          <div className="rounded-3xl border-2 border-[#8EBA43]/20 bg-white dark:bg-[#2A3132] shadow-xl p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43] mb-1">
                    商標の種類を選択
                  </h2>
                  <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-4">
                    登録したい商標のタイプを選んでください
                  </p>

                  <RadioGroup
                    value={formData.trademarkType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        trademarkType: value as "文字商標" | "ロゴ・図形商標",
                      }))
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem
                        value="文字商標"
                        id="search-trademark-type-text"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="search-trademark-type-text"
                        className="flex items-center justify-center gap-3 rounded-xl border-2 border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 px-6 py-4 cursor-pointer transition-all hover:border-[#4d9731] peer-data-[state=checked]:border-[#4d9731] peer-data-[state=checked]:bg-[#4d9731]/5 peer-data-[state=checked]:shadow-md"
                      >
                        <Award className="w-5 h-5 text-[#4d9731]" />
                        <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                          文字商標
                        </span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem
                        value="ロゴ・図形商標"
                        id="search-trademark-type-logo"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="search-trademark-type-logo"
                        className="flex items-center justify-center gap-3 rounded-xl border-2 border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 px-6 py-4 cursor-pointer transition-all hover:border-[#4d9731] peer-data-[state=checked]:border-[#4d9731] peer-data-[state=checked]:bg-[#4d9731]/5 peer-data-[state=checked]:shadow-md"
                      >
                        <Layers className="w-5 h-5 text-[#4d9731]" />
                        <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                          ロゴ・図形商標
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43] mb-1">
                      商標情報を入力
                    </h2>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-4">
                      登録したい商標の詳細を入力してください
                    </p>
                  </div>

                  {formData.trademarkType === "文字商標" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="search-trademark-text"
                          className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                        >
                          商標 <span className="text-red-500">*</span>
                        </Label>
                        <input
                          id="search-trademark-text"
                          value={formData.trademarkText ?? ""}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              trademarkText: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                          placeholder="例: miryo.AI"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="search-trademark-reading"
                          className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                        >
                          よみがな
                        </Label>
                        <input
                          id="search-trademark-reading"
                          value={formData.trademarkReading ?? ""}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              trademarkReading: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                          placeholder="例: みりょうえーあい"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="max-w-xs">
                          <Label
                            htmlFor="search-trademark-image"
                            className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                          >
                            商標画像 <span className="text-red-500">*</span>
                          </Label>
                          <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center aspect-square flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isDragging
                                ? "border-[#4d9731] bg-[#4d9731]/10"
                                : "border-[#8EBA43]/30 dark:border-[#4d9731]/40 hover:border-[#4d9731]"
                            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            {isUploading ? (
                              <>
                                <Upload className="w-12 h-12 text-[#4d9731] animate-pulse mb-2" />
                                <p className="text-sm text-[#2A3132] dark:text-[#8EBA43]">
                                  アップロード中...
                                </p>
                              </>
                            ) : imagePreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={imagePreview}
                                  alt="商標画像プレビュー"
                                  className="w-full h-full object-contain rounded"
                                />
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleImageRemove();
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Layers className="w-12 h-12 text-[#8EBA43]/50 mb-2" />
                                <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                                  ドラッグ＆ドロップ
                                  <br />
                                  または
                                  <br />
                                  クリックして選択
                                </p>
                              </>
                            )}
                          </div>
                          {uploadError && (
                            <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                          )}
                          <input
                            ref={fileInputRef}
                            id="search-trademark-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-3 block text-[#2A3132] dark:text-[#8EBA43]">
                            ロゴに文字は含まれますか？
                          </Label>
                          <RadioGroup
                            value={formData.logoHasText ?? "なし"}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                logoHasText: value as "あり" | "なし",
                              }))
                            }
                            className="grid grid-cols-2 gap-3 mt-2"
                          >
                            <div className="relative">
                              <RadioGroupItem
                                value="あり"
                                id="search-logo-has-text-yes"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="search-logo-has-text-yes"
                                className="flex items-center justify-center rounded-lg border-2 border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 px-4 py-3 cursor-pointer transition-all hover:border-[#4d9731] peer-checked:border-[3px] peer-checked:border-[#4d9731] peer-checked:shadow-lg"
                              >
                                <span className="font-medium text-[#2A3132] dark:text-[#8EBA43]">
                                  あり
                                </span>
                              </Label>
                            </div>
                            <div className="relative">
                              <RadioGroupItem
                                value="なし"
                                id="search-logo-has-text-no"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="search-logo-has-text-no"
                                className="flex items-center justify-center rounded-lg border-2 border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 px-4 py-3 cursor-pointer transition-all hover:border-[#4d9731] peer-checked:border-[3px] peer-checked:border-[#4d9731] peer-checked:shadow-lg"
                              >
                                <span className="font-medium text-[#2A3132] dark:text-[#8EBA43]">
                                  なし
                                </span>
                              </Label>
                            </div>
                          </RadioGroup>

                          {formData.logoHasText === "あり" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <Label
                                  htmlFor="search-logo-text"
                                  className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                                >
                                  ロゴに含まれる文字
                                </Label>
                                <input
                                  id="search-logo-text"
                                  value={formData.trademarkText ?? ""}
                                  onChange={(event) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      trademarkText: event.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                                  placeholder="例: miryo.AI"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="search-logo-reading"
                                  className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                                >
                                  よみがな
                                </Label>
                                <input
                                  id="search-logo-reading"
                                  value={formData.trademarkReading ?? ""}
                                  onChange={(event) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      trademarkReading: event.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                                  placeholder="例: みりょうえーあい"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d9731] to-[#8EBA43] flex items-center justify-center shadow-md flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43] mb-1">
                      区分を選択
                    </h2>
                    <p className="text-sm text-[#2A3132]/60 dark:text-[#8EBA43]/60 mb-4">
                      該当する商品・サービスの区分を選択してください
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="search-product-service"
                        className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                      >
                        商品・サービス
                      </Label>
                      <input
                        id="search-product-service"
                        value={formData.productService ?? ""}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            productService: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                        placeholder="例: ソフトウェア開発支援サービス"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="search-category-detail"
                        className="text-sm font-medium mb-2 block text-[#2A3132] dark:text-[#8EBA43]"
                      >
                        具体的な内容
                      </Label>
                      <input
                        id="search-category-detail"
                        value={formData.classCategoryDetail ?? ""}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            classCategoryDetail: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border-2 border-[#8EBA43]/30 dark:border-[#4d9731]/40 bg-white dark:bg-[#2A3132]/50 px-4 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-[#4d9731]/20 focus:border-[#4d9731] hover:border-[#8EBA43] text-[#2A3132] dark:text-[#8EBA43]"
                        placeholder="例: ソフトウェア開発に関するサービス"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block text-[#2A3132] dark:text-[#8EBA43]">
                      登録区分（カテゴリ）
                    </Label>
                    <RadioGroup
                      value={formData.classCategory ?? ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          classCategory: isAiCategoryOption(value)
                            ? value
                            : undefined,
                        }))
                      }
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <div key={option} className="relative">
                          <RadioGroupItem
                            value={option}
                            id={`search-category-${option}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`search-category-${option}`}
                            className="flex items-center gap-3 rounded-xl border-2 border-[#8EBA43]/30 bg-white dark:bg-[#2A3132]/50 px-4 py-3 cursor-pointer transition-all hover:border-[#4d9731] peer-data-[state=checked]:border-[#4d9731] peer-data-[state=checked]:bg-[#4d9731]/5 peer-data-[state=checked]:shadow-sm"
                          >
                            <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                              {option}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(formData.classSelections ?? []).map((selection) => {
                      const classOption = NICE_CLASS_OPTIONS.find(
                        (option) => option.code === selection.classCode,
                      );
                      return (
                        <div
                          key={selection.classCode}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2A3132] rounded-lg border border-[#8EBA43]/30 shadow-sm"
                        >
                          <span className="text-sm font-medium text-[#2A3132] dark:text-[#8EBA43]">
                            第{selection.classCode}類:{" "}
                            {classOption?.description ?? ""}
                          </span>
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                classSelections: (prev.classSelections ?? []).filter(
                                  (item) => item.classCode !== selection.classCode,
                                ),
                              }))
                            }
                            className="text-[#2A3132]/50 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-[#FD9731]/40 bg-gradient-to-r from-[#FD9731]/5 to-[#FD9731]/10 hover:from-[#FD9731]/10 hover:to-[#FD9731]/20 hover:border-[#FD9731] text-[#FD9731] hover:text-[#FD9731] font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setShowConsultationDialog(true)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      区分選択に困ったら弁理士相談型へ！
                    </Button>
                  </div>

                  <div className="flex items-center justify-end gap-2 py-2">
                    <span className="text-xs text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                      現在の選択:
                    </span>
                    <span className="text-xs font-semibold text-[#4d9731] dark:text-[#8EBA43]">
                      {consultationRoute === "attorney_consultation"
                        ? "弁理士相談型"
                        : "簡易ルート（AI活用セルフサービス）"}
                    </span>
                    {consultationRoute === "attorney_consultation" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-6 px-2 text-xs ml-2"
                        onClick={() => {
                          setConsultationRoute("ai_self_service");
                          onSelectConsultationRoute?.("ai_self_service");
                        }}
                      >
                        AIルートに戻す
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setShowClassModal(true);
                      setModalStep("class");
                    }}
                    variant="outline"
                    className="w-full border-2 border-dashed border-[#8EBA43]/40 hover:border-[#4d9731] hover:bg-[#4d9731]/5 py-6 rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2 text-[#4d9731]" />
                    <span className="font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                      区分を追加
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              onClick={handleSubmit}
              disabled={!canSearch}
              className="px-16 py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-[#4d9731] to-[#8EBA43] text-white hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Search className="w-5 h-5 mr-2" />
              類似商標を検索
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={showConsultationDialog}
        onOpenChange={setShowConsultationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>弁理士相談ルートのご案内</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  区分選択が難しい場合は、弁理士相談ルートをご利用いただけます。
                  専任の弁理士がチャットで区分や指定商品・役務の選定をサポートします。
                </p>
                <p>
                  基本価格 {formatCurrency(BASE_APPLICATION_PRICE)} に弁理士相談料 {formatCurrency(ATTORNEY_CONSULTATION_FEE)} が加算され、合計 {formatCurrency(ATTORNEY_TOTAL_PRICE)} でご案内します。
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConsultationDialog(false)}
            >
              戻る
            </Button>
            <Button
              onClick={() => {
                setConsultationRoute("attorney_consultation");
                onSelectConsultationRoute?.("attorney_consultation");
                setShowConsultationDialog(false);
              }}
            >
              弁理士相談ルートを選択する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A3132] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-[#8EBA43]/20 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-[#4d9731]/5 to-[#8EBA43]/5">
              <h3 className="text-xl font-bold text-[#2A3132] dark:text-[#8EBA43]">
                {modalStep === "class" ? "区分を選択" : "詳細項目を選択"}
              </h3>
              <button
                onClick={() => {
                  setShowClassModal(false);
                  setModalStep("class");
                  setSelectedDetails([]);
                  setCurrentClassCode("");
                }}
                className="text-[#2A3132]/60 hover:text-[#4d9731] transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {modalStep === "class" ? (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {NICE_CLASS_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        setCurrentClassCode(option.code);
                        setSelectedDetails(
                          (
                            formData.classSelections?.find(
                              (item) => item.classCode === option.code,
                            )?.details ?? []
                          ).slice(),
                        );
                        setModalStep("detail");
                      }}
                      className="text-left border-2 border-[#8EBA43]/20 rounded-xl p-4 hover:border-[#4d9731] hover:shadow-md transition-all bg-white/80 dark:bg-[#2A3132]/80"
                      type="button"
                    >
                      <p className="text-sm font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        第{option.code}類
                      </p>
                      <p className="text-xs text-[#2A3132]/60 dark:text-[#8EBA43]/60 mt-1">
                        {option.description}
                      </p>
                      {formData.classSelections?.some(
                        (item) => item.classCode === option.code,
                      ) && (
                        <span className="inline-block mt-3 text-xs font-bold text-white bg-[#4d9731] px-2 py-1 rounded-full">
                          選択中
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2A3132] dark:text-[#8EBA43]">
                        第{currentClassCode}類
                      </p>
                      <p className="text-xs text-[#2A3132]/60 dark:text-[#8EBA43]/60">
                        {NICE_CLASS_OPTIONS.find(
                          (option) => option.code === currentClassCode,
                        )?.description ?? ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setModalStep("class");
                        setSelectedDetails([]);
                        setCurrentClassCode("");
                      }}
                      className="text-sm text-[#2A3132]/60 hover:text-[#4d9731]"
                      type="button"
                    >
                      区分一覧に戻る
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detailOptions.map((detail) => {
                      const selected = selectedDetails.includes(detail);
                      return (
                        <button
                          key={detail}
                          onClick={() =>
                            setSelectedDetails((prev) =>
                              prev.includes(detail)
                                ? prev.filter((item) => item !== detail)
                                : [...prev, detail],
                            )
                          }
                          className={`text-left border rounded-lg px-4 py-3 transition-all ${
                            selected
                              ? "border-[#4d9731] bg-[#4d9731]/10 text-[#2A3132]"
                              : "border-[#8EBA43]/20 bg-white/70 dark:bg-[#2A3132]/70 text-[#2A3132]/70 dark:text-[#8EBA43]/70 hover:border-[#4d9731]/40"
                          }`}
                          type="button"
                        >
                          <span className="text-sm font-medium">{detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#8EBA43]/20 px-6 py-4 flex items-center justify-end gap-3 bg-white/80 dark:bg-[#2A3132]/80">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClassModal(false);
                  setModalStep("class");
                  setSelectedDetails([]);
                  setCurrentClassCode("");
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  if (!currentClassCode) {
                    return;
                  }
                  const sanitized = sanitizeClassDetails(selectedDetails);
                  setFormData((prev) => ({
                    ...prev,
                    classSelections: upsertClassSelection(
                      prev.classSelections ?? [],
                      currentClassCode,
                      sanitized,
                    ),
                  }));
                  setShowClassModal(false);
                  setModalStep("class");
                  setSelectedDetails([]);
                  setCurrentClassCode("");
                }}
                disabled={!currentClassCode}
              >
                追加する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

