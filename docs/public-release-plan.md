# ミッションボード 一般公開に向けた移行計画書

## 1. 背景と方針

### 背景

ミッションボードは当初、制作者自身の家族のみが使用することを想定して開発した。
Google スプレッドシートに編集権限を付与できる少人数の身内利用であり、
データの分離やアクセス制御はアプリ側では行っていない。

今後、家族以外の一般ユーザーに向けてアプリを公開することを検討している。
一般ユーザーには現在使用しているスプレッドシートの編集権限を与えることはできないため、
アーキテクチャの根本的な見直しが必要となる。

### 基本方針

- **現行リポジトリ（`ciquab/mission-board`）はそのまま家族専用として運用を継続する**
- **一般公開版は別プロジェクト（例: `ciquab/mission-board-v2`）として新規に構築する**
- バックエンドを Google Sheets から **Firebase（Firestore）** に移行する
- UIコンポーネントやユーティリティは現行から移植して再利用する
- ネイティブアプリ化は Firebase 移行完了後に改めて検討する（本計画ではスコープ外）

### 別プロジェクトにする理由

1. **既存アプリを壊さない** — 家族が毎日使っている状態。移行中も安定して利用を継続できる
2. **アーキテクチャが根本的に異なる** — 認証・DB・APIラッパー・通知のほぼ全レイヤーが変わるため、同一リポジトリでの段階的書き換えは整合性を保ちにくい
3. **手戻りリスクの回避** — 万が一移行が頓挫しても、既存アプリに影響がない
4. **家族が v2 の先行テストユーザーになれる** — 問題なければ現行を凍結して切り替える

---

## 2. 現状のアーキテクチャと問題点

### 現在のアーキテクチャ

```
[ブラウザ (PWA)]
  ├── Google OAuth 2.0 ログイン
  │     └── スコープ: spreadsheets, userinfo.profile, userinfo.email
  ├── Google Sheets API v4（フロントエンドから直接呼び出し）
  │     ├── 読み取り: OAuthトークン or APIキー
  │     └── 書き込み: OAuthトークン（= ユーザー自身の権限で実行）
  ├── Firebase Cloud Messaging（プッシュ通知）
  └── Service Worker（PWAオフライン対応）

[Google Apps Script]
  └── 定期トリガーで通知スケジュール管理・FCM送信
```

### 問題点一覧

#### 問題1: スプレッドシートの書き込み権限（最大の障壁）

- ユーザーが Google OAuth でログインすると `spreadsheets` スコープの権限が付与され、
  ユーザー**自身の Google アカウントの権限**で Sheets API にアクセスする
- スプレッドシートの「編集者」として共有されていない一般ユーザーは**書き込みができない**
- 一般ユーザーに制作者のスプレッドシートの編集権限を付与するのはセキュリティ上あり得ない
- `spreadsheets` スコープはユーザーの全スプレッドシートへのアクセスを求めることになり、
  一般ユーザーの許可を得にくい

#### 問題2: データの分離がない（マルチテナンシー未対応）

- 全家族のデータが1つのスプレッドシートに格納されている
- ユーザー ID でフィルタリングしているが、API レベルでのアクセス制御がない
- クライアント側で全行を取得してフィルタリングしているため、
  ブラウザの DevTools から他家族のデータを閲覧・改ざんできる
- 1つのスプレッドシートに全ユーザーのデータが集中し、行数制限（500万セル）に達する可能性

#### 問題3: API レート制限

- Google Sheets API の無料枠は**1分あたり60リクエスト**（プロジェクト単位）
- ユーザー数が増えるとすぐにレート制限に到達する
- 例: 50家族 × 親子2名 × ページ表示時の3〜5リクエスト = 1操作で数百リクエスト

#### 問題4: セキュリティ

| リスク | 詳細 |
|--------|------|
| APIキーの露出 | `VITE_GOOGLE_API_KEY` がクライアントサイドに埋め込まれている |
| Firebase設定の露出 | `firebase-messaging-sw.js` に Firebase 設定がハードコードされている |
| クライアントサイドの権限チェック | 親/子どもの権限チェックがフロントエンドのみ。APIレベルでの保護がない |
| データ改ざん | OAuth トークンがあれば、スプレッドシートの任意のデータを書き換え可能 |

