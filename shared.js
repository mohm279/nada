
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
        

        <a class="btn light" href="rooms.html">
          🏠 الغرف
        </a>

        <a class="btn light" href="library.html">
          📚 فهرس الأناشيد العام
        </a>

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
  </style>`;

}
