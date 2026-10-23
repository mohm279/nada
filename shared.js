
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

      <div class="top-actions">
        ${
          loggedIn
            ? `<span>${escapeHtml(account.username)} · ${escapeHtml(roleName(account.role))}</span>`
            : `<a class="btn light" href="index.html?login=1&next=rooms.html">تسجيل الدخول</a>`
        }

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

        ${
          loggedIn
            ? `<a class="btn light" href="rooms.html">تغيير الغرفة</a>`
            : ''
        }
      </div>
  `;
}


function roleName(role) {
  return ({admin:"مدير", leader:"قائد", member:"منشد"})[role] || "مستخدم";
}
function styles() {
  return `<style>
  :root{--g:#0b5d4b;--g2:#08463a;--iv:#fbf8ef;--au:#b8975a;--tx:#1d2b27;--mu:#64756f;--bd:#e6dfcc}
  *{box-sizing:border-box}body{margin:0;background:var(--iv);color:var(--tx);font:16px/1.8 Cairo,Arial,sans-serif}
  a{color:var(--g);text-decoration:none}.top{background:#fff;border-bottom:1px solid var(--bd);padding:14px max(20px,calc((100% - 1100px)/2));display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}
  .brand{display:flex;flex-direction:column;color:var(--g)}.brand b{font-size:1.7rem;line-height:1.2}.brand small{color:var(--au);letter-spacing:1px}
  .top-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.wrap{max-width:1100px;margin:30px auto;padding:0 18px}.page-title{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:22px}
  h1{margin:0;font-size:clamp(1.5rem,4vw,2.2rem)}h2{margin-top:0}.eyebrow{color:var(--au);margin:0;font-size:.9rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px;box-shadow:0 5px 18px #0b5d4b0a}
  .btn{display:inline-flex;justify-content:center;align-items:center;gap:8px;border:0;border-radius:11px;background:var(--g);color:white;padding:10px 16px;font:inherit;cursor:pointer}.btn:hover{background:var(--g2)}.btn.light{background:#fff;color:var(--g);border:1px solid var(--bd)}
  .muted{color:var(--mu)}input,textarea,select{width:100%;font:inherit;padding:11px 13px;border:1px solid var(--bd);border-radius:10px;background:#fff;margin:5px 0 12px}textarea{min-height:240px;white-space:pre-wrap}
  .lyrics{white-space:pre-wrap;font-size:1.2rem;line-height:2.2;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px}
  .badge{display:inline-block;border-radius:999px;background:#e5efe9;color:var(--g);padding:3px 10px;font-size:.85rem}.empty{padding:24px;text-align:center;color:var(--mu);background:#fff;border:1px dashed var(--bd);border-radius:16px}
  .toast{position:fixed;bottom:20px;left:20px;right:20px;margin:auto;max-width:520px;background:var(--g);color:white;border-radius:12px;padding:12px 18px;text-align:center;z-index:99}
  .toast.error{background:#a33}[hidden]{display:none!important}
  @media(max-width:600px){.wrap{margin:20px auto}.top{padding:14px 18px}.page-title{align-items:flex-start}}
  </style>`;
}