#### 問題5: OAuth 同意画面の審査

- `spreadsheets` スコープは**機密性の高いスコープ**に分類される
- 100人以上のユーザーが使用する場合、Google の **OAuth 同意画面の審査**が必要
- 審査には数週間〜数ヶ月かかり、プライバシーポリシーやセキュリティ要件を満たす必要がある

---

## 3. 移行先: Firebase 統合（Firestore + Firebase Auth）

### 選定理由

1. **既に Firebase を使用中** — FCM（プッシュ通知）で Firebase プロジェクト `mission-board-ada39` が存在する
2. **Firestore のセキュリティルール** — データベースレベルでアクセス制御を記述でき、サーバーレスで運用可能
3. **Firebase Authentication** — Google 以外の認証方法も追加可能。`spreadsheets` スコープが不要になる
4. **無料枠が十分** — Spark プラン: Firestore 読み取り 5万回/日、書き込み 2万回/日
5. **リアルタイム同期** — Firestore のリアルタイムリスナーで親子間のデータ反映が即座

### 移行後のアーキテクチャ

```
[ブラウザ (PWA)]
  ├── Firebase Authentication（ログイン）
  │     └── Google プロバイダー（spreadsheetsスコープ不要）
  ├── Cloud Firestore（データベース）
  │     └── セキュリティルールでアクセス制御
  ├── Firebase Cloud Messaging（プッシュ通知）← 現行と同じ
  └── Service Worker（PWA）← 現行と同じ

[Cloud Functions for Firebase]
  ├── 定期通知スケジューラー（GASの代替）
  └── サーバーサイドロジック（必要に応じて）

[Firebase Hosting]
  └── 静的ファイル配信（GitHub Pagesの代替）
```

### 開発フローへの影響

Firebase Hosting に移行しても、**GitHub リポジトリでの開発フローは一切変わらない**。

```
現在:   コード編集 → git push → GitHub Actions → ビルド → GitHub Pages にデプロイ
移行後: コード編集 → git push → GitHub Actions → ビルド → Firebase Hosting にデプロイ
```

GitHub Actions の最終ステップを差し替えるだけで対応可能:

```yaml
# 現在（GitHub Pages）
- uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist

# 移行後（Firebase Hosting）
- uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    channelId: live
    projectId: mission-board-ada39
```

さらに Firebase Hosting のプレビューチャンネル機能により、
PR ごとに一時的なプレビュー URL が自動生成され、マージ前の動作確認が可能になる。

### 現行との対比

| 観点 | 現行（家族向け） | 移行後（一般公開版） |
|------|-----------------|---------------------|
| データベース | Google Spreadsheet | Cloud Firestore |
| 認証 | Google OAuth（spreadsheets スコープ） | Firebase Authentication |
| アクセス制御 | スプレッドシートの共有設定 | Firestore セキュリティルール |
| データ分離 | なし（単一スプレッドシート） | 家族単位のコレクション |
| サーバーロジック | なし（クライアント直接操作） | Cloud Functions |
| 通知スケジューラー | Google Apps Script | Cloud Functions (Scheduled) |
| ホスティング | GitHub Pages | Firebase Hosting |
| スケーラビリティ | 〜10名 | 数千〜数万名 |

---

## 4. Firestore データモデル設計

### コレクション構造

