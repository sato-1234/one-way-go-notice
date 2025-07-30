import { Hono } from "hono";
import { type Cheerio, load as cheerioLoad } from "cheerio";
import { type Element } from "domhandler";
import axios from "axios";
import { ServiceItem } from "../../../src/types/service"; // 共有の型をインポート
import { v4 as uuidv4 } from "uuid";

// --- D1の型定義 ---
type D1Database = import("@cloudflare/workers-types").D1Database;

// --- 環境変数の型定義 ---
interface Env {
  DB: D1Database;
  WORKER_SCRAPING_TARGET_URL: string;
}

type Status = "ok" | "timeout_error" | "permanent_error" | "after_restoration";
interface ScrapingMetadata {
  id: number;
  status: Status;
  consecutive_timeout_count: number;
  halted_until: string | null;
  updated_at: string;
}

// --- 設定値 ---
const CONSECUTIVE_TIMEOUT_THRESHOLD = 5;
const HALT_DURATION_MINUTES = 5;

// --- ヘルパー関数 ---
const getTimestamp = () => new Date().toISOString();

// --- スクレイピング指定要素がない場合、try内で使用するヘルパー関数 ---
/**
 * @param baseElement Cheerio<Element>
 * @param selector string
 * @returns Cheerio<Element>
 */
function checkElement(baseElement: Cheerio<Element>, selector: string) {
  const element = baseElement.find(selector);
  if (element.length === 0) {
    throw new Error(
      `HTML構造が変化しています: ${selector}が取得できませんでした`
    );
  }
  return element;
}
function checkData(data: string, name: string) {
  if (!data) {
    throw new Error(`HTML構造が変化しています: ${name}が取得できませんでした`);
  }
}

// "YYYY-MM-DD" 形式から存在する日付か確認するヘルパー関数
function checkDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    throw new Error("HTML構造が変化しています。存在しない日付です");
  }
  const parts = dateStr.split("-");
  if (
    dateObj.getFullYear() !== parseInt(parts[0], 10) ||
    dateObj.getMonth() !== parseInt(parts[1], 10) - 1 ||
    dateObj.getDate() !== parseInt(parts[2], 10)
  ) {
    throw new Error("HTML構造が変化しています。存在しない日付です");
  }
}

// --- D1データベース操作のヘルパー関数 ---
const getMetadata = async (db: D1Database): Promise<ScrapingMetadata> => {
  const stmt = db.prepare("SELECT * FROM scraping_metadata WHERE id = 1");
  const result = await stmt.first<ScrapingMetadata>();
  if (!result) {
    throw new Error("メタデータがデータベースに存在しません。");
  }
  return result;
};

const updateMetadataStatus = async (
  db: D1Database,
  status: Status,
  consecutive_timeout_count = 0,
  halted_until: string | null = null
) => {
  await db
    .prepare(
      "UPDATE scraping_metadata SET status = ?, consecutive_timeout_count = ?, halted_until = ? WHERE id = 1"
    )
    .bind(status, consecutive_timeout_count, halted_until)
    .run();
};

const saveScrapedData = async (db: D1Database, items: ServiceItem[]) => {
  const executionId = uuidv4();

  await db.prepare("UPDATE scraped_data SET is_latest = 0").run();

  const stmt = db.prepare(
    "INSERT INTO scraped_data (execution_id, is_latest, departure_store, return_store, car_type, car_condition, departure_period, reservation_phone) VALUES (?, 1, ?, ?, ?, ?, ?, ?)"
  );

  const batch = items.map((item) =>
    stmt.bind(
      executionId,
      JSON.stringify(item.departureStore),
      item.returnStore,
      JSON.stringify(item.carType),
      item.carCondition,
      JSON.stringify(item.departurePeriod),
      JSON.stringify(item.reservationPhone)
    )
  );

  await db.batch(batch);
};

// _middleware.tsから/scrapeパスでルーティングされる
const scrape = new Hono<{ Bindings: Env }>();

