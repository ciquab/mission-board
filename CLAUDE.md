# CLAUDE.md — ミッションボード プロジェクト指示書

## プロジェクト概要

**アプリ名：ミッションボード**
親子で使うタスク・ルーティン管理アプリ。ADHD気質のある子ども・大人がやるべきことを逃さず、楽しく達成できることをゴールとする。

- **フロントエンド**：React + Vite（PWA対応）
- **データベース**：Google スプレッドシート（Sheets API v4）
- **認証**：Google OAuth 2.0（Google Identity Services）
- **プッシュ通知**：Firebase Cloud Messaging（FCM）+ Google Apps Script
- **スケジューラー**：Google Apps Script
- **ホスティング**：GitHub Pages

詳細仕様は `docs/spec.md` を参照。

---

## ディレクトリ構成

```
mission-board/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions 自動デプロイ設定
├── public/
│   ├── favicon.svg
│   ├── firebase-messaging-sw.js # FCM バックグラウンド通知 Service Worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # メインルーター・PWAインストールバナー
│   ├── index.css                # ベーススタイル
│   ├── api/
│   │   └── sheets.js            # Sheets API ラッパー
│   ├── components/
│   │   ├── NotificationScheduleModal.jsx  # 通知スケジュール設定モーダル
│   │   ├── parent/
│   │   │   ├── TaskForm.jsx          # タスク作成・編集フォーム
│   │   │   ├── TaskCard.jsx          # タスク一覧カード
│   │   │   ├── ProposalCard.jsx      # 子どもの提案承認カード
│   │   │   ├── ChildProgressCard.jsx # 子どもの進捗サマリーカード
│   │   │   ├── RewardManager.jsx     # ご褒美管理
│   │   │   └── PinSettings.jsx       # 親用PINコード設定
│   │   └── child/
│   │       ├── MissionCard.jsx       # ミッションカード（完了ボタン付き）
│   │       ├── ProposalForm.jsx      # タスク提案フォーム
│   │       ├── BadgePanel.jsx        # バッジ一覧
│   │       ├── RewardShop.jsx        # ご褒美交換ショップ
│   │       └── PinModal.jsx          # PINコード入力モーダル
│   ├── pages/
│   │   ├── LoginPage.jsx        # Google OAuthログイン画面
│   │   ├── RoleSetupPage.jsx    # 親・子どもロール選択画面
│   │   ├── ParentApp.jsx        # 親モードのルート
│   │   └── ChildApp.jsx         # 子どもモードのルート
│   ├── hooks/
│   │   ├── useAuth.jsx          # Google OAuth フック
│   │   └── useNotifications.js  # FCM トークン管理フック
│   ├── styles/
│   │   └── responsive.css       # メディアクエリ・タッチUI調整
│   └── utils/
│       ├── badges.js            # バッジ定義（BADGE_DEFS）
│       ├── confetti.js          # canvas-confetti ラッパー
│       ├── initSheets.js        # スプレッドシート初期化ユーティリティ
│       └── notifications.js     # FCM 初期化・トークン管理ユーティリティ
├── gas/
│   └── trigger.gs              # Google Apps Script（FCM 通知トリガー）
├── docs/
│   └── spec.md                 # 詳細仕様書
├── CLAUDE.md                   # この指示書
├── index.html
├── vite.config.js
└── package.json
```

---

## 開発フェーズと優先順位

**すべてのフェーズ実装済み。**

### Phase 1（完了）：認証・DB・タスクCRUD
- [x] Google OAuth 2.0 でのログイン
- [x] Google Sheets API 接続（環境変数でAPI Key管理）
- [x] タスクの作成・読み取り・更新・削除
- [x] 親・子どもの役割切り替え

### Phase 2（完了）：UI実装
- [x] 子ども用キッズモード（大きいボタン、アイコン中心）
- [x] 親用ダッシュボード（5タブ構成）
- [x] タスク提案フロー（子ども → 親へ承認依頼）
- [x] 完了アニメーション（canvas-confetti 紙吹雪エフェクト）

