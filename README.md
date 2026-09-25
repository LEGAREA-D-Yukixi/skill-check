# SkillCheck — 採用スキルチェックシステム

株式会社LEGAREA 採用選考用の言語スキル判定ツール。
ChallengeBoard / L-1グランプリと同じ構成（バニラJS + Supabase + GitHub Pages）で、**追加コストゼロ**で運用できます。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | 受験者画面（TOP → 言語一覧 → テスト → 結果） |
| `admin.html` | 管理者画面（受験結果一覧・CSV出力） |
| `sc-core.js` | ロジック（バリデーション・出題生成・採点・本人確認・保存） |
| `sc-questions.js` | 問題データ（10言語 × 10問） |
| `config.js` | 設定（Supabase接続・出題数・合格ライン・本人確認方式） |

**5ファイルは常にセットで配置してください。**

## セットアップ

### 1. Supabase
1. 既存プロジェクト、または採用用に新規プロジェクトを作成
2. 別途お渡しするSQLをSQL Editorで実行（テーブル・RLS・権限）
3. 管理者ユーザーを Authentication > Users から追加

### 2. config.js

Supabase の接続情報は**設定済み**です。そのままアップロードできます。

```js
SUPABASE_URL: 'https://yklwkovbphqmiucnmcmu.supabase.co',
SUPABASE_ANON_KEY: 'sb_publishable_...',
```

プロジェクトを変更する場合のみ書き換えてください。
キーは公開前提の publishable key です。anon に SELECT 権限を与えていないため、
Public リポジトリに置いても応募者データは読み出せません。

### 3. GitHub Pages
1. リポジトリ（例 `skill-check`）を作成
2. 5ファイル＋README.mdをアップロード
3. Settings > Pages > Source: `main` / `(root)`
4. 1〜2分待って `https://legarea-d-yukixi.github.io/skill-check/` を確認

**httpsで配信されていないと生体認証もカメラも動きません。**
ローカルの `file://` では動作しないため、GitHub Pages上で確認してください。

## 本人確認について

`config.js` の `BIOMETRIC_MODE` で切り替えます。

| 値 | 動作 |
|---|---|
| `auto`（既定） | 指紋・顔認証が使える端末ではそれを使い、無ければ顔写真撮影 |
| `webauthn` | 指紋・顔認証のみ（**Macは電源ボタンのTouch ID**、iPhoneはFace ID、Androidは指紋センサー） |
| `photo` | カメラで顔写真を撮影 |
| `off` | 本人確認なし |

### 登録方式（`WEBAUTHN_DEVICE_MODE`）

| 値 | 動作 |
|---|---|
| `false`（既定） | **受験者ごとに指紋を登録する。** 受験者と認証記録が1対1で対応します |
| `true` | 端末に1つだけ登録し、2人目以降は指紋を当てるだけ。端末にパスキーが溜まりません |

`false`（既定）の注意点：

- Chrome では登録のたびに Google パスワードマネージャーの保存画面が挟まることがあります。**Safari を使うと Touch ID のみで完結します。**
- 受験者ごとに端末へ資格情報が残ります。定期的に整理してください
  - Mac: システム設定 → パスワード（「SkillCheck」で検索）
  - Chrome: 設定 → 自動入力とパスワード → パスキー

### 認証の性質について

WebAuthn は「この端末の登録済みの指紋で解除された」ことを証明する仕組みで、**戸籍上の本人と照合するものではありません**。
なりすまし対策の証跡としては `BIOMETRIC_MODE: 'photo'`（顔写真）の方が強力です。用途に応じて選んでください。

- 生体情報そのものは端末外に出ません
- サーバーに残るのは「認証済みかどうか」と、photoモード時の顔写真のみ
- 提出時にも再認証（`REAUTH_ON_FINISH`）／再撮影（`PHOTO_ON_FINISH`）を行います

### エラー表示

ブラウザやAPIが返す英文はそのまま画面に出さず、すべて日本語のメッセージに変換して表示します。
原因調査用の詳細（HTTPステータス、DOMException名、APIの応答本文）はブラウザのコンソールに `[SkillCheck]` 付きで出力されます。

## 運用設定（config.js）

| キー | 既定値 | 内容 |
|---|---|---|
| `QUESTION_COUNT` | 10 | 1言語あたりの出題数（0で全問） |
| `PASS_LINE` | 70 | 合格ライン（100点満点） |
| `SHUFFLE_QUESTIONS` | true | 問題順をシャッフル |
| `SHUFFLE_CHOICES` | true | 選択肢順をシャッフル |
| `SHOW_EXPLANATION` | true | 結果画面で解説を表示 |

## 問題の追加・修正

`sc-questions.js` のみを編集します。

```js
{ q: '問題文',
  choices: ['選択肢1','選択肢2','選択肢3','選択肢4'],
  a: 1,              // 正解のインデックス（0始まり）
  exp: '解説文' },
```

言語を追加する場合は `SC_LANGS` に1行足し、`SC_QUESTIONS` に同じ `key` で配列を追加します。
