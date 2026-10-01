/* =========================================================
   LEGAREA SkillCheck — 設定ファイル
   ここだけ書き換えれば動きます
   ========================================================= */

window.SC_CONFIG = {
  /* ---- Supabase 接続 ----
     設定済み。プロジェクトを変える場合のみ書き換えてください。
     空文字にすると結果はブラウザのlocalStorageにのみ保存されます（動作確認用）。 */
  SUPABASE_URL: 'https://yklwkovbphqmiucnmcmu.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_V34btW_6HTEdovDYrtiDUw_FDDb93KW',

  /* ---- 受験設定 ---- */
  CHOICE_COUNT: 4,         // 1言語あたりの選択式の出題数
  CODE_COUNT: 6,           // 1言語あたりの記述式（写経）の出題数
  PASS_LINE: 70,           // 選択式の合格ライン（点／100点満点）
  SHUFFLE_QUESTIONS: true, // 問題順をシャッフル
  SHUFFLE_CHOICES: true,   // 選択肢順をシャッフル
  SHOW_EXPLANATION: true,  // 結果画面で解説を表示

  /* ---- 録画 ----
     カメラ映像と操作ログを記録します。画面そのものは録画しません。
     模範解答は映像にもログにも記録されません。 */
  RECORD: true,
  RECORD_BITRATE: 150000,  // 映像のビットレート（約1MB/分）
  RECORD_WIDTH: 320,       // 録画解像度の目安
  RECORD_FPS: 10,
  RECORDING_BUCKET: 'sc-recordings',

  /* ---- 本人確認 ----
     'photo'（既定）: カメラで顔写真を撮影する
     'off'          : 本人確認なし */
  BIOMETRIC_MODE: 'photo',
  PHOTO_ON_FINISH: true,   // 提出時にも顔写真を撮る（替え玉対策）

  /* ---- 表示 ---- */
  ORG_NAME: '株式会社LEGAREA',
  APP_TITLE: 'SkillCheck',
};