### Phase 3（完了）：プッシュ通知
- [x] Firebase Cloud Messaging（FCM）のセットアップ
- [x] firebase-messaging-sw.js（バックグラウンド通知 Service Worker）
- [x] Google Apps Script による定期通知トリガー（5分間隔 + 毎日0時）

### Phase 4（完了）：ゲーミフィケーション
- [x] ポイントシステム
- [x] バッジ付与ロジック（8種類）
- [x] ストリーク（連続達成日数）管理
- [x] ご褒美交換機能

### Phase 5（完了）：最終調整
- [x] PWA対応（オフラインキャッシュ、インストール可能化）
- [x] GitHub Pages へのデプロイ設定（GitHub Actions + gh-pages）
- [x] レスポンシブ対応・UX改善

---

## データ構造（Google スプレッドシート）

### シート：`users`
| user_id | name | role | email | parent_id | push_endpoint | created_at |
|---------|------|------|-------|-----------|---------------|------------|
| 文字列 | 文字列 | parent/child | 文字列 | 文字列(子のみ・カンマ区切りで複数親対応) | FCMトークン文字列 | ISO8601 |

### シート：`tasks`
| task_id | title | description | type | recurrence | time_block | assigned_to | created_by | created_by_role | approval_status | due_date | point_value | require_approval | icon | status |
|---------|-------|-------------|------|------------|------------|-------------|------------|-----------------|-----------------|----------|-------------|------------------|------|--------|
| 文字列 | 文字列 | 文字列 | routine/spot | daily/weekly:曜日番号/monthly:日付/custom | morning/afternoon/evening/night/bedtime | user_id | user_id | parent/child | pending/approved/rejected/- | ISO8601 | 数値1-5 | true/false | 文字列 | active/archived |

### シート：`task_logs`
| log_id | task_id | user_id | completed_at | approved_by | approved_at | points_earned |
|--------|---------|---------|--------------|-------------|-------------|---------------|
| 文字列 | 文字列 | 文字列 | ISO8601 | user_id | ISO8601 | 数値 |

### シート：`notifications`
| notification_id | task_id | user_id | type | scheduled_at | sent | sent_at |
|-----------------|---------|---------|------|--------------|------|---------|
| 文字列 | 文字列 | 文字列 | reminder/followup/approval/proposal/result/summary/streak | ISO8601 | true/false | ISO8601 |

### シート：`rewards`
| reward_id | title | point_cost | created_by | assigned_to | status |
|-----------|-------|------------|------------|-------------|--------|
| 文字列 | 文字列 | 数値 | parent_id | child_id | active/redeemed |

### シート：`badges`
| badge_id | user_id | badge_type | earned_at |
|----------|---------|------------|-----------|
| 文字列 | 文字列 | 文字列（下記バッジ種別参照） | ISO8601 |

**バッジ種別（`badge_type`）：**
| badge_type | アイコン | 表示名 | 獲得条件 |
|------------|----------|--------|----------|
| first_mission | 🌟 | はじめてのミッション | 初めてタスクを完了 |
| streak_3 | 🔥 | 3にちれんぞく | 3日連続でルーティン完了 |
| streak_7 | ⚡ | 1しゅうかんれんぞく | 7日連続でルーティン完了 |
| streak_30 | 💎 | 1かげつれんぞく | 30日連続でルーティン完了 |
| points_10 | 🥉 | ブロンズ | 累計ポイント10pt達成 |
| points_50 | 🥈 | シルバー | 累計ポイント50pt達成 |
| points_100 | 🥇 | ゴールド | 累計ポイント100pt達成 |
| all_done | 🏆 | ぜんぶクリア！ | 1日のタスクをすべて完了 |

---

## ユーザー権限ルール

| 操作 | 親 | 子ども |
|------|-----|--------|
| タスク作成（子どもへ割り当て） | ✅ | ❌ |
| タスク作成（自分用・提案） | ✅ | ✅（親の承認後に有効） |
| タスク編集・削除 | ✅ | ❌ |
| タスク完了報告 | ✅ | ✅ |
| 提案の承認・却下 | ✅ | ❌ |
| 通知設定 | ✅ | ❌（親が管理） |

