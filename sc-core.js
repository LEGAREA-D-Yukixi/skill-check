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

  // 生年月日として受け付ける最も古い日付（カレンダーの表示下限と揃える）
  const BIRTH_MIN = '1900-01-01';

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
    if (s < BIRTH_MIN) return { ok: false, value: s, msg: '1900年以降の日付を入力してください' };
    const now = today ? new Date(today + 'T00:00:00Z') : new Date();
    if (dt.getTime() > now.getTime()) return { ok: false, value: '', msg: '未来の日付は入力できません' };
    const age = ageAt(s, isoDate(now));
    if (age < 15) return { ok: false, value: s, msg: '15歳未満は受験できません' };
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
    return c.camera ? 'photo' : 'unavailable';
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

  const CAMERA_ERRORS = {
    NotAllowedError:     'カメラの使用が許可されていません。ブラウザの設定から許可してください',
    NotFoundError:       'カメラが見つかりません',
    NotReadableError:    'カメラを使用できません。他のアプリが使用中の可能性があります',
    OverconstrainedError:'利用できるカメラがありません',
    SecurityError:       '安全な接続（https）で開かれていないため利用できません',
    AbortError:          'カメラの起動が中断されました',
  };

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
    jaCameraError: jaCameraError,
    jaHttpError: jaHttpError,
    jaAuthError: jaAuthError,
    validateName: validateName,
    validateBirth: validateBirth,
    BIRTH_MIN: BIRTH_MIN,
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
    normalizeCode: normalizeCode,
    codeMatch: codeMatch,
    codeVerdict: codeVerdict,
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
    const caps = { camera: false, secure: !!window.isSecureContext };
    try {
      caps.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    } catch (e) { caps.camera = false; }
    if (!caps.secure) caps.camera = false;
    return caps;
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

  /* ---------------------------------------------------------
     記述問題（写経）の照合
     採点は管理画面での目視ですが、一致率を参考値として添えます
     --------------------------------------------------------- */

  // 行末の空白と空行を整え、インデントは保ったまま比較できる形にする
  function normalizeCode(src) {
    return String(src == null ? '' : src)
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map(function (line) { return line.replace(/[ \t]+$/, ''); })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // 空白をすべて畳んだ比較用の形（インデント差を無視する）
  function squashCode(src) {
    return normalizeCode(src).replace(/[ \t]+/g, ' ').replace(/\n/g, '\n');
  }

  // 0-100 の一致率。完全一致は100
  function codeMatch(submitted, answer) {
    const a = normalizeCode(submitted);
    const b = normalizeCode(answer);
    if (!b) return 0;
    if (a === b) return 100;
    const sa = squashCode(a), sb = squashCode(b);
    if (sa === sb) return 98;          // インデントのみ相違
    return Math.round(similarity(sa, sb) * 97);
  }

  // 行単位の最長共通部分列から類似度を出す
  function similarity(a, b) {
    const x = a.split('\n'), y = b.split('\n');
    if (!x.length || !y.length) return 0;
    let prev = new Array(y.length + 1).fill(0);
    for (let i = 1; i <= x.length; i++) {
      const cur = new Array(y.length + 1).fill(0);
      for (let j = 1; j <= y.length; j++) {
        cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      }
      prev = cur;
    }
    return (2 * prev[y.length]) / (x.length + y.length);
  }

  function codeVerdict(pct) {
    if (pct >= 100) return '完全一致';
    if (pct >= 98) return 'インデントのみ相違';
    if (pct >= 80) return 'ほぼ一致';
    if (pct >= 40) return '一部一致';
    return '要確認';
  }

  /* =========================================================
     録画（カメラ映像のみ）
     画面は撮らず、代わりに操作ログを記録します。
     模範解答はログにも映像にも一切入りません。
     ========================================================= */

  function pickMime() {
    const list = [
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=avc1',   // Safari
      'video/mp4',
    ];
    if (typeof MediaRecorder === 'undefined') return '';
    if (!MediaRecorder.isTypeSupported) return 'video/mp4';
    for (let i = 0; i < list.length; i++) {
      if (MediaRecorder.isTypeSupported(list[i])) return list[i];
    }
    return '';
  }

  function canRecord() {
    return typeof MediaRecorder !== 'undefined' && !!pickMime();
  }

  function extFor(mime) {
    return /mp4/.test(mime || '') ? 'mp4' : 'webm';
  }

  function createRecorder(stream, opts) {
    const o = opts || {};
    const mime = pickMime();
    if (!mime) throw new Error('この端末では録画できません');
    const rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: o.bitrate || 150000,   // 低ビットレートで容量を抑える
    });
    const chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    return {
      mime: mime,
      start: function () { rec.start(2000); },
      stop: function () {
        return new Promise(function (resolve) {
          if (rec.state === 'inactive') { resolve(new Blob(chunks, { type: mime })); return; }
          rec.onstop = function () { resolve(new Blob(chunks, { type: mime })); };
          rec.stop();
        });
      },
      state: function () { return rec.state; },
    };
  }

  /* ---- 操作ログ ----
     記録するのは「受験者が何をしたか」だけです。
     模範解答の本文は渡されず、記録もされません。 */
  function createLogger() {
    const events = [];
    const t0 = Date.now();
    let last = '';
    return {
      startedAt: new Date(t0).toISOString(),
      // type: open / choice / code / paste / blur / focus / submit
      add: function (type, data) {
        const e = Object.assign({ t: Date.now() - t0, type: type }, data || {});
        events.push(e);
        return e;
      },
      // コード編集はスナップショットで記録（同じ内容は捨てる）
      snapshot: function (qid, text) {
        const v = String(text == null ? '' : text);
        if (v === last) return null;
        last = v;
        return this.add('code', { qid: qid, v: v });
      },
      resetSnapshot: function () { last = ''; },
      count: function () { return events.length; },
      bytes: function () { return JSON.stringify(events).length; },
      dump: function () { return events.slice(); },
    };
  }

  /* ---- Supabase Storage へのアップロード ---- */
  async function uploadRecording(blob, path) {
    const c = cfg();
    const base = String(c.SUPABASE_URL).replace(/\/+$/, '');
    const bucket = c.RECORDING_BUCKET || 'sc-recordings';
    let res;
    try {
      res = await fetch(base + '/storage/v1/object/' + bucket + '/' + path, {
        method: 'POST',
        headers: {
          'apikey': c.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + c.SUPABASE_ANON_KEY,
          'Content-Type': blob.type || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: blob,
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
      err.body = body;
      throw err;
    }
    return bucket + '/' + path;
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

  // 記述問題の解答（複数件をまとめて1回でINSERT）
  async function saveCodeAnswers(rows) {
    const full = rows.map(function (r) { return Object.assign({ id: newId() }, r); });
    if (!full.length) return [];
    if (sbReady()) { await sbInsert('sc_code_answers', full); return full; }
    full.forEach(function (r) {
      localPush('sc_code_answers', Object.assign({ created_at: new Date().toISOString() }, r));
    });
    return full;
  }

  async function saveLog(row) {
    const full = Object.assign({ id: newId() }, row);
    if (sbReady()) { await sbInsert('sc_logs', full); return full; }
    return localPush('sc_logs', Object.assign({ created_at: new Date().toISOString() }, full));
  }

  Object.assign(api, {
    detectCaps: detectCaps,
    openCamera: openCamera,
    closeCamera: closeCamera,
    snapPhoto: snapPhoto,
    sbReady: sbReady,
    newId: newId,
    saveSession: saveSession,
    saveResult: saveResult,
    saveCodeAnswers: saveCodeAnswers,
    saveLog: saveLog,
    canRecord: canRecord,
    pickMime: pickMime,
    extFor: extFor,
    createRecorder: createRecorder,
    createLogger: createLogger,
    uploadRecording: uploadRecording,
    bufToB64url: bufToB64url,
    b64urlToBuf: b64urlToBuf,
  });

  return api;
});
