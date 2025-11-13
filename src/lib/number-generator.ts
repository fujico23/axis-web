import prisma from "./prisma";

/**
 * 顧客識別番号を生成: YYMMDD + 3桁連番
 * 例: 251117001
 */
export async function generateCustomerIdentifier(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${yy}${mm}${dd}`;

  // 本日作成された顧客識別番号を取得
  const todayClients = await prisma.client.findMany({
    where: {
      customerIdentifier: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      customerIdentifier: "desc",
    },
    take: 1,
  });

  let dailySequence = 1;
  if (todayClients.length > 0) {
    const lastIdentifier = todayClients[0].customerIdentifier;
    const lastSequence = parseInt(lastIdentifier.slice(-3));
    dailySequence = lastSequence + 1;
  }

  return `${datePrefix}${String(dailySequence).padStart(3, "0")}`;
}