**子どもの提案フロー：**
1. 子どもがタスクを作成 → `approval_status: "pending"` で保存
2. 親にプッシュ通知が届く
3. 親が承認 → `approval_status: "approved"` に更新、ポイント値も親が設定
4. 子どものミッション一覧に表示される
5. 1日の提案上限：5件

---

## UIデザイン方針

### 子ども用キッズモード
- **フォントサイズ**：最小18px、ボタンは最小44px
- **色使い**：明るく鮮やかな配色（青・黄・緑・オレンジ）
- **アイコン**：絵文字を積極使用
- **テキスト**：ひらがな・カタカナ中心、漢字は最小限
- **完了ボタン**：大きくてタップしやすい「できた！」ボタン
- **完了アニメーション**：canvas-confettiを使った紙吹雪エフェクト

### 親用モード
- シンプルで情報密度の高いダッシュボード（5タブ構成）
- タブ：ダッシュボード / タスク管理 / 承認待ち / 履歴 / 設定
- 子どもの進捗が一目でわかるカード形式
- 承認待ちタスクをバッジで強調

---

## 環境変数（`.env`）

```
VITE_GOOGLE_CLIENT_ID=xxx
VITE_GOOGLE_API_KEY=xxx
VITE_SPREADSHEET_ID=xxx

# Firebase（FCM プッシュ通知用）
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_VAPID_KEY=xxx
```

**⚠️ `.env` は `.gitignore` に含めること。GitHubにpushしないこと。**

**⚠️ `public/firebase-messaging-sw.js` にも Firebase の設定値を直接記述する必要がある。**
Service Worker はビルドプロセス外で動作するため `import.meta.env` が使えず、コード内に値を直書きする設計となっている。

---

## Google Apps Script セットアップ

`gas/trigger.gs` を使用して通知スケジューラーを構築する。

1. [script.google.com](https://script.google.com) で新規プロジェクトを作成し、`trigger.gs` の内容を貼り付ける
2. 「プロジェクトの設定」→「スクリプトプロパティ」に以下を設定：
   - `SPREADSHEET_ID`：スプレッドシートのID
   - `FIREBASE_PROJECT_ID`：FirebaseプロジェクトID
3. `appsscript.json` の `oauthScopes` に以下を追加：
   ```json
   {
     "oauthScopes": [
       "https://www.googleapis.com/auth/firebase.messaging",
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/script.external_request"
     ]
   }
   ```
4. スクリプトを一度手動実行して OAuth 権限を承認する
5. 時間ベーストリガーを設定：
   - `checkAndSendNotifications`：5分ごと
   - `generateDailyNotifications`：毎日 0時

---

## コーディング規約

- **言語**：JavaScript（TypeScriptは使わない）
- **スタイル**：インラインスタイル（CSS Modules・Tailwindは未使用）
- **状態管理**：React Context API（小規模のためRedux不要）
- **コンポーネント**：関数コンポーネント + Hooks のみ
- **エラーハンドリング**：Sheets APIの失敗時はローカルキャッシュにフォールバック
- **コメント**：日本語で記述する

---

## GitHub Pages デプロイ

```bash
# ビルド＆デプロイ（gh-pagesパッケージ使用）
npm run deploy
```

または GitHub Actions（`.github/workflows/deploy.yml`）により、`master` ブランチへの push 時に自動デプロイされる。

`vite.config.js` の `base` はリポジトリ名に合わせて設定済み：
```js
base: '/mission-board/'
```

---

## 注意事項

- Google Sheets APIの無料枠：1分あたり60リクエスト。頻繁な読み込みはWorkboxのキャッシュ（NetworkFirst、5分）を活用する
- PWAのService Workerはhttps必須。ローカル開発時は `localhost` で動作確認する
- `firebase-messaging-sw.js` はビルドに含まれないため、Workboxのキャッシュ対象外に設定済み（`vite.config.js` の `globIgnores`）
- 子ども用UIは実際の子どもに触れてもらい、操作感を都度確認する
- GAS のトリガーは通知の15分前リマインダーを `generateDailyNotifications` が毎朝0時に生成する方式
