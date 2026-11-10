
/* NADA shared frontend helpers.
   Keep only the Supabase publishable/anon key in browser code.
*/
const SUPABASE_URL = "https://nnctumltrpzjnfqzjehv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZMDTjVcFpY9WYc7zw-sZbw_iIGht7JQ";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);




async function requireSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    document.body.innerHTML =
      "<p dir='rtl'>تعذّر التحقق من الجلسة. أعد تحميل الصفحة.</p>";
    return null;
  }

  if (!data.session) {
    document.body.innerHTML =
      "<div dir='rtl' style='padding:30px;text-align:center'>" +
      "<h2>الجلسة غير موجودة</h2>" +
      "<p>تأكد أنك تدخل من صفحة تسجيل الدخول الصحيحة.</p>" +
      "<a href='index.html'>العودة لتسجيل الدخول</a></div>";
    return null;
  }

  const { data: account, error: accountError } = await db
    .from("shared_accounts")
    .select("id, username, role, is_active")
    .eq("auth_user_id", data.session.user.id)
    .maybeSingle();

  if (accountError) {
    console.error("Account lookup error:", accountError);
    document.body.innerHTML =
      "<div dir='rtl' style='padding:30px'>" +
      "<h2>تعذّر قراءة بيانات الحساب</h2>" +
      "<p>تحقق من جدول shared_accounts وسياسات RLS.</p></div>";
    return null;
  }

  if (!account || !account.is_active) {
    document.body.innerHTML =
      "<div dir='rtl' style='padding:30px'>" +
      "<h2>الحساب غير مربوط أو غير مفعّل</h2>" +
      "<p>يجب ربط مستخدم المصادقة بسجل الحساب المشترك.</p></div>";
    return null;
  }

  return { session: data.session, account };
}


async function getAllowedRooms(accountId) {
  const { data, error } = await db
    .from("account_room_permissions")
    .select("room_id, rooms(id, name, description, is_active)")
    .eq("account_id", accountId);
  if (error) throw error;
  return (data || []).map(x => x.rooms).filter(r => r && r.is_active);
}

function toast(message, isError = false) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = isError ? "toast error" : "toast";
  el.hidden = false;
  window.setTimeout(() => { el.hidden = true; }, 3500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function selectedRoomId() {
  return new URLSearchParams(window.location.search).get("room");
}

async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) return toast("تعذّر تسجيل الخروج. حاول مرة أخرى.", true);
  window.location.replace("index.html");
}



function commonHeader(title, account) {
  
  const loggedIn = !!account;

  return `
    <header class="top">

    
      <a class="brand" href="index.html">
        <b>نَدى</b>
        <small>NADA · صوتٌ يجمعنا</small>
      </a>
      ${
          loggedIn
            ? `<span>${escapeHtml(account.username)} · ${escapeHtml(roleName(account.role))}</span>`
            : `<a class="btn light" href="index.html?login=1&next=rooms.html">تسجيل الدخول</a>`
        }

      <div class="top-actions">

      <button type="button" class="btn light theme-toggle"
        data-theme-toggle>
  🌙 الوضع الليلي
</button>
        

        <a class="btn light" href="rooms.html">
          🏠 الغرف
        </a>

                <a class="btn light" href="library.html">
          📚 فهرس الأناشيد العام
        </a>

        ${
          loggedIn && account.role === "admin"
            ? `<a class="btn light" href="admin.html">⚙️ لوحة المدير</a>`
            : ''
        }

        ${
          loggedIn
            ? `<button class="btn light" onclick="signOut()">تسجيل الخروج</button>`
            : ''
        }
      </div>
    </header>

    <main class="wrap">
      <div class="page-title">
        <div>
          <p class="eyebrow">منصة الأناشيد وإدارة فرق الإنشاد</p>
          <h1>${escapeHtml(title)}</h1>
        </div>

        
      </div>
  `;
}


function roleName(role) {
  return ({admin:"مدير", leader:"قائد", member:"منشد"})[role] || "مستخدم";
}

