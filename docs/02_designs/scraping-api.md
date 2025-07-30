# 基本設計書：スクレイピング API

## 1. 概要

本ドキュメントは、要件定義書：レンタカー情報スクレイピング機能に基づき、API のアーキテクチャ、処理フロー、およびセキュリティ設計を定義する。

## 2. システム構成図

```
graph TD
    subgraph "Cloudflare"
        Cron[Cron Trigger] -->|1. 定時実行| Worker
        User_Browser -- "2. API Call `/api/scrape`" --> Next_Pages[Next.js on Pages]
        Next_Pages -- "3. Proxy Request" --> Worker[Cloudflare Worker / Pages Function]
        Worker -- "4. Scrape" --> Target_Site[トヨタレンタカー公式サイト]
        Worker -- "5. Read/Write" --> D1[D1 Database]
        subgraph "WAF"
            direction LR
            Firewall{{Firewall Rules}} -- "Block" --> Internet
        end
        Next_Pages -- "Allow" --> Firewall
    end

    subgraph "Internet"
        User_Browser
        Internet[External Attacker] -- "Blocked" --> Firewall
    end

    style Cron fill:#f9f,stroke:#333,stroke-width:2px
    style Worker fill:#f9f,stroke:#333,stroke-width:2px
    style D1 fill:#f9f,stroke:#333,stroke-width:2px
    style WAF fill:#ccf,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
```

- 実行トリガー: Cloudflare Cron Trigger による定時実行、またはユーザー操作による手動実行。
- 実行本体: Cloudflare Pages Functions 上で動作する Hono アプリケーション（Worker）。
- データストア: Cloudflare D1。
- セキュリティ: Cloudflare WAF, API キー認証, CORS ポリシーによる多層防御。

## 3. アーキテクチャと責務分離

本システムは、フロントエンドとバックエンドを明確に分離した BFF (Backend For Frontend) パターンを採用する。

**コンポーネント:** 役割（責務）
**Next.js API (BFF Proxy):** API キーの隠蔽と安全なリクエスト中継。クライアント（ブラウザ）とバックエンド（Worker）の間の安全な通信を担保する。フロントエンドからのリクエストを受け、サーバーサイドで管理する API キーを付与して Worker に転送する。
**Cloudflare Worker (Pages Function):** スクレイピング処理の実行本体。API キー認証、CORS ポリシーの検証、スクレイピングロジックの実行、D1 データベースとの連携など、全てのコアなビジネスロジックを担当する。

## 4. API エンドポイント定義

エンドポイント メソッド 説明(テーブル定義で修正予定)
/api/scrape POST スクレイピング処理を手動で実行する。

## 5. 処理フロー（シーケンス図）

```
sequenceDiagram
    participant Cron as Cron Trigger
    participant User as User (Browser)
    participant Next as Next.js API Proxy
    participant Worker as Pages Function
    participant D1 as D1 Database

    alt Cron実行
        Cron->>+Worker: 定時実行 (Cf-Cronヘッダー付き)
        Worker->>D1: メタデータ取得
        Note right of Worker: スクレイピング実行
        Worker->>D1: データ保存
        Worker-->>-Cron: 実行完了
    end

    alt 手動実行
        User->>+Next: POST /api/scrape
        Next->>+Worker: Proxy Request (APIキー付き)
        Worker->>D1: メタデータ取得
        Note right of Worker: スクレイピング実行
        Worker->>D1: データ保存
        Worker-->>-Next: 実行結果 (JSON)
        Next-->>-User: レスポンス転送
    end
```

## 6. セキュリティ設計

本 API は、複数のセキュリティレイヤーを組み合わせた多層防御 (Defense in Depth) アプローチを採用する。

| 保護対象レイヤー           | 脅威シナリオ                         | 対策                                         | 担当コンポーネント     |
| :------------------------- | :----------------------------------- | :------------------------------------------- | :--------------------- |
| **ネットワークエッジ**     | 外部からの`curl`等による直接攻撃     | **IP アドレス制限**                          | **Cloudflare WAF**     |
| **Worker API (サーバー)**  | 不正なプログラムからの直接攻撃       | **API キー認証** (`Authorization`ヘッダー)   | **Cloudflare Worker**  |
| **Worker API (ブラウザ)**  | 他の悪意のあるサイトからのリクエスト | **CORS ポリシー** (`Allowed-Origin`ヘッダー) | **Cloudflare Worker**  |
| **Next.js API (ブラウザ)** | 他の悪意のあるサイトからのリクエスト | **同一オリジンポリシー** (デフォルト)        | **Next.js / ブラウザ** |

### 6.1. 認証フロー

**1. Cron Trigger:** Cf-Cron: true ヘッダーの存在を検証する。このヘッダーは Cloudflare インフラ内部でのみ付与され、偽装不可。
**1. Next.js Proxy:** Authorization: Bearer [API_KEY]ヘッダーの存在と値を検証する。API キーはサーバーサイド（環境変数）でのみ管理され、クライアントには公開されない。

## 7. エラーハンドリング

要件定義書 4.3 節に基づき、恒久エラーと一時エラー（サーキットブレーカー）のロジックを実装する。

- 恒久エラー (permanent_error): サイト構造の変更など、手動介入が必要なエラー。検知後、処理は完全に停止する。
- 一時エラー (timeout_error): 5 回連続のタイムアウトで発動。5 分間処理を停止した後、自動で再開する。
- 手動復旧 (after_restoration): permanent_error から管理者が手動で復旧させた後の初回実行を示すステータス。復旧通知のトリガーとなる。
