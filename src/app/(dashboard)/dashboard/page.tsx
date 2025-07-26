"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Pencil, Trash2 } from "lucide-react";

import { ServiceItem, ApiResponse } from "@/types/service";
import Header from "@/app/components/header/header";
import { RegionStoreSelector } from "@/app/components/dashboard/region-store-selector";

type FormData = {
  departureRegion: string; // 例: "東北地区"
  departureStore: string; // 例: "t-miyagi"
  returnRegion: string;
  returnStore: string;
  carType: string;
  departurePeriod: string;
};

export default function Dashboard() {
  console.log("Dashboard");

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    setItems([]);

    try {
      const response = await fetch("/api/scrape");
      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: ApiResponse = await response.json();
      setItems(data.serviceItems || []);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    //onSubmitForm(data);
    console.log(data);
    reset(); // フォームリセット（オプション）
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.registration}>
          <h2>指定条件を登録</h2>
          <div className={styles.precautions}>
            <p>
              以下の注意事項をお読みの上、条件登録ボタンから新規登録してください
            </p>
            <ul>
              <li>
                本サービスは約1～2分ごとに片道GO（公式サイト）から情報を取得して指定登録条件が一致する場合、新規追加されたレンタカー情報のみ通知するサービスですが、
                <Link
                  href={process.env.NEXT_PUBLIC_SCRAPING_TARGET_URL!}
                  target="_blank"
                  rel="noopener"
                >
                  片道GO（公式サイト）
                </Link>
                と直接の関係（非公式）はないため、予約を約束するものではありません。
              </li>
              <li>
                ベータ版になりますので、LINE通知は月5回までになります。有料での回数追加やMAILでの通知は現在開発中になります。
              </li>
              <li>
                <span>
                  片道GO（公式サイト）とLINEの外部サービスを利用しているため、外部サービスと連携トラブルがあった場合、LINE通知は届きません。その場合、こちらのサイトでメンテナンス中（サービス停止中）を表示いたします。
                </span>
                {/* <span>連携トラブルでのMAIL通知をご希望する場合は、
                <Link href="">こちら</Link>からMAILを登録してください
                </span> */}
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <RegionStoreSelector
              labelPrefix="出発"
              regionFieldName="departureRegion"
              storeFieldName="departureStore"
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <RegionStoreSelector
              labelPrefix="返却"
              regionFieldName="returnRegion"
              storeFieldName="returnStore"
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <label>
              <span>車種</span>
              <input
                type="text"
                {...register("carType", {
                  minLength: {
                    value: 2,
                    message: "車種は2文字以上で入力してください",
                  },
                  maxLength: {
                    value: 20,
                    message: "車種は20文字以内で入力してください",
                  },
                })}
              />
              <p className={styles.p2}>
                未入力ですべて対象なります。また入力内容に一部一致した車種が対象になります。（入力例：カローラ　→　カローラツリーングなど一部一致も対象）
              </p>
              {errors.carType && (
                <p className={styles.error}>{errors.carType.message}</p>
              )}
            </label>

            <label>
              <span>出発期間</span>
              <input
                type="date"
                {...register("departurePeriod", {
                  min: {
                    value: new Date().toISOString().split("T")[0], // 今日の日付を最小値として設定
                    message: "出発期間は本日以降の日付を選択してください",
                  },
                  pattern: {
                    value: /^\d{4}-\d{2}-\d{2}$/,
                    message:
                      "入力形式が正しくありません（XXXX-XX-XX の日付形式を半角入力）",
                  },
                })}
              />
              <p className={styles.p2}>
                未入力ですべて対象なります。（入力例：2025/07/20　→　2025/07/19～2025/07/21など期間内に含まれる場合も対象）
              </p>
              {errors.departurePeriod && (
                <p className={styles.error}>{errors.departurePeriod.message}</p>
              )}
            </label>

            <div className={styles.sendButton}>
              <button>条件登録</button>
            </div>
          </form>
        </section>

        <section className={styles.list}>
          <h2>登録通知一覧</h2>

          <p>
            <span>LINE残り通知回数：</span>
            <span>4/5</span>
          </p>

          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>出発店舗</th>
                  <th>返却店舗</th>
                  <th>車種</th>
                  <th>出発期間</th>
                  <th>通知方法</th>
                  <th>通知結果</th>
                  <th>編集/削除</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="出発店舗">トヨタレンタリース新福島</td>
                  <td data-label="返却店舗">
                    トヨタモビリティサービス株式会社
                  </td>
                  <td data-label="車種">カローラ</td>
                  <td data-label="出発期間">2025-7-16</td>
                  <td data-label="通知方法">LINE</td>
                  <td data-label="通知結果">待機中</td>
                  <td data-label="編集/削除">
                    <span>
                      <Pencil />
                    </span>
                    <span>
                      <Trash2 />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            登録通知一覧に表示（登録）できる数は最大5つまでになります。通知結果が「通知済み」の場合は、来月に自動削除いたします。
          </p>
        </section>

        <section className={styles.rentalCar}>
          <h2>受付中レンタカー情報</h2>

          {error && <p className={styles.error}>エラー: {error}</p>}

          {items.length > 0 && (
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>出発店舗</th>
                    <th>返却店舗</th>
                    <th>車種／車両条件</th>
                    <th>出発期間</th>
                    <th>予約電話</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.departureStore.store}
                        <br />
                        {item.departureStore.branch}
                        <br />
                        <small>{item.departureStore.small}</small>
                      </td>
                      <td>{item.returnStore}</td>
                      <td>
                        {item.carType.carModel}
                        <br />
                        {item.carType.number}
                        <br />
                        {item.carCondition}
                      </td>
                      <td>
                        {item.departurePeriod.start} ~ <br />
                        {item.departurePeriod.end}
                      </td>
                      <td>
                        {item.reservationPhone.shop}
                        <br />({item.reservationPhone.tel})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <button
          onClick={handleScrape}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? "取得中..." : "スクレイピング実行"}
        </button>
      </main>
    </>
  );
}