function styles() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

  :root {
    color-scheme: light;
    --g: #083b2e;
    --g2: #04271f;
    --g3: #17634b;
    --iv: #f8f0dc;
    --paper: #fffaf0;
    --au: #bd984e;
    --au2: #e8cf8c;
    --tx: #24372d;
    --mu: #777967;
    --bd: #d9c18b;
    --success: #237650;
    --danger: #a43f3f;
    --shadow: 0 15px 42px rgba(4,39,31,.12);
    --shadow-hover: 0 22px 50px rgba(4,39,31,.2);
    --radius: 18px;
  }

  * { box-sizing: border-box; }

  html {
    scroll-behavior: smooth;
    scrollbar-color: var(--au) var(--g2);
  }

  body {
    margin: 0;
    min-height: 100vh;
    direction: rtl;
    color: var(--tx);
    font: 15px/1.9 'Cairo', Arial, sans-serif;
    background-color: var(--iv);
    background-image:
      radial-gradient(ellipse at 50% 0%, rgba(189,152,78,.15), transparent 50%),
      repeating-conic-gradient(
        from 22.5deg at 50% 50%,
        rgba(8,59,46,.055) 0deg 2deg,
        transparent 2deg 22.5deg,
        rgba(189,152,78,.07) 22.5deg 24.5deg,
        transparent 24.5deg 45deg
      );
    background-size: auto, 72px 72px;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: .32;
    background:
      repeating-linear-gradient(45deg,
        transparent 0 23px,
        rgba(189,152,78,.2) 23px 24px,
        transparent 24px 46px),
      repeating-linear-gradient(-45deg,
        transparent 0 23px,
        rgba(8,59,46,.13) 23px 24px,
        transparent 24px 46px);
    mask-image: linear-gradient(to bottom, black, transparent 90%);
  }

  a {
    color: var(--g);
    text-decoration: none;
    transition: color .2s ease;
  }

  a:hover { color: #987334; }

  button, input, textarea, select {
    font: inherit;
  }

  button, .btn {
    -webkit-tap-highlight-color: transparent;
  }

  /* ===== LUXURY ISLAMIC HEADER ===== */

  .top {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    padding: 20px max(24px, calc((100% - 1200px) / 2));
    color: #fff7e5;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(42,113,79,.45), transparent 65%),
      linear-gradient(120deg, #031f19, #083b2e 48%, #0b4938);
    border-bottom: 4px double var(--au);
    box-shadow: 0 10px 30px rgba(4,39,31,.25);
  }

  .top::before {
    content: "";
    position: absolute;
    inset: 7px;
    z-index: -1;
    pointer-events: none;
    border: 1px solid rgba(232,207,140,.5);
    background:
      repeating-conic-gradient(
        from 0deg,
        transparent 0deg 42deg,
        rgba(232,207,140,.17) 42deg 44deg,
        transparent 44deg 45deg
      );
    background-size: 45px 45px;
    mask-image: linear-gradient(90deg, black, transparent 95%);
  }

 

  .brand {
    display: inline-flex;
    flex-direction: column;
    color: #fff7e5;
    line-height: 1.4;
  }

  .brand b {
    font-size: clamp(2rem, 4vw, 2.65rem);
    font-weight: 800;
    text-shadow: 0 2px 15px rgba(0,0,0,.25);
  }

  .brand small {
    color: var(--au2);
    font-size: .76rem;
    letter-spacing: 1px;
  }

    .top-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    max-width: 100%;
  }

  .top-actions .btn {
    white-space: nowrap;
    min-width: 0;
  }

  @media (max-width: 700px) {
    .top-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
      gap: 8px;
    }

    .top-actions .btn {
      width: 100%;
      min-width: 0;
      padding: 9px 7px;
      font-size: 13px;
      white-space: normal;
    }
  }

  @media (max-width: 360px) {
    .top-actions {
      grid-template-columns: 1fr;
    }
  }

  .top-actions > span {
    color: #f5e9c9;
    font-size: 1.2rem;
  }

  /* ===== PAGE TITLE: MIHRAB ARCH ===== */

  .wrap {
    width: min(1200px, 100%);
    margin: 42px auto;
    padding: 0 24px 52px;
  }

  .page-title {
    position: relative;
    isolation: isolate;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    margin-bottom: 32px;
    padding: 35px 30px 32px;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 100%, rgba(189,152,78,.16), transparent 65%),
      linear-gradient(145deg, #fffdf5, #f5ebd3);
    border: 2px solid var(--au);
    border-radius: 110px 110px 8px 8px / 76px 76px 8px 8px;
    box-shadow: var(--shadow);
  }

  .page-title::before {
    content: "";
    position: absolute;
    inset: 8px;
    z-index: -1;
    border: 1px solid rgba(189,152,78,.65);
    border-radius: 100px 100px 5px 5px / 67px 67px 5px 5px;
    pointer-events: none;
  }

  .page-title::after {
    content: "❖";
    position: absolute;
    left: 50%;
    bottom: 2px;
    transform: translateX(-50%);
    color: var(--au);
    font-size: 20px;
    pointer-events: none;
  }

  .eyebrow {
    margin: 0 0 6px;
    color: #947238;
    font-size: .84rem;
    font-weight: 700;
  }

  h1, h2, h3 {
    color: var(--g2);
    line-height: 1.55;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.55rem, 3.4vw, 2.35rem);
    font-weight: 800;
  }

  h2 {
    margin-top: 0;
    font-size: 1.35rem;
    font-weight: 800;
  }

  h3 {
    font-size: 1.08rem;
    font-weight: 700;
  }

  p { overflow-wrap: anywhere; }

  /* ===== GEOMETRIC CARDS ===== */

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
    gap: 22px;
  }

  .card {
    position: relative;
    isolation: isolate;
    padding: 27px;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 0% 100%, rgba(189,152,78,.09), transparent 55%),
      linear-gradient(145deg, #fffdf6, #f8efd9);
    border: 1px solid var(--au);
    border-radius: 4px 24px 4px 24px;
    box-shadow: 0 8px 24px rgba(4,39,31,.07);
    transition: transform .25s ease, box-shadow .25s ease;
  }

  .card::before {
    content: "";
    position: absolute;
    inset: 7px;
    z-index: -1;
    border: 1px solid rgba(189,152,78,.42);
    border-radius: 3px 18px 3px 18px;
    pointer-events: none;
  }

  .card::after {
    content: "✥";
    position: absolute;
    top: 7px;
    left: 12px;
    color: rgba(151,113,48,.7);
    font-size: 23px;
    pointer-events: none;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-hover);
  }

  /* ===== BUTTONS ===== */

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 18px;
    color: #fff8e8;
    background: linear-gradient(135deg, #17634b, #052b21);
    border: 1px solid var(--au);
    border-radius: 4px 13px 4px 13px;
    font-weight: 700;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(4,39,31,.15);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .btn:hover {
    color: #fff8e8;
    background: linear-gradient(135deg, #0b4938, #031f19);
    box-shadow: 0 8px 22px rgba(4,39,31,.24);
    transform: translateY(-2px);
  }

  .btn:active { transform: translateY(0); }

  .btn.light {
    color: var(--g);
    background: #fffaf0;
    border: 1px solid var(--au);
    box-shadow: none;
  }

  .btn.light:hover {
    color: var(--g2);
    background: #eee0bd;
  }

  .btn.danger {
    color: white;
    background: #923d37;
    border-color: #c98c78;
  }

  .btn:focus-visible,
  a:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 3px solid rgba(189,152,78,.7);
    outline-offset: 3px;
  }

  /* ===== FORMS ===== */

  input, textarea, select {
    display: block;
    width: 100%;
    margin: 6px 0 15px;
    padding: 12px 14px;
    color: var(--tx);
    background: #fffef9;
    border: 1px solid #d8c392;
    border-radius: 4px 12px 4px 12px;
    outline: none;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  input:focus, textarea:focus, select:focus {
    border-color: var(--g3);
    box-shadow: 0 0 0 4px rgba(8,59,46,.1);
  }

  input::placeholder, textarea::placeholder { color: #929486; }

  textarea {
    min-height: 240px;
    resize: vertical;
    white-space: pre-wrap;
  }

  label {
    color: var(--g2);
    font-weight: 700;
  }

  /* ===== NASHEED LYRICS ===== */

  .lyrics {
    padding: clamp(24px, 4vw, 42px);
    color: #293b2f;
    background-color: #fffaf0;
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent 0 37px,
        rgba(189,152,78,.12) 37px 38px
      );
    border: 4px double var(--au);
    border-radius: 5px 25px 5px 25px;
    outline: 1px solid rgba(189,152,78,.35);
    outline-offset: 4px;
    box-shadow: var(--shadow);
    font-size: clamp(1.05rem, 2vw, 1.2rem);
    line-height: 2.25;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .muted { color: var(--mu); }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    color: var(--g);
    background: #e8efe4;
    border: 1px solid #c6d8c1;
    border-radius: 3px 12px 3px 12px;
    font-size: .82rem;
    font-weight: 700;
  }

  .empty {
    padding: 36px 20px;
    color: var(--mu);
    text-align: center;
    background: rgba(255,253,246,.95);
    border: 1px dashed var(--au);
    border-radius: 4px 22px 4px 22px;
  }

  /* ===== TOAST ===== */

  .toast {
    position: fixed;
    z-index: 9999;
    right: 20px;
    bottom: 20px;
    left: 20px;
    width: fit-content;
    max-width: min(520px, calc(100% - 40px));
    margin: auto;
    padding: 13px 20px;
    color: #fff8e8;
    background: var(--g2);
    border: 1px solid var(--au);
    border-radius: 4px 14px 4px 14px;
    box-shadow: 0 12px 35px rgba(0,0,0,.2);
    text-align: center;
    animation: nada-toast-in .22s ease-out;
  }

  .toast.error { background: #943b3b; }

  [hidden] { display: none !important; }

  @keyframes nada-toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ===== RESPONSIVE ===== */

  @media (max-width: 700px) {
    .top {
      padding: 17px 16px;
      align-items: flex-start;
    }

    .top-actions {
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }

    .top-actions .btn { flex: 1 1 auto; }

    .wrap {
      margin: 30px auto;
      padding: 0 14px 32px;
    }

    .page-title {
      padding: 28px 18px 30px;
      border-radius: 65px 65px 8px 8px / 45px 45px 8px 8px;
    }

    .page-title::before {
      border-radius: 56px 56px 5px 5px / 37px 37px 5px 5px;
    }

    .grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .card { padding: 23px 19px; }

    .btn {
      min-height: 44px;
      padding: 10px 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
    }
  }
  
  /* ===== NADA PROFESSIONAL DARK MODE ===== */

html[data-theme="dark"] {
  color-scheme: dark;
  --g: #56b99a;
  --g2: #e0eee6;
  --g3: #2e8f70;
  --iv: #0d1513;
  --paper: #17221e;
  --au: #b99a5b;
  --au2: #ddc58d;
  --tx: #e7eee9;
  --mu: #a5b2aa;
  --bd: #34483e;
  --success: #6ac49a;
  --danger: #e18b82;
  --shadow: 0 16px 42px rgba(0,0,0,.28);
  --shadow-hover: 0 22px 52px rgba(0,0,0,.4);
}

html[data-theme="dark"] body {
  color: var(--tx);
  background-color: #0d1513;
  background-image:
    radial-gradient(ellipse at 50% -10%, rgba(37,105,79,.23), transparent 58%),
    radial-gradient(ellipse at 0% 100%, rgba(185,154,91,.055), transparent 45%);
}

html[data-theme="dark"] body::before {
  opacity: .075;
}

html[data-theme="dark"] .top {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(67,145,111,.22), transparent 65%),
    linear-gradient(120deg, #071b16, #0b3025 52%, #0d3b2d);
  border-bottom-color: #9c8049;
  box-shadow: 0 12px 34px rgba(0,0,0,.3);
}

html[data-theme="dark"] .brand,
html[data-theme="dark"] .top-actions > span {
  color: #f1f4ed;
}

html[data-theme="dark"] .brand small {
  color: #d8c18b;
}

html[data-theme="dark"] .wrap {
  color: var(--tx);
}

html[data-theme="dark"] .page-title {
  color: var(--tx);
  background:
    radial-gradient(ellipse at 50% 100%, rgba(185,154,91,.09), transparent 65%),
    linear-gradient(145deg, #1b2b24, #142019);
  border-color: #806c43;
  box-shadow: 0 14px 38px rgba(0,0,0,.24);
}

html[data-theme="dark"] .page-title::before {
  border-color: rgba(185,154,91,.35);
}

html[data-theme="dark"] .page-title h1,
html[data-theme="dark"] h1,
html[data-theme="dark"] h2,
html[data-theme="dark"] h3,
html[data-theme="dark"] h4,
html[data-theme="dark"] label {
  color: #e7d5a7;
}

html[data-theme="dark"] .eyebrow {
  color: #c5a96c;
}

html[data-theme="dark"] .card {
  color: var(--tx);
  background:
    radial-gradient(ellipse at 0% 100%, rgba(185,154,91,.045), transparent 55%),
    linear-gradient(145deg, #1d2b24, #16221c);
  border-color: #52664f;
  box-shadow: 0 10px 28px rgba(0,0,0,.2);
}

html[data-theme="dark"] .card::before {
  border-color: rgba(185,154,91,.2);
}

html[data-theme="dark"] .card::after {
  color: rgba(205,177,116,.55);
}

html[data-theme="dark"] .card:hover {
  border-color: #a68b55;
  box-shadow: 0 18px 42px rgba(0,0,0,.32);
}

html[data-theme="dark"] .muted,
html[data-theme="dark"] small {
  color: var(--mu);
}

html[data-theme="dark"] .btn {
  color: #f4f4eb;
  background: linear-gradient(135deg, #17634b, #0b392c);
  border-color: #8e784b;
  box-shadow: 0 5px 16px rgba(0,0,0,.2);
}

html[data-theme="dark"] .btn:hover {
  color: #fff;
  background: linear-gradient(135deg, #21805f, #104b38);
  box-shadow: 0 8px 22px rgba(0,0,0,.3);
}

html[data-theme="dark"] .btn.light {
  color: #e8d8ad;
  background: #1d3027;
  border-color: #66583b;
  box-shadow: none;
}

html[data-theme="dark"] .btn.light:hover {
  color: #fff0c8;
  background: #294438;
  border-color: #a68b55;
}

html[data-theme="dark"] .btn.danger {
  color: #ffe9e6;
  background: #702f2d;
  border-color: #a45d55;
}

html[data-theme="dark"] input,
html[data-theme="dark"] textarea,
html[data-theme="dark"] select {
  color: #e8eee9;
  background: #111d18;
  border-color: #465b4d;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.16);
}

html[data-theme="dark"] input:focus,
html[data-theme="dark"] textarea:focus,
html[data-theme="dark"] select:focus {
  border-color: #72b99a;
  box-shadow: 0 0 0 3px rgba(86,185,154,.14);
}

html[data-theme="dark"] input::placeholder,
html[data-theme="dark"] textarea::placeholder {
  color: #83958a;
}

html[data-theme="dark"] select option {
  color: #e8eee9;
  background: #17231d;
}

html[data-theme="dark"] .lyrics {
  color: #e9eee7;
  background-color: #18251e;
  background-image: repeating-linear-gradient(
    0deg, transparent 0 37px, rgba(185,154,91,.09) 37px 38px
  );
  border-color: #9b804b;
  outline-color: rgba(185,154,91,.2);
}

html[data-theme="dark"] .empty {
  color: var(--mu);
  background: #17231d;
  border-color: #66583b;
}

html[data-theme="dark"] .badge {
  color: #cce8d9;
  background: #203c30;
  border-color: #426b55;
}

html[data-theme="dark"] a {
  color: #d8bd7c;
}

html[data-theme="dark"] a:hover {
  color: #f0d99f;
}

html[data-theme="dark"] table {
  color: var(--tx);
  border-color: #3c5145;
}

html[data-theme="dark"] th {
  color: #e7d5a7;
  background: #20372b;
}

html[data-theme="dark"] td,
html[data-theme="dark"] tr {
  border-color: #34483e;
}

html[data-theme="dark"] hr {
  border-color: #3b5044;
}

html[data-theme="dark"] .toast {
  color: #f5f3e9;
  background: #173b2d;
  border-color: #9b804b;
}

html[data-theme="dark"] .toast.error {
  color: #fff0ed;
  background: #702f2d;
  border-color: #a45d55;
}

html[data-theme="dark"] ::selection {
  color: #fff;
  background: #286b50;
}

html[data-theme="dark"] :focus-visible {
  outline-color: #c9aa69;
}

  </style>`;

  
  
}


/* ===== NADA THEME CONTROLLER ===== */

function initNADATheme() {
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem("nada-theme") || "light";
  } catch (error) {
    console.warn("Theme storage unavailable:", error);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.textContent =
        theme === "dark"
          ? "☀️ الوضع النهاري"
          : "🌙 الوضع الليلي";
    });
  }

  applyTheme(savedTheme);

  if (document.documentElement.dataset.themeHandlerBound !== "true") {
    document.addEventListener("click", function(event) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const button = target.closest("[data-theme-toggle]");

      if (!button) return;

      const currentTheme = document.documentElement.dataset.theme;
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      try {
        localStorage.setItem("nada-theme", nextTheme);
      } catch (error) {
        console.warn("Could not save theme:", error);
      }

      applyTheme(nextTheme);
    });

    document.documentElement.dataset.themeHandlerBound = "true";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNADATheme);
} else {
  initNADATheme();
}
