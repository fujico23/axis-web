import prisma from "./prisma";

/**
 * 顧客番号を生成: MJ + 4桁の番号
 * 例: MJ0001
 * アカウント作成時に自動発行される
 */
export async function generateCustomerNumber(): Promise<string> {
  // 既存の顧客番号を取得（MJで始まるもの）
  const existingClients = await prisma.client.findMany({
    where: {
      customerNumber: {
        startsWith: "MJ",
      },
    },
    orderBy: {
      customerNumber: "desc",
    },
    take: 1,
  });

  let sequence = 1;
  if (existingClients.length > 0) {
    const lastCustomerNumber = existingClients[0].customerNumber;
    // MJ0001 から 4桁の数字部分を抽出
    const numberPart = lastCustomerNumber.replace("MJ", "");
    const lastSequence = parseInt(numberPart, 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `MJ${String(sequence).padStart(4, "0")}`;
}

/**
 * 整理番号を生成: MJ + 顧客番号 + 顧客の通し番号
 * 例: MJ00010001
 * 案件作成時に自動発行される
 * @param userId ユーザーID（顧客番号からuserIdを取得するために使用）
 */
export async function generateCaseNumber(userId: string): Promise<string> {
  // ユーザーIDから顧客番号を取得
  const client = await prisma.client.findUnique({
    where: {
      userId,
    },
    select: {
      customerNumber: true,
    },
  });

  if (!client) {
    throw new Error(`Client not found for userId: ${userId}`);
  }

  // 指定されたユーザーIDの案件の最大sequenceNumberを取得
  const existingCases = await prisma.case.findMany({
    where: {
      userId,
    },
    orderBy: {
      sequenceNumber: "desc",
    },
    take: 1,
  });

  let sequence = 1;
  if (existingCases.length > 0) {
    sequence = existingCases[0].sequenceNumber + 1;
  }

  // 顧客番号からMJプレフィックスを除いた部分を取得（例: MJ0001 -> 0001）
  const customerNumberPart = client.customerNumber.replace("MJ", "");
  return `MJ${customerNumberPart}${String(sequence).padStart(4, "0")}`;
}

