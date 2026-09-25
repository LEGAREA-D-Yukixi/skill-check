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
  QUESTION_COUNT: 10,      // 1言語あたりの出題数（0 = 全問出題）
  PASS_LINE: 70,           // 合格ライン（点／100点満点）
  SHUFFLE_QUESTIONS: true, // 問題順をシャッフル
  SHUFFLE_CHOICES: true,   // 選択肢順をシャッフル
  SHOW_EXPLANATION: true,  // 結果画面で解説を表示

  /* ---- 本人確認 ----
     'auto'     : Touch ID / Face ID が使えれば使い、無ければ顔写真撮影
     'webauthn' : Touch ID / Face ID のみ（Mac の電源ボタン・iPhone の Face ID）
     'photo'    : カメラでの顔写真撮影のみ
     'off'      : 本人確認なし */
  BIOMETRIC_MODE: 'auto',
  /* false（既定）: 受験者ごとに指紋を登録する。受験者と認証記録が1対1で対応する。
     true         : 端末に1つだけ登録し、2人目以降は指紋を当てるだけにする。
                    端末にパスキーが溜まらないが、受験者個別の記録にはならない。 */
  WEBAUTHN_DEVICE_MODE: false,
  PHOTO_ON_FINISH: true,   // 提出時にも顔写真を撮る（替え玉対策）
  REAUTH_ON_FINISH: true,  // 提出時に指紋認証を再要求

  /* ---- 表示 ---- */
  ORG_NAME: '株式会社LEGAREA',
  APP_TITLE: 'SkillCheck',
};