```
firestore/
├── families/{familyId}
│   ├── name: string                    # 家族名
│   ├── createdBy: string (userId)      # 作成者
│   └── createdAt: timestamp
│
├── users/{userId}
│   ├── name: string
│   ├── email: string
│   ├── role: "parent" | "child"
│   ├── familyId: string               # 所属家族
│   ├── parentIds: string[]            # 子どもの場合: 親のID配列
│   ├── fcmToken: string
│   └── createdAt: timestamp
│
├── families/{familyId}/tasks/{taskId}
│   ├── title: string
│   ├── description: string
│   ├── type: "routine" | "spot"
│   ├── recurrence: string
│   ├── timeBlock: string
│   ├── assignedTo: string (userId)
│   ├── createdBy: string (userId)
│   ├── createdByRole: "parent" | "child"
│   ├── approvalStatus: "pending" | "approved" | "rejected" | "-"
│   ├── dueDate: timestamp | null
│   ├── pointValue: number
│   ├── icon: string
│   ├── status: "active" | "archived"
│   └── createdAt: timestamp
│
├── families/{familyId}/taskLogs/{logId}
│   ├── taskId: string
│   ├── userId: string
│   ├── completedAt: timestamp
│   ├── pointsEarned: number
│   └── approvedBy: string | null
│
├── families/{familyId}/rewards/{rewardId}
│   ├── title: string
│   ├── pointCost: number
│   ├── createdBy: string (userId)
│   ├── assignedTo: string (userId)
│   └── status: "active" | "pending" | "redeemed" | "archived"
│
├── families/{familyId}/notifications/{notificationId}
│   ├── taskId: string
│   ├── userId: string
│   ├── type: "reminder" | "followup" | "approval" | "proposal" | "result" | "summary" | "streak"
│   ├── scheduledAt: timestamp
│   ├── sent: boolean
│   └── sentAt: timestamp | null
│
└── users/{userId}/badges/{badgeId}
    ├── badgeType: string
    └── earnedAt: timestamp
```

### 現行スプレッドシートとの対応

| スプレッドシート | Firestore コレクション | 備考 |
|----------------|----------------------|------|
| `users` シート | `users/{userId}` | トップレベルコレクション |
| `tasks` シート | `families/{familyId}/tasks/{taskId}` | 家族のサブコレクション |
| `task_logs` シート | `families/{familyId}/taskLogs/{logId}` | 家族のサブコレクション |
| `rewards` シート | `families/{familyId}/rewards/{rewardId}` | 家族のサブコレクション |
| `badges` シート | `users/{userId}/badges/{badgeId}` | ユーザーのサブコレクション |
| `notifications` シート | `families/{familyId}/notifications/{id}` | 家族のサブコレクション |
| （なし） | `families/{familyId}` | 新規追加: 家族の管理単位 |

---

## 5. Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザー自身のドキュメントのみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ユーザーのバッジ（本人のみ参照可能、書き込みはCloud Functionsから）
    match /users/{userId}/badges/{badgeId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Cloud Functions経由のみ
    }

    // 家族ドキュメント
    match /families/{familyId} {
      allow read: if isFamily(familyId);
      allow create: if request.auth != null;

      // タスク
      match /tasks/{taskId} {
        allow read: if isFamily(familyId);
        allow create: if isFamily(familyId);
        // 編集・削除は親のみ（子どもの提案キャンセル = archiveは例外的に許可）
        allow update: if isFamily(familyId) && (isParent(familyId) || isOwnProposalCancel());
        allow delete: if isFamily(familyId) && isParent(familyId);
      }

      // 完了ログ
      match /taskLogs/{logId} {
        allow read: if isFamily(familyId);
        allow create: if isFamily(familyId);
      }

      // ご褒美
      match /rewards/{rewardId} {
        allow read: if isFamily(familyId);
        allow create: if isFamily(familyId) && isParent(familyId);
        allow update: if isFamily(familyId);
      }

      // 通知
      match /notifications/{notifId} {
        allow read: if isFamily(familyId);
        allow write: if false; // Cloud Functions経由のみ
      }
    }

    // ヘルパー関数
    function isFamily(familyId) {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == familyId;
    }

    function isParent(familyId) {
      return isFamily(familyId)
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'parent';
    }

    function isOwnProposalCancel() {
      // 子どもが自分の提案をアーカイブ（キャンセル）する場合のみ許可
      return resource.data.createdBy == request.auth.uid
        && resource.data.approvalStatus == 'pending'
        && request.resource.data.status == 'archived';
    }
  }
}
```

---

## 6. 認証の移行

### 現行: Google Identity Services（`src/hooks/useAuth.jsx`）

```javascript
// spreadsheets スコープを含むOAuth2トークンを取得
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',   // ← 一般公開時に問題
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

// Google Identity Services のトークンクライアントを使用
const client = google.accounts.oauth2.initTokenClient({ ... })
```

### 移行後: Firebase Authentication

```javascript
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth()
const provider = new GoogleAuthProvider()

// ログイン（spreadsheetsスコープ不要）
const result = await signInWithPopup(auth, provider)
const user = result.user  // uid, displayName, email, photoURL

