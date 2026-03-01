# ミッションボード

親子で使うタスク・ルーティン管理アプリ。ADHD気質のある子どもでも「やるべきことを逃さず・楽しく・達成できる」をコンセプトに設計。

## セットアップ

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
cp .env.example .env
# .env を編集して各キーを設定する
```

`.env` に設定する変数：
```
VITE_GOOGLE_CLIENT_ID=xxx
VITE_GOOGLE_API_KEY=xxx
VITE_SPREADSHEET_ID=xxx

VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_VAPID_KEY=xxx
```

### 3. Google Cloud の設定
1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクトを作成
2. Google Sheets API と Google Identity Services API を有効化
3. OAuth 2.0 クライアントIDを作成（ウェブアプリケーション）
4. 承認済みのJavaScriptオリジンに `http://localhost:5173` と GitHub Pages の URL を追加

### 4. Firebase の設定
1. [Firebase Console](https://console.firebase.google.com) でプロジェクトを作成
2. 「Cloud Messaging」を有効化
3. ウェブアプリを追加し、設定値を `.env` に記入
4. 「ウェブプッシュ証明書」を生成し、VAPID キーを `VITE_FIREBASE_VAPID_KEY` に設定
5. `public/firebase-messaging-sw.js` の Firebase 設定値も同様に更新する（Service Worker はビルド外のため直接記述が必要）

### 5. Google スプレッドシートの準備
1. 新しいスプレッドシートを作成
2. 以下のシートを作成する：`users`, `tasks`, `task_logs`, `notifications`, `rewards`, `badges`
3. 各シートの1行目にヘッダーを設定する（`docs/spec.md` 参照）
4. スプレッドシートIDを `.env` の `VITE_SPREADSHEET_ID` に設定
5. スプレッドシートの共有設定で、OAuth クライアントIDに編集権限を付与する

> スプレッドシートのシート・ヘッダーは、初回ログイン時にアプリが自動で作成を試みます（`src/utils/initSheets.js`）。

### 6. Google Apps Script の設定（プッシュ通知）
1. [script.google.com](https://script.google.com) で新規プロジェクトを作成
2. `gas/trigger.gs` の内容を貼り付ける
3. スクリプトプロパティに以下を設定：
   - `SPREADSHEET_ID`：スプレッドシートのID
   - `FIREBASE_PROJECT_ID`：FirebaseプロジェクトID
4. `appsscript.json` の `oauthScopes` に Firebase Messaging スコープを追加し、スクリプトを手動実行して権限を承認する
5. 時間ベーストリガーを設定：
   - `checkAndSendNotifications`：5分ごと
   - `generateDailyNotifications`：毎日 0時

### 7. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ（GitHub Pages）

```bash
npm run deploy
```

または `master` ブランチへ push すると GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルド＆デプロイします。

## 詳細仕様

`docs/spec.md` および `CLAUDE.md` を参照。

## 技術スタック

- **フロントエンド**: React 18 + Vite（PWA）
- **データベース**: Google スプレッドシート（Sheets API v4）
- **認証**: Google OAuth 2.0（Google Identity Services）
- **プッシュ通知**: Firebase Cloud Messaging（FCM）+ Google Apps Script
- **アニメーション**: canvas-confetti
- **ホスティング**: GitHub Pages
