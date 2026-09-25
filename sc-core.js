/* =========================================================
   LEGAREA SkillCheck — コアロジック
   ブラウザ / Node どちらからも読み込めます（テスト用）
   ========================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SC = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------
     入力バリデーション
     --------------------------------------------------------- */

  function normalizeName(raw) {
    if (raw == null) return '';
    return String(raw)
      .replace(/[\u3000\s]+/g, ' ')   // 全角スペース含め1つの半角スペースへ
      .trim();
  }

  function validateName(raw) {
    const name = normalizeName(raw);
    if (!name) return { ok: false, value: '', msg: '氏名を入力してください' };
    if (name.length < 2) return { ok: false, value: name, msg: '氏名は2文字以上で入力してください' };
    if (name.length > 40) return { ok: false, value: name, msg: '氏名は40文字以内で入力してください' };
    return { ok: true, value: name, msg: '' };
  }

  // today は 'YYYY-MM-DD'（省略時は実行日）
  function validateBirth(raw, today) {
    const s = String(raw || '').trim();
    if (!s) return { ok: false, value: '', msg: '生年月日を入力してください' };
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return { ok: false, value: '', msg: '生年月日の形式が正しくありません' };
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
      return { ok: false, value: '', msg: '存在しない日付です' };
    }
    const now = today ? new Date(today + 'T00:00:00Z') : new Date();
    if (dt.getTime() > now.getTime()) return { ok: false, value: '', msg: '未来の日付は入力できません' };
    const age = ageAt(s, isoDate(now));
    if (age < 15) return { ok: false, value: s, msg: '15歳未満は受験できません' };
    if (age > 100) return { ok: false, value: s, msg: '生年月日を確認してください' };
    return { ok: true, value: s, msg: '' };
  }

  function isoDate(d) {
    return d.toISOString().slice(0, 10);
  }

  function ageAt(birth, on) {
    const b = String(birth).split('-').map(Number);
    const o = String(on).split('-').map(Number);
    let age = o[0] - b[0];
    if (o[1] < b[1] || (o[1] === b[1] && o[2] < b[2])) age--;
    return age;
  }

  /* ---------------------------------------------------------
     乱数（テスト時はシード固定で再現可能）
     --------------------------------------------------------- */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rnd) {
    const r = rnd || Math.random;
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------
     出題生成
     pool : sc-questions.js の1言語分の配列
     opts : { count, shuffleQuestions, shuffleChoices, rnd }
     --------------------------------------------------------- */

  function buildExam(langKey, pool, opts) {
    const o = opts || {};
    const rnd = o.rnd || Math.random;
    if (!Array.isArray(pool) || pool.length === 0) {
      throw new Error('問題が登録されていません: ' + langKey);
    }
    let indexed = pool.map(function (q, i) {
      return { qid: langKey + '-' + (i + 1), src: q };
    });
    if (o.shuffleQuestions !== false) indexed = shuffle(indexed, rnd);

    const n = (!o.count || o.count <= 0) ? indexed.length : Math.min(o.count, indexed.length);
    indexed = indexed.slice(0, n);

    return indexed.map(function (item) {
      const src = item.src;
      let pairs = src.choices.map(function (text, i) { return { text: text, correct: i === src.a }; });
      if (o.shuffleChoices !== false) pairs = shuffle(pairs, rnd);
      return {
        qid: item.qid,
        q: src.q,
        choices: pairs.map(function (p) { return p.text; }),
        answer: pairs.findIndex(function (p) { return p.correct; }),
        exp: src.exp || '',
      };
    });
  }

  /* ---------------------------------------------------------
     採点
     answers : 選択したインデックスの配列（未回答は null）
     --------------------------------------------------------- */

  function gradeExam(exam, answers, passLine) {
    const line = typeof passLine === 'number' ? passLine : 70;
    const total = exam.length;
    const details = exam.map(function (item, i) {
      const picked = (answers && answers[i] != null) ? answers[i] : null;
      return {
        qid: item.qid,
        q: item.q,
        choices: item.choices,
        picked: picked,
        answer: item.answer,
        ok: picked === item.answer,
        exp: item.exp,
      };
    });
    const correct = details.filter(function (d) { return d.ok; }).length;
    const score = scoreOf(correct, total);
    return {
      total: total,
      correct: correct,
      score: score,
      passed: score >= line,
      passLine: line,
      rank: rankOf(score),
      details: details,
    };
  }

  function scoreOf(correct, total) {
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }

  function rankOf(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  function unanswered(exam, answers) {
    const out = [];
    for (let i = 0; i < exam.length; i++) {
      if (!answers || answers[i] == null) out.push(i);
    }
    return out;
  }

  function progressText(answers, total) {
    const done = (answers || []).filter(function (v) { return v != null; }).length;
    return done + ' / ' + total;
  }

  function formatDuration(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + '分' + String(r).padStart(2, '0') + '秒';
  }

  /* ---------------------------------------------------------
     本人確認の方式決定
     --------------------------------------------------------- */

  function resolveBioMode(configMode, caps) {
    const c = caps || {};
    if (configMode === 'off') return 'off';
    if (configMode === 'webauthn') return c.webauthn ? 'webauthn' : 'unavailable';
    if (configMode === 'photo') return c.camera ? 'photo' : 'unavailable';
    // auto
    if (c.webauthn) return 'webauthn';
    if (c.camera) return 'photo';
    return 'unavailable';
  }

  function canStart(state) {
    const s = state || {};
    if (!s.nameOk || !s.birthOk) return false;
    if (s.bioMode === 'off') return true;
    return !!s.bioDone;
  }

  /* ---------------------------------------------------------
     エラーメッセージの日本語化
     ブラウザやAPIが返す英文をそのまま画面に出さないための変換
     --------------------------------------------------------- */

  const BIO_ERRORS = {
    NotAllowedError:     '認証がキャンセルされたか、時間内に完了しませんでした',
    InvalidStateError:   'この端末ではすでに登録されています',
    NotSupportedError:   'この端末は指紋・顔認証に対応していません',
    SecurityError:       '安全な接続（https）で開かれていないため利用できません',
    AbortError:          '処理が中断されました',
    ConstraintError:     '端末の設定により認証を利用できません',
    UnknownError:        '端末側の問題で認証できませんでした',
    TypeError:           '認証の設定に問題があります',
  };

  const CAMERA_ERRORS = {
    NotAllowedError:     'カメラの使用が許可されていません。ブラウザの設定から許可してください',
    NotFoundError:       'カメラが見つかりません',
    NotReadableError:    'カメラを使用できません。他のアプリが使用中の可能性があります',
    OverconstrainedError:'利用できるカメラがありません',
    SecurityError:       '安全な接続（https）で開かれていないため利用できません',
    AbortError:          'カメラの起動が中断されました',
  };

  function jaBioError(e) {
    if (!e) return '認証に失敗しました';
    return BIO_ERRORS[e.name] || '認証に失敗しました';
  }

  function jaCameraError(e) {
    if (!e) return 'カメラを利用できません';
    return CAMERA_ERRORS[e.name] || 'カメラを利用できません';
  }

  function jaHttpError(status) {
    if (status === 0)   return 'ネットワークに接続できません';
    if (status === 401) return '接続キーが正しくありません';
    if (status === 403) return '保存する権限がありません';
    if (status === 404) return '保存先が見つかりません';
    if (status === 409) return 'すでに同じ記録が登録されています';
    if (status === 413) return 'データが大きすぎます';
    if (status === 429) return 'アクセスが集中しています。しばらく待ってからお試しください';
    if (status >= 500)  return 'サーバー側で問題が発生しています';
    return '保存に失敗しました';
  }

  function jaAuthError(status, code) {
    const c = String(code || '');
    if (status === 0) return 'ネットワークに接続できません';
    if (/email_not_confirmed/.test(c))   return 'メールアドレスの確認が完了していません';
    if (/invalid_credentials|invalid_grant/.test(c)) return 'メールアドレスまたはパスワードが正しくありません';
    if (/user_banned/.test(c))           return 'このアカウントは利用できません';
    if (status === 400 || status === 401) return 'メールアドレスまたはパスワードが正しくありません';
    if (status === 429) return 'ログインの試行が多すぎます。しばらく待ってからお試しください';
    if (status >= 500)  return 'サーバー側で問題が発生しています';
    return 'ログインできませんでした';
  }

  const api = {
    normalizeName: normalizeName,
    jaBioError: jaBioError,
    jaCameraError: jaCameraError,
    jaHttpError: jaHttpError,
    jaAuthError: jaAuthError,
    validateName: validateName,
    validateBirth: validateBirth,
    ageAt: ageAt,
    isoDate: isoDate,
    mulberry32: mulberry32,
    shuffle: shuffle,
    buildExam: buildExam,
    gradeExam: gradeExam,
    scoreOf: scoreOf,
    rankOf: rankOf,
    unanswered: unanswered,
    progressText: progressText,
    formatDuration: formatDuration,
    resolveBioMode: resolveBioMode,
    canStart: canStart,
  };

  /* =========================================================
     ここから下はブラウザ専用（本人確認・保存）
     ========================================================= */
  if (typeof window === 'undefined') return api;

  const cfg = function () { return window.SC_CONFIG || {}; };

  /* ---- バイト列 <-> base64url ---- */
  function bufToB64url(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlToBuf(str) {
    const s = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4 ? '===='.slice(s.length % 4) : '';
    const bin = atob(s + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function randomBytes(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return a;
  }

  /* ---- 端末が何に対応しているか ---- */
  async function detectCaps() {
    const caps = { webauthn: false, camera: false, secure: !!window.isSecureContext };
    try {
      if (window.PublicKeyCredential &&
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        caps.webauthn = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch (e) { caps.webauthn = false; }
    try {
      caps.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    } catch (e) { caps.camera = false; }
    if (!caps.secure) { caps.webauthn = false; caps.camera = false; }
    return caps;
  }

  /* ---- 指紋・顔認証（WebAuthn） ----
     既定では受験者ごとに登録し、受験者と認証記録を1対1で対応させる。
     WEBAUTHN_DEVICE_MODE を true にすると端末に1つだけ登録する運用になる。 */
  const DEVICE_CRED_KEY = 'sc_device_cred';

  function hasDeviceCred() {
    try { return !!localStorage.getItem(DEVICE_CRED_KEY); } catch (e) { return false; }
  }
  function getDeviceCred() {
    try { return localStorage.getItem(DEVICE_CRED_KEY); } catch (e) { return null; }
  }
  function clearDeviceCred() {
    try { localStorage.removeItem(DEVICE_CRED_KEY); } catch (e) {}
  }

  /* ---- 指紋の登録 ---- */
  async function bioRegister(profile) {
    const p = profile || {};
    const label = p.device ? 'SkillCheck 受験端末' : (p.name || '受験者');
    const userId = randomBytes(16);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: (cfg().ORG_NAME || 'SkillCheck') + ' SkillCheck', id: location.hostname },
        user: { id: userId, name: label, displayName: label },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',  // 端末内の認証器のみ（QRの別端末連携を出さない）
          userVerification: 'required',         // 指紋・顔の照合を必須にする
          requireResidentKey: false,
          residentKey: 'discouraged',           // 同期パスキーにしない
        },
        hints: ['client-device'],               // この端末で認証する意図を明示
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) throw new Error('登録がキャンセルされました');
    return { method: 'webauthn', credId: bufToB64url(cred.rawId), at: new Date().toISOString() };
  }

  /* ---- 指紋の照合 ---- */
  async function bioAssert(credId) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: credId
          ? [{ type: 'public-key', id: b64urlToBuf(credId), transports: ['internal'] }]
          : [],
        userVerification: 'required',
        hints: ['client-device'],
        timeout: 60000,
      },
    });
    if (!assertion) throw new Error('認証がキャンセルされました');
    return { ok: true, at: new Date().toISOString() };
  }

  /* ---- 受験開始時の本人確認 ---- */
  async function bioVerify(profile) {
    if (cfg().WEBAUTHN_DEVICE_MODE === true) {
      const saved = getDeviceCred();
      if (saved) {
        await bioAssert(saved);
        return { method: 'webauthn', credId: saved, at: new Date().toISOString(), firstTime: false };
      }
      const d = await bioRegister({ device: true });
      try { localStorage.setItem(DEVICE_CRED_KEY, d.credId); } catch (e) {}
      return { method: 'webauthn', credId: d.credId, at: d.at, firstTime: true };
    }
    // 既定：受験者ごとに登録する
    const r = await bioRegister({ name: (profile || {}).name });
    return { method: 'webauthn', credId: r.credId, at: r.at, firstTime: true };
  }

  /* ---- カメラ ---- */
  async function openCamera(videoEl) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    return stream;
  }
  function closeCamera(stream) {
    if (!stream) return;
    stream.getTracks().forEach(function (t) { t.stop(); });
  }
  function snapPhoto(videoEl, maxW) {
    const w = maxW || 360;
    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;
    const scale = Math.min(1, w / vw);
    const cv = document.createElement('canvas');
    cv.width = Math.round(vw * scale);
    cv.height = Math.round(vh * scale);
    cv.getContext('2d').drawImage(videoEl, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.7);
  }

  /* ---- Supabase（未設定なら localStorage にフォールバック） ---- */
  function sbReady() {
    const c = cfg();
    return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
  }

  // anon には SELECT 権限を与えていないため、INSERT結果の行を返させる指定は使えない。
  // id をこちら側で採番して INSERT のみで完結させる。
  function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const b = randomBytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    let h = '';
    for (let i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, '0');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }

  async function sbInsert(table, row) {
    const c = cfg();
    const base = String(c.SUPABASE_URL).replace(/\/+$/, '');
    let res;
    try {
      res = await fetch(base + '/rest/v1/' + table, {
        method: 'POST',
        headers: {
          'apikey': c.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + c.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(row),
      });
    } catch (e) {
      const err = new Error('ネットワークに接続できません');
      err.status = 0;
      throw err;
    }
    if (!res.ok) {
      const body = await res.text().catch(function () { return ''; });
      const err = new Error(jaHttpError(res.status));
      err.status = res.status;
      err.body = body;       // 英文の詳細はコンソール確認用。画面には出さない
      throw err;
    }
    return row;
  }

  function localPush(key, row) {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(row);
    localStorage.setItem(key, JSON.stringify(list));
    return row;
  }

  async function saveSession(row) {
    const full = Object.assign({ id: newId() }, row);
    if (sbReady()) { await sbInsert('sc_sessions', full); return full; }
    return localPush('sc_sessions', Object.assign({ created_at: new Date().toISOString() }, full));
  }

  async function saveResult(row) {
    const full = Object.assign({ id: newId() }, row);
    if (sbReady()) { await sbInsert('sc_results', full); return full; }
    return localPush('sc_results', Object.assign({ created_at: new Date().toISOString() }, full));
  }

  Object.assign(api, {
    detectCaps: detectCaps,
    bioRegister: bioRegister,
    bioAssert: bioAssert,
    bioVerify: bioVerify,
    hasDeviceCred: hasDeviceCred,
    getDeviceCred: getDeviceCred,
    clearDeviceCred: clearDeviceCred,
    openCamera: openCamera,
    closeCamera: closeCamera,
    snapPhoto: snapPhoto,
    sbReady: sbReady,
    newId: newId,
    saveSession: saveSession,
    saveResult: saveResult,
    bufToB64url: bufToB64url,
    b64urlToBuf: b64urlToBuf,
  });

  return api;
});