// セッション管理はFirebase Authが自動で行う
onAuthStateChanged(auth, (user) => {
  if (user) { /* ログイン中 */ }
  else { /* ログアウト */ }
})
```

**移行のメリット:**
- `spreadsheets` スコープが不要 → OAuth 同意画面の審査不要
- トークンの自動更新を Firebase Auth が管理
- `localStorage` での手動セッション管理が不要になる

---

## 7. API ラッパーの移行

### 変更対象: `src/api/sheets.js` → `src/api/firestore.js`

| 現行の関数 | 移行後 |
|-----------|--------|
| `getRows(sheetName, range)` | Firestore クエリに置換 |
| `appendRow(sheetName, row)` | `addDoc()` に置換 |
| `updateRow(sheetName, rowIndex, row)` | `updateDoc()` に置換 |
| `getTasks()` | `getDocs(collection(db, 'families', familyId, 'tasks'))` |
| `getTasksForUser(userId)` | `query(..., where('assignedTo', '==', userId))` |
| `getUserByEmail(email)` | `query(usersRef, where('email', '==', email))` |
| `logTaskCompletion()` | `addDoc()` で taskLogs に追加 |
| `getUserPoints(userId)` | Cloud Functions で集計、またはユーザードキュメントにキャッシュ |
| `getStreak(userId)` | 同上 |
| `getBadges(userId)` | `getDocs(collection(db, 'users', userId, 'badges'))` |
| `checkAndAwardBadges()` | Cloud Functions に移動（サーバーサイドで不正防止） |

### 移行例

```javascript
// === 現行: sheets.js ===
export async function getTasks() {
  const rows = await getRows(SHEETS.TASKS, 'A2:O')
  return rows.map(rowToTask)
}

