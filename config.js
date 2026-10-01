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
     画面（解答エリアのみ）とカメラ映像を1本に合成して記録します。
     模範解答カードは撮影対象の外に置いてあるため録画に映りません。
     画面の撮影範囲を絞れないブラウザでは、画面を撮らずカメラのみ録画します。 */
  RECORD: true,
  RECORD_SCREEN: true,     // 画面も録画する（Chrome / Edge のみ対応）
  RECORD_BITRATE: 180000,  // 合成映像のビットレート（約1.4MB/分）
  RECORD_CANVAS_W: 720,    // 録画する映像の幅
  RECORD_CANVAS_H: 450,
  RECORD_WIDTH: 320,       // カメラ側の取得解像度
  RECORD_FPS: 5,
  RECORDING_BUCKET: 'sc-recordings',

  /* ---- 表示 ---- */
  ORG_NAME: '株式会社LEGAREA',
  APP_TITLE: 'SkillCheck',
};
