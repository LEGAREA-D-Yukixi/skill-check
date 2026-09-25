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
```js
SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJ...',
```
※ 空のままでも動作します（結果はブラウザのlocalStorageにのみ保存。動作確認用）。

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
| `auto`（既定） | Touch ID / Face ID が使える端末ではそれを使い、無ければ顔写真撮影 |
| `webauthn` | Touch ID / Face ID のみ（**Macは電源ボタン**、iPhoneはFace ID） |
| `photo` | カメラで顔写真を撮影 |
| `off` | 本人確認なし |

- `webauthn` は OS標準のWebAuthn（Touch ID / Face ID / Windows Hello）を使用。外部サービス不要・完全無料。
- 提出時にも再認証（`REAUTH_ON_FINISH`）／再撮影（`PHOTO_ON_FINISH`）を行い、替え玉受験の抑止と証跡に使えます。
- 生体情報そのものは端末外に出ません。サーバーには認証済みかどうかの記録と、顔写真（photoモード時）のみ保存されます。

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
