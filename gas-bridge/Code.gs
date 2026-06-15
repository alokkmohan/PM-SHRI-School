// ============================================================
// PM SHRI Schools — OTP Login GAS Bridge
// Deploy as: Web App → Execute as Me → Anyone access
// ============================================================

const CONFIG = {
  SHEET_ID      : 'APNA_SHEET_ID_YAHAN_DAALEN',   // ← Sheet ID bharo
  SHEET_NAME    : 'AuthUsers',
  OTP_EXPIRY_MIN: 10,
  SECRET_TOKEN  : 'pmshri2025secret',               // ← WordPress se match karna
  SYSTEM_NAME   : 'PM SHRI Schools Network — UP',
  SUPPORT_EMAIL : 'alok.mohan@educategirls.ngo'
};

// Column positions in sheet (0-based)
const C = {
  EMAIL      : 0,
  BLOG_ID    : 1,
  NAME       : 2,
  ROLE       : 3,   // 'super_admin' ya 'principal'
  IS_ACTIVE  : 4,   // TRUE / FALSE
  OTP        : 5,
  OTP_EXPIRES: 6,
  LAST_LOGIN : 7,
  LOGIN_COUNT: 8
};

// ── ENTRY POINT ─────────────────────────────────────────────
function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  // CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const p      = e.parameter || {};
    const action = p.action    || '';
    const token  = p.token     || '';

    // Secret token check
    if (token !== CONFIG.SECRET_TOKEN) {
      return respond({ success: false, message: 'Unauthorized' });
    }

    switch (action) {
      case 'check_email':  return respond(checkEmail(p.email));
      case 'send_otp':     return respond(sendOTP(p.email));
      case 'verify_otp':   return respond(verifyOTP(p.email, p.otp));
      case 'ping':         return respond({ success: true, message: 'GAS Bridge active' });
      default:             return respond({ success: false, message: 'Invalid action' });
    }
  } catch (err) {
    console.error(err);
    return respond({ success: false, message: 'Server error: ' + err.message });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPER ─────────────────────────────────────────────
function getSheet() {
  return SpreadsheetApp
    .openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);
}

function findUserRow(email) {
  const sheet  = getSheet();
  const data   = sheet.getDataRange().getValues();
  const emailL = email.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {     // Row 0 = header
    if (String(data[i][C.EMAIL]).toLowerCase().trim() === emailL) {
      return { row: i + 1, data: data[i] };   // row is 1-based for sheet
    }
  }
  return null;
}

// ── ACTION: CHECK EMAIL ───────────────────────────────────────
function checkEmail(email) {
  if (!email) return { success: false, message: 'Email required' };

  const found = findUserRow(email);
  if (!found) {
    return {
      success: false,
      message: 'Yeh email authorized nahi hai. State Admin se sampark karen.'
    };
  }

  const row = found.data;
  if (String(row[C.IS_ACTIVE]).toUpperCase() !== 'TRUE') {
    return {
      success: false,
      message: 'Aapka account band hai. State Admin se sampark karen.'
    };
  }

  return {
    success : true,
    name    : row[C.NAME],
    role    : row[C.ROLE],
    blog_id : row[C.BLOG_ID]
  };
}

// ── ACTION: SEND OTP ─────────────────────────────────────────
function sendOTP(email) {
  if (!email) return { success: false, message: 'Email required' };

  // First verify email is authorized
  const check = checkEmail(email);
  if (!check.success) return check;

  // Generate 6-digit OTP
  const otp     = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + CONFIG.OTP_EXPIRY_MIN * 60 * 1000);

  // Store OTP in sheet
  const found = findUserRow(email);
  const sheet = getSheet();
  sheet.getRange(found.row, C.OTP + 1).setValue(otp);
  sheet.getRange(found.row, C.OTP_EXPIRES + 1).setValue(expires.toISOString());

  // Send email
  const name = check.name;
  const body = `Namaste ${name}!

Aapka PM SHRI School Login OTP:

╔══════════════════════════╗
║                          ║
║     OTP:  ${otp}         ║
║                          ║
╚══════════════════════════╝

Yeh OTP ${CONFIG.OTP_EXPIRY_MIN} minute mein expire ho jaayega.
Kisi ke saath share mat karen.

Agar aapne login nahi kiya to is email ko ignore karen.

— ${CONFIG.SYSTEM_NAME}
  Support: ${CONFIG.SUPPORT_EMAIL}`;

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
  <div style="background:#1B3A6B;padding:20px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">🏫 PM SHRI Schools Network</h2>
    <p style="color:#F7A800;margin:5px 0 0;font-size:13px">Uttar Pradesh Shiksha Vibhag</p>
  </div>
  <div style="background:#f5f7fa;padding:30px;text-align:center;border:1px solid #e2e8f0">
    <p style="color:#444;font-size:15px">Namaste <strong>${name}</strong>!</p>
    <p style="color:#666;font-size:14px">Aapka Login OTP:</p>
    <div style="background:#fff;border:2px dashed #FF6B00;border-radius:10px;padding:20px;margin:20px 0;display:inline-block">
      <span style="font-size:36px;font-weight:900;color:#1B3A6B;letter-spacing:8px">${otp}</span>
    </div>
    <p style="color:#888;font-size:12px">⏰ Yeh OTP <strong>${CONFIG.OTP_EXPIRY_MIN} minute</strong> mein expire ho jaayega</p>
    <p style="color:#e53e3e;font-size:12px;font-weight:600">🔒 Kisi ke saath share mat karen</p>
  </div>
  <div style="background:#1B3A6B;padding:14px;text-align:center;border-radius:0 0 8px 8px">
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0">${CONFIG.SYSTEM_NAME} | Support: ${CONFIG.SUPPORT_EMAIL}</p>
  </div>
</div>`;

  MailApp.sendEmail({
    to      : email,
    subject : `[PM SHRI] Aapka Login OTP: ${otp}`,
    body    : body,
    htmlBody: htmlBody
  });

  return {
    success: true,
    message: `OTP bhej diya gaya hai ${email} par`,
    name   : name
  };
}

// ── ACTION: VERIFY OTP ───────────────────────────────────────
function verifyOTP(email, otp) {
  if (!email || !otp) return { success: false, message: 'Email aur OTP required hai' };

  const found = findUserRow(email);
  if (!found) return { success: false, message: 'User nahi mila' };

  const row       = found.data;
  const savedOTP  = String(row[C.OTP]).trim();
  const expiresAt = new Date(row[C.OTP_EXPIRES]);
  const now       = new Date();

  // Expiry check
  if (now > expiresAt) {
    return { success: false, message: 'OTP expire ho gaya. Dobara bhejwayein.' };
  }

  // OTP match check
  if (String(otp).trim() !== savedOTP) {
    return { success: false, message: 'OTP galat hai. Dobara check karen.' };
  }

  // Clear OTP (single use)
  const sheet = getSheet();
  sheet.getRange(found.row, C.OTP + 1).setValue('');
  sheet.getRange(found.row, C.OTP_EXPIRES + 1).setValue('');

  // Update last login
  sheet.getRange(found.row, C.LAST_LOGIN + 1).setValue(new Date().toLocaleString('en-IN'));
  sheet.getRange(found.row, C.LOGIN_COUNT + 1).setValue(
    (Number(row[C.LOGIN_COUNT]) || 0) + 1
  );

  return {
    success : true,
    email   : email,
    name    : row[C.NAME],
    role    : row[C.ROLE],
    blog_id : Number(row[C.BLOG_ID]),
    message : 'Login successful'
  };
}
