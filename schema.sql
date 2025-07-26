-- テーブルが存在すれば削除
DROP TABLE IF EXISTS scraped_data;
DROP TABLE IF EXISTS scraping_metadata;

-- scraping_metadata テーブル: スクレイピング処理の全体的な状態を管理
CREATE TABLE scraping_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- 常に1行だけ存在するように制約
  status TEXT DEFAULT 'ok' NOT NULL, -- 現在の状態 ('ok', 'timeout_error', 'permanent_error', 'after_restoration')
  consecutive_timeout_count INTEGER DEFAULT 0 NOT NULL, -- 連続タイムアウト回数
  halted_until TEXT, -- 一時停止が解除される日時 (ISO 8601)
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- 最終更新日時
);

-- scraped_data テーブル: スクレイピングで取得したレンタカー情報を格納
CREATE TABLE scraped_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主キー (自動採番)
  execution_id TEXT NOT NULL, -- 実行ID (どの実行で取得したか)
  is_latest INTEGER NOT NULL DEFAULT 0, -- 最新データの場合は 1、それ以外は 0
  departure_store TEXT NOT NULL, -- 出発店舗 (JSON 文字列)
  return_store TEXT NOT NULL, -- 返却店舗
  car_type TEXT NOT NULL, -- 車種 (JSON 文字列)
  car_condition TEXT NOT NULL, -- 車両条件
  departure_period TEXT NOT NULL, -- 出発期間 (JSON 文字列)
  reservation_phone TEXT NOT NULL, -- 予約電話 (JSON 文字列)
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- 作成日時 (ISO 8601)
);

-- 初期データの挿入
INSERT INTO scraping_metadata (id, status, consecutive_timeout_count) VALUES (1, 'ok', 0);