// === 移行後: firestore.js ===
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function getTasks(familyId) {
  const q = query(
    collection(db, 'families', familyId, 'tasks'),
    where('status', '==', 'active')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

---

## 8. 通知システムの移行

### 現行: Google Apps Script（`gas/trigger.gs`）

- `checkAndSendNotifications`: 5分ごとにスプレッドシートの `notifications` シートを確認して FCM 送信
- `generateDailyNotifications`: 毎日0時にルーティンタスクの通知スケジュールを生成

### 移行後: Cloud Functions for Firebase

```javascript
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// 毎日0時にルーティンタスクの通知スケジュールを生成
exports.generateDailyNotifications = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    // Firestore から対象タスクを取得して通知ドキュメントを生成
  })

// 5分ごとに未送信の通知を確認して送信
exports.checkAndSendNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    // Firestore の notifications コレクションを確認して FCM 送信
  })

// タスク完了時にバッジを自動チェック・付与
exports.onTaskCompleted = functions.firestore
  .document('families/{familyId}/taskLogs/{logId}')
  .onCreate(async (snap, context) => {
    // バッジ条件のチェック・付与をサーバーサイドで実行
  })
```

---

## 9. フロントエンド変更一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useAuth.jsx` | Google Identity Services → Firebase Auth に全面書き換え |
| `src/api/sheets.js` | → `src/api/firestore.js` に置換 |
| `src/utils/initSheets.js` | 削除（Firestore は自動でコレクション作成） |
| `src/pages/RoleSetupPage.jsx` | 家族作成/招待コード参加フローを追加 |
| `src/pages/ChildApp.jsx` | import 先の変更、`familyId` パラメータの追加 |
| `src/pages/ParentApp.jsx` | import 先の変更、`familyId` パラメータの追加 |
| `src/hooks/useNotifications.js` | FCM トークン保存先を Firestore に変更 |
| `vite.config.js` | Sheets API キャッシュ設定を削除 |
| `.env` | `VITE_SPREADSHEET_ID`, `VITE_GOOGLE_API_KEY` を削除 |
| `.github/workflows/deploy.yml` | デプロイ先を Firebase Hosting に変更 |

### 再利用可能な資産

| ファイル | 再利用度 | 備考 |
|---------|---------|------|
| `src/components/child/MissionCard.jsx` | ✅ そのまま | UI のみ |
| `src/components/child/BadgePanel.jsx` | ✅ そのまま | UI のみ |
| `src/components/child/ProposalForm.jsx` | ✅ そのまま | UI のみ |
| `src/components/child/RewardShop.jsx` | ✅ ほぼそのまま | API 呼び出し部分のみ変更 |
| `src/components/parent/TaskCard.jsx` | ✅ そのまま | UI のみ |
| `src/components/parent/TaskForm.jsx` | ✅ そのまま | UI のみ |
| `src/components/parent/ProposalCard.jsx` | ✅ そのまま | UI のみ |
| `src/components/parent/RewardManager.jsx` | ✅ ほぼそのまま | API 呼び出し部分のみ変更 |
| `src/utils/badges.js` | ✅ そのまま | バッジ定義のみ |
| `src/utils/confetti.js` | ✅ そのまま | 紙吹雪エフェクト |
| `src/styles/`, `src/index.css` | ✅ そのまま | スタイル資産 |
| `public/icons/` | ✅ そのまま | アイコン資産 |

---

## 10. 追加で必要な機能

### 家族の招待フロー

現在は「親のメールアドレスで検索して紐付け」だが、一般公開版では以下を検討:

- **招待コード方式**（推奨）: 親が6桁の招待コードを発行 → 子どもがコード入力で参加
- **招待リンク方式**: 親がリンクを共有 → 子どもがリンクから参加
- **QRコード方式**: 親のアプリに QR コードを表示 → 子どもが読み取って参加

### プライバシーポリシーと利用規約

一般公開する場合に必要:
- プライバシーポリシーの策定と公開
- 利用規約の策定
- 子どものデータに関する配慮（個人情報保護法等）

### 既存データの移行スクリプト

現在のスプレッドシートのデータを Firestore に移行するワンショットスクリプト:
- users, tasks, task_logs, rewards, badges の移行
- family ドキュメントの新規作成と紐付け

---

## 11. 移行ロードマップ

```
Step 1: Firebase プロジェクトの拡張設定
        - Firestore の有効化
        - Firebase Authentication の設定（Google プロバイダー有効化）
        - Cloud Functions のセットアップ
            ↓
Step 2: 新規リポジトリ作成・プロジェクト初期化
        - Vite + React プロジェクトの作成
        - Firebase SDK の導入
        - 現行からUIコンポーネント・ユーティリティを移植
            ↓
Step 3: Firestore データモデル・セキュリティルールの実装
        - コレクション構造の確定
        - セキュリティルールの記述とテスト
            ↓
Step 4: 認証の実装
        - Firebase Auth ベースの useAuth を新規作成
        - ログイン・ログアウト・セッション管理のテスト
            ↓
Step 5: データアクセス層の実装
        - firestore.js の作成（sheets.js の全関数を Firestore 版で再実装）
        - 各ページコンポーネントの接続
            ↓
Step 6: 家族管理機能の実装
        - 家族作成・招待コードフローの実装
        - RoleSetupPage の改修
            ↓
Step 7: 通知システムの移行
        - Cloud Functions で通知スケジューラーを実装
        - バッジ自動付与の Cloud Functions 化
            ↓
Step 8: デプロイ設定
        - Firebase Hosting の設定
        - GitHub Actions ワークフローの作成
            ↓
Step 9: テスト・データ移行
        - 家族で先行テスト
        - 既存データの移行スクリプト実行
        - 問題なければ現行アプリを凍結・アーカイブ
            ↓
Step 10: 一般公開
         - プライバシーポリシー・利用規約の公開
         - Firebase Auth の本番環境公開申請
         - ユーザーへの告知・フィードバック収集
```

---

## 12. 並行運用のイメージ

```
時間軸 →

[mission-board（現行）]
  家族が日常利用を継続
  バグ修正・小機能追加は従来通り
                            ↓ v2 での移行準備完了
                          既存データを Firestore に移行
                          家族を v2 に切り替え
                            ↓
                          現行アプリは凍結・アーカイブ

[mission-board-v2（新規）]
  Firebase 基盤でゼロから構築
  UI コンポーネントは現行から移植
  セキュリティルール・マルチテナンシー対応
  一般ユーザー向け機能（招待フロー等）追加
              ↓ 家族で先行テスト
              ↓ 問題なければ一般公開
```
