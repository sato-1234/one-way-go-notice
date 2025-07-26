/**
 * Next.js APIプロキシとCloudflare Workerの両方で共有される、
 * 許可されたAPIパスのリスト。
 * ここを更新すれば、両方のアプリケーションに自動で反映される。
 */
export const ALLOWED_API_PATHS = [
  "scrape",
  "status", // 将来追加するかもしれないAPI
  "health-check", // 将来追加するかもしれないAPI
] as const; // 'as const' でreadonly

// (オプション) パス名を型としてエクスポートすると、さらに安全になる
export type AllowedApiPath = (typeof ALLOWED_API_PATHS)[number];