scrape.post("/", async (c) => {
  const { DB, WORKER_SCRAPING_TARGET_URL: TARGET_URL } = c.env;
  const timestamp = getTimestamp();

  // 1. メタデータの取得
  let metadata = await getMetadata(DB);
  const previousStatus = metadata.status;

  // 2. 恒久エラー中の場合
  if (previousStatus === "permanent_error") {
    return c.json(
      { message: "恒久エラー中のため、処理を停止しています。" },
      503
    );
  }

  // 3. 一時停止中の場合
  if (previousStatus === "timeout_error") {
    if (metadata.halted_until && new Date() < new Date(metadata.halted_until)) {
      return c.json(
        {
          message: `連続タイムアウトのため、${metadata.halted_until} まで処理を停止しています。`,
        },
        503
      );
    } else {
      console.log(
        `[${timestamp}] 一時停止期間が終了したため、処理を再開します。`
      );
      // 自動復旧時は 'ok' にする。'after_restoration' は手動復旧時に直接セットする
      metadata.status = "ok";
    }
  }

  try {
    // 4. スクレイピング実行
    const response = await axios.get(TARGET_URL, { timeout: 15000 });
    const $ = cheerioLoad(response.data);

    // 5. データ抽出と検証
    const serviceItems: ServiceItem[] = [];
    const ulElement = checkElement($("body"), "#service-items-shop-type-start");

    ulElement.find("li").each((_idx, el) => {
      const li = $(el);
      if (li.find(".show-entry-end").length > 0) return;

      const departureShopElement = checkElement(
        li,
        ".service-item__shop-start > p:last-of-type"
      );
      const smallText = departureShopElement.find("small").text().trim();
      const mainText = departureShopElement
        .clone()
        .children("small")
        .remove()
        .end()
        .text()
        .trim();
      const mainTextParts = mainText.split(/\s+/);
      const storeName = mainTextParts[0];
      const branchName = mainTextParts.slice(1).join(" ");

      checkData(storeName, "出発店舗（store）");
      checkData(branchName, "出発店舗（branch）");
      checkData(smallText, "出発店舗（small）");

      const departureStore = {
        store: storeName,
        branch: branchName,
        small: smallText,
      };

      const returnShopElement = checkElement(
        li,
        ".service-item__shop-return > p:last-of-type"
      );
      const returnStoreName = returnShopElement
        .clone()
        .children("small")
        .remove()
        .end()
        .text()
        .trim();
      const returnStore = returnStoreName.split(/\s+/)[0];
      checkData(returnStore, "返却店舗");

      const carTypeTextElement = checkElement(
        li,
        ".service-item__info__car-type > p:last-of-type"
      );
      // const carType = carTypeTextElement.text().trim().split(/\s+/)[0];
      const fullText = carTypeTextElement.text().trim();
      // \u3000 は全角スペース
      const matchWithoutKeyword = fullText.match(
        /^([^\s\u3000]+)[\s\u3000]+(.+)$/
      );

      let carModel = "";
      let vehicleNumber = "";

      if (matchWithoutKeyword) {
        // --- パターンA: スペースがあり、車種と車両番号に分割できる場合 ---
        carModel = matchWithoutKeyword[1].trim();
        vehicleNumber = matchWithoutKeyword[2]
          .replace("車両番号", "")
          .replace(/[\s\u3000]/g, "");
      } else {
        // --- パターンB: スペースがなく、車種名のみの場合 ---
        // テキスト全体を車種と見なし、車両番号は空とする
        carModel = fullText;
        vehicleNumber = "";
      }

      checkData(carModel, "車種");
      // checkData(vehicleNumber, "車両番号"); //任意にする
      const carType = {
        carModel: carModel,
        number: vehicleNumber,
      };

      const carConditionElement = checkElement(
        li,
        ".service-item__info__condition > p:last-of-type"
      );
      const carCondition = carConditionElement.text().trim();
      checkData(carCondition, "車両条件");

      const periodElement = checkElement(li, ".service-item__info__date");
      const dateParts = periodElement
        .text()
        .trim()
        .split("～")
        .map((s) => s.trim());
      const startParts = dateParts[0].match(/(\d+)/g);
      const endParts = dateParts[1].match(/(\d+)/g);
      if (
        !startParts ||
        !endParts ||
        startParts.length < 3 ||
        endParts.length < 2
      ) {
        throw new Error(
          "HTML構造が変化しています。出発期間の年月日のフォーマットではありません"
        );
      }
      const [startYear, startMonth, startDay] = startParts;
      const [endMonth, endDay] = endParts;
      const endYear =
        startMonth > endMonth ? parseInt(startYear, 10) + 1 : startYear;
      const startFormattedDateString = `${startYear}-${startMonth.padStart(
        2,
        "0"
      )}-${startDay.padStart(2, "0")}`;
      const endFormattedDateString = `${endYear}-${endMonth.padStart(
        2,
        "0"
      )}-${endDay.padStart(2, "0")}`;

      checkDate(startFormattedDateString);
      checkDate(endFormattedDateString);

      const departurePeriod = {
        start: startFormattedDateString,
        end: endFormattedDateString,
      };

      const reservationPhoneShopElement = checkElement(
        li,
        ".service-item__reserve-shop"
      );
      const reservationPhoneTelElement = checkElement(
        li,
        ".service-item__reserve-tel"
      );
      const reservationPhoneShop = reservationPhoneShopElement.text().trim();
      const reservationPhoneTel = reservationPhoneTelElement.text().trim();
      checkData(reservationPhoneShop, "予約電話（shop）");
      checkData(reservationPhoneTel, "予約電話（tel）");

      const reservationPhone = {
        shop: reservationPhoneShop,
        tel: reservationPhoneTel,
      };

      serviceItems.push({
        departureStore,
        returnStore,
        carType,
        carCondition,
        departurePeriod,
        reservationPhone,
      });
    });

    if (serviceItems.length === 0) {
      await updateMetadataStatus(DB, "permanent_error");
      // ★★ ここに「障害が発生しました」のLINE通知処理を入れる ★★
      throw new Error(
        "スクレイピングデータが抽出できませんでした。HTML構造が変化している可能性があります。"
      );
    }

    // 6. データをD1に保存
    await saveScrapedData(DB, serviceItems);
    // 成功した場合は、必ずステータスを 'ok' にし、カウンターをリセットする
    await updateMetadataStatus(DB, "ok");

    // 7. 正常に処理が完了したので、ステータスを更新
    // 以前の状態がタイムアウトまたは恒久エラーだった場合は、復旧したことをログに出力
    if (previousStatus === "timeout_error") {
      // ★★ ここに「復旧しました」のLINE通知処理を管理者のみ入れる ★★
      console.log(`[${timestamp}] Successfully recovered from timeout state.`);
    }
    // 以前の状態が恒久エラーだった場合は、復旧したことをログに出力（これは手動復旧時の対応）
    if (previousStatus === "after_restoration") {
      // ★★ ここに「復旧しました」のLINE通知処理を入れる ★★
      console.log(`[${timestamp}] 手動復旧完了しました。`);
    }

    return c.json({ serviceItems });
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      // 【ケース1: タイムアウトエラー】
      const newTimeoutCount = metadata.consecutive_timeout_count + 1;
      console.warn(
        `[${timestamp}] [TIMEOUT] Consecutive timeouts: ${newTimeoutCount}/${CONSECUTIVE_TIMEOUT_THRESHOLD}`
      );

      if (newTimeoutCount >= CONSECUTIVE_TIMEOUT_THRESHOLD) {
        const haltUntil = new Date(
          Date.now() + HALT_DURATION_MINUTES * 60 * 1000
        );
        await updateMetadataStatus(
          DB,
          "timeout_error",
          newTimeoutCount,
          haltUntil.toISOString()
        );
        console.error(
          `[${timestamp}] [HALT] System temporarily halted for ${HALT_DURATION_MINUTES} minutes.`
        );
      } else {
        await updateMetadataStatus(DB, "ok", newTimeoutCount);
      }

      return c.json({ message: "Scraping timed out." }, 504);
    } else {
      console.error(
        `[${timestamp}] HTML構造が変化、または予測不可能なエラーが発生しました。`,
        error
      );
      await updateMetadataStatus(DB, "permanent_error");
      return c.json({ message: "A persistent error occurred." }, 500);
    }
  }
});

export default scrape;
