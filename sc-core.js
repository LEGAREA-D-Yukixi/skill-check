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

  const api = {
    normalizeName: normalizeName,
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

  /* ---- Touch ID / Face ID の登録（Mac は電源ボタン） ---- */
  async function bioRegister(profile) {
    const userId = randomBytes(16);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: (cfg().ORG_NAME || 'SkillCheck') + ' SkillCheck', id: location.hostname },
        user: {
          id: userId,
          name: (profile.name || 'candidate') + '@skillcheck',
          displayName: profile.name || '受験者',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) throw new Error('認証がキャンセルされました');
    return { method: 'webauthn', credId: bufToB64url(cred.rawId), at: new Date().toISOString() };
  }

  /* ---- 提出時の再認証 ---- */
  async function bioAssert(credId) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: credId ? [{ type: 'public-key', id: b64urlToBuf(credId) }] : [],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    if (!assertion) throw new Error('認証がキャンセルされました');
    return { ok: true, at: new Date().toISOString() };
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

  async function sbInsert(table, row, returnRow) {
    const c = cfg();
    const res = await fetch(c.SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': c.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + c.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': returnRow ? 'return=representation' : 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error('保存に失敗しました (' + res.status + ') ' + (await res.text()));
    return returnRow ? (await res.json())[0] : null;
  }

  function localPush(key, row) {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(row);
    localStorage.setItem(key, JSON.stringify(list));
    return row;
  }

  async function saveSession(row) {
    if (sbReady()) return await sbInsert('sc_sessions', row, true);
    const local = Object.assign({ id: 'local-' + Date.now(), created_at: new Date().toISOString() }, row);
    return localPush('sc_sessions', local);
  }

  async function saveResult(row) {
    if (sbReady()) return await sbInsert('sc_results', row, true);
    const local = Object.assign({ id: 'local-' + Date.now(), created_at: new Date().toISOString() }, row);
    return localPush('sc_results', local);
  }

  Object.assign(api, {
    detectCaps: detectCaps,
    bioRegister: bioRegister,
    bioAssert: bioAssert,
    openCamera: openCamera,
    closeCamera: closeCamera,
    snapPhoto: snapPhoto,
    sbReady: sbReady,
    saveSession: saveSession,
    saveResult: saveResult,
    bufToB64url: bufToB64url,
    b64urlToBuf: b64urlToBuf,
  });

  return api;
});
