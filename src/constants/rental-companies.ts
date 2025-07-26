// 店舗データの型を定義
export type Company = {
  value: string; // value属性用のユニークな値
  label: string; // 表示用のラベル
};

export type Region = {
  label: string;
  companies: Company[];
};

// データを定義し、exportする
export const RENTAL_COMPANIES: readonly Region[] = [
  {
    label: "北海道地区",
    companies: [{ value: "h-hakodate", label: "(株)トヨタレンタリース函館" }],
  },
  {
    label: "東北地区",
    companies: [
      { value: "t-aomori", label: "(株)トヨタレンタリース青森" },
      { value: "t-iwate", label: "(株)トヨタレンタリース岩手" },
      { value: "t-miyagi", label: "(株)トヨタレンタリース宮城" },
      { value: "t-sendai", label: "(株)トヨタレンタリース仙台" },
      { value: "t-yamagata", label: "(株)トヨタレンタリース山形" },
      { value: "t-fukushima", label: "(株)トヨタレンタリース福島" },
      { value: "t-shin-fukushima", label: "(株)トヨタレンタリース新福島" },
    ],
  },
  {
    label: "関東地区",
    companies: [
      {
        value: "k-mobility-service",
        label: "トヨタモビリティサービス株式会社",
      },
      { value: "k-sd-nishitokyo", label: "トヨタS＆Dレンタシェア西東京(株)" },
      { value: "k-kanagawa", label: "(株)トヨタレンタリース神奈川" },
    ],
  },
  {
    label: "中部地区",
    companies: [
      { value: "c-nagano", label: "(株)トヨタレンタリース長野" },
      { value: "c-shizuoka", label: "(株)トヨタレンタリース静岡" },
      { value: "c-shizuoka-toyota", label: "静岡トヨタ自動車(株)" },
      { value: "c-aichi", label: "(株)トヨタレンタリース愛知" },
      { value: "c-nagoya", label: "(株)トヨタレンタリース名古屋" },
    ],
  },
  {
    label: "近畿地区",
    companies: [
      { value: "ki-kyoto", label: "(株)トヨタレンタリース京都" },
      { value: "ki-osaka", label: "(株)トヨタレンタリース大阪" },
      { value: "ki-shin-osaka", label: "(株)トヨタレンタリース新大阪" },
    ],
  },
  {
    label: "九州地区",
    companies: [
      { value: "kyu-fukuoka", label: "(株)トヨタレンタリース福岡" },
      { value: "kyu-saga", label: "(株)トヨタレンタリース佐賀" },
      { value: "kyu-nagasaki", label: "(株)トヨタレンタリース長崎" },
      { value: "kyu-kumamoto", label: "(株)トヨタレンタリース熊本" },
      { value: "kyu-oita", label: "(株)トヨタレンタリース大分" },
      { value: "kyu-miyazaki", label: "(株)トヨタレンタリース宮崎" },
      { value: "kyu-kagoshima", label: "(株)トヨタレンタリース鹿児島" },
    ],
  },
];
