# CLAUDE.md — ミッションボード プロジェクト指示書

## プロジェクト概要

**アプリ名：ミッションボード**
親子で使うタスク・ルーティン管理アプリ。ADHD気質のある子ども・大人がやるべきことを逃さず、楽しく達成できることをゴールとする。

- **フロントエンド**：React + Vite（PWA対応）
- **データベース**：Google スプレッドシート（Sheets API v4）
- **認証**：Google OAuth 2.0
- **プッシュ通知**：Web Push API（Service Worker）
- **スケジューラー**：Google Apps Script
- **ホスティング**：GitHub Pages

詳細仕様は `docs/spec.md` を参照。

---

## ディレクトリ構成

```
mission-board/
├── public/
│   ├── manifest.json       # PWAマニフェスト
│   └── sw.js               # Service Worker（プッシュ通知）
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api/
│   │   └── sheets.js       # Sheets API ラッパー
│   ├── components/
│   │   ├── parent/         # 親用UIコンポーネント
│   │   └── child/          # 子ども用UIコンポーネント
│   ├── pages/
│   │   ├── ParentApp.jsx   # 親モードのルート
│   │   └── ChildApp.jsx    # 子どもモードのルート
│   ├── hooks/
│   │   └── useAuth.js      # Google OAuth フック
│   └── utils/
│       └── notifications.js # プッシュ通知ユーティリティ
├── gas/
│   └── trigger.gs          # Google Apps Script（通知トリガー）
├── docs/
│   └── spec.md             # 詳細仕様書
├── CLAUDE.md               # この指示書
├── vite.config.js
└── package.json
```

---

## 開発フェーズと優先順位

実装は以下の順で進める。**必ず1フェーズずつ完成させてから次へ進むこと。**

### Phase 1（最優先）：認証・DB・タスクCRUD
- [ ] Google OAuth 2.0 でのログイン
- [ ] Google Sheets API 接続（環境変数でAPI Key管理）
- [ ] タスクの作成・読み取り・更新・削除
- [ ] 親・子どもの役割切り替え

### Phase 2：UI実装
- [ ] 子ども用キッズモード（大きいボタン、アイコン中心）
- [ ] 親用ダッシュボード
- [ ] タスク提案フロー（子ども → 親へ承認依頼）
- [ ] 完了アニメーション（紙吹雪・星エフェクト）

### Phase 3：プッシュ通知
- [ ] Service Worker のセットアップ
- [ ] Web Push API の実装
- [ ] Google Apps Script による定期通知トリガー

### Phase 4：ゲーミフィケーション
- [ ] ポイントシステム
- [ ] バッジ付与ロジック
- [ ] ストリーク（連続達成日数）管理
- [ ] ご褒美交換機能

### Phase 5：最終調整
- [ ] PWA対応の確認（オフライン対応、インストール可能化）
- [ ] GitHub Pages へのデプロイ設定
- [ ] レスポンシブ対応・UX改善

---

## データ構造（Google スプレッドシート）

### シート：`users`
| user_id | name | role | email | parent_id | push_endpoint | created_at |
|---------|------|------|-------|-----------|---------------|------------|
| 文字列 | 文字列 | parent/child | 文字列 | 文字列(子のみ) | 文字列 | ISO8601 |

### シート：`tasks`
| task_id | title | description | type | recurrence | time_block | assigned_to | created_by | created_by_role | approval_status | due_date | point_value | require_approval | icon | status |
|---------|-------|-------------|------|------------|------------|-------------|------------|-----------------|-----------------|----------|-------------|------------------|------|--------|
| 文字列 | 文字列 | 文字列 | routine/spot | daily/weekly/custom | morning/afternoon/evening/night/bedtime | user_id | user_id | parent/child | pending/approved/rejected/- | ISO8601 | 数値1-5 | true/false | 文字列 | active/archived |

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

---

## ユーザー権限ルール

| 操作 | 親 | 子ども |
|------|-----|--------|
| タスク作成（子どもへ割り当て） | ✅ | ❌ |
| タスク作成（自分用・提案） | ✅ | ✅（親の承認後に有効） |
| タスク編集・削除 | ✅ | ❌ |
| タスク完了報告 | ✅ | ✅ |
| 提案の承認・却下 | ✅ | ❌ |
| 通知設定 | ✅ | 時間帯のみ |

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
- シンプルで情報密度の高いダッシュボード
- 子どもの進捗が一目でわかるカード形式
- 承認待ちタスクをバッジで強調

---

## 環境変数（`.env`）

```
VITE_GOOGLE_CLIENT_ID=xxx
VITE_GOOGLE_API_KEY=xxx
VITE_SPREADSHEET_ID=xxx
VITE_VAPID_PUBLIC_KEY=xxx
```

**⚠️ `.env` は `.gitignore` に含めること。GitHubにpushしないこと。**

---

## コーディング規約

- **言語**：JavaScript（TypeScriptは使わない）
- **スタイル**：CSS Modules または Tailwind CSS
- **状態管理**：React Context API（小規模のためRedux不要）
- **コンポーネント**：関数コンポーネント + Hooks のみ
- **エラーハンドリング**：Sheets APIの失敗時はローカルキャッシュにフォールバック
- **コメント**：日本語で記述する

---

## GitHub Pages デプロイ

```bash
# ビルド
npm run build

# デプロイ（gh-pagesパッケージ使用）
npm run deploy
```

`vite.config.js` の `base` はリポジトリ名に合わせること：
```js
base: '/mission-board/'
```

---

## 注意事項

- Google Sheets APIの無料枠：1分あたり60リクエスト。頻繁な読み込みはキャッシュを活用する
- PWAのService Workerはhttps必須。ローカル開発時は`localhost`で動作確認する
- 子ども用UIは実際の子どもに触れてもらい、操作感を都度確認する
