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

カメラで顔写真を撮影して記録します。指紋認証（WebAuthn）は使用しません。

| `BIOMETRIC_MODE` | 動作 |
|---|---|
| `photo`（既定） | 受験開始時に顔写真を1枚撮影。提出時にも自動で1枚撮影（`PHOTO_ON_FINISH`） |
| `off` | 本人確認なし |

- カメラが使えない端末・httpsでない場合は「確認なしで続ける」が表示されます（記録は `skipped`）
- 撮影後に氏名や生年月日を変更すると、確認済み状態は解除され撮り直しになります
- 写真は幅360pxのJPEG（品質0.7）で `sc_sessions.photo_start` / `sc_results.photo_end` に保存されます
- 管理画面のサムネイルをタップすると拡大表示できます

**顔写真・生年月日は個人情報です。** 保管期間と閲覧範囲を社内規程に沿って運用してください。

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
