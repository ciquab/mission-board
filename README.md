# 🏆 ミッションボード

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

### 3. Google Cloud の設定
1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクトを作成
2. Google Sheets API と Google Identity Services API を有効化
3. OAuth 2.0 クライアントIDを作成（ウェブアプリケーション）
4. 承認済みのJavaScriptオリジンに `http://localhost:5173` と GitHub Pages の URL を追加

### 4. Google スプレッドシートの準備
1. 新しいスプレッドシートを作成
2. 以下のシートを作成する：`users`, `tasks`, `task_logs`, `notifications`, `rewards`
3. 各シートの1行目にヘッダーを設定する（`docs/spec.md` 参照）
4. スプレッドシートIDを `.env` の `VITE_SPREADSHEET_ID` に設定

### 5. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ（GitHub Pages）

```bash
# vite.config.js の base をリポジトリ名に合わせて変更
# 例: base: '/mission-board/'

npm run deploy
```

## 詳細仕様

`docs/spec.md` および `CLAUDE.md` を参照。

## 技術スタック

- **フロントエンド**: React + Vite（PWA）
- **データベース**: Google スプレッドシート（Sheets API v4）
- **認証**: Google OAuth 2.0
- **プッシュ通知**: Web Push API + Google Apps Script
- **ホスティング**: GitHub Pages
