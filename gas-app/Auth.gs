// ============================================================
// Auth — OTP generation, email, verification
// ============================================================

function isAllowedDomain(email) {
  const domain = email.split('@')[1] || '';
  return CONFIG.ALLOWED_DOMAINS.some(function(d) { return domain === d; });
}

// Called from client via google.script.run
function sendOTP(email) {
  if (!email) return { success: false, message: 'Email required' };
  email = email.toLowerCase().trim();

  if (!isAllowedDomain(email)) {
    return { success: false, message: 'Sirf UP Sarkar ki email IDs allowed hain (@up.gov.in)' };
  }

  const user = findUser(email);
  if (!user) return { success: false, message: 'Yeh email authorized nahi hai. Admin se sampark karen.' };
  if (!user.is_active) return { success: false, message: 'Aapka account inactive hai. Admin se sampark karen.' };

  const otp     = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + CONFIG.OTP_EXPIRY_MIN * 60 * 1000);

  saveOTP(email, otp, expires);
  sendOTPEmail(email, user.name, otp);

  return { success: true, message: 'OTP bhej diya gaya ' + email + ' par', name: user.name };
}

// Called from client via google.script.run
function verifyOTP(email, otp) {
  if (!email || !otp) return { success: false, message: 'Email aur OTP required hai' };
  email = email.toLowerCase().trim();

  const entry = getOTPEntry(email);
  if (!entry) return { success: false, message: 'OTP nahi mila. Pehle OTP maangein.' };
  if (String(entry[OC.USED]).toUpperCase() === 'TRUE') return { success: false, message: 'OTP pehle hi use ho chuka hai.' };

  const expires = new Date(entry[OC.EXPIRES_AT]);
  if (new Date() > expires) return { success: false, message: 'OTP expire ho gaya. Dobara maangein.' };
  if (String(entry[OC.OTP]).trim() !== String(otp).trim()) return { success: false, message: 'OTP galat hai.' };

  markOTPUsed(email);
  updateUserLogin(email);

  const user  = findUser(email);
  const token = createSession(user);

  return {
    success  : true,
    token    : token,
    name     : user.name,
    role     : user.role,
    school_id: user.school_id,
    message  : 'Login successful',
  };
}

function sendOTPEmail(email, name, otp) {
  const subject = '[PM SHRI] Aapka Login OTP: ' + otp;
  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
  <div style="background:#1B3A6B;padding:20px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">🏫 PM SHRI Schools Network</h2>
    <p style="color:#F7A800;margin:5px 0 0;font-size:13px">Uttar Pradesh Shiksha Vibhag</p>
  </div>
  <div style="background:#f5f7fa;padding:30px;text-align:center;border:1px solid #e2e8f0">
    <p style="color:#444;font-size:15px">Namaste <strong>${name}</strong>!</p>
    <p style="color:#666;font-size:14px">Aapka Login OTP:</p>
    <div style="background:#fff;border:2px dashed #FF6B00;border-radius:10px;padding:20px;margin:20px auto;display:inline-block">
      <span style="font-size:40px;font-weight:900;color:#1B3A6B;letter-spacing:10px">${otp}</span>
    </div>
    <p style="color:#888;font-size:12px">⏰ Yeh OTP <strong>${CONFIG.OTP_EXPIRY_MIN} minute</strong> mein expire hoga</p>
    <p style="color:#e53e3e;font-size:12px;font-weight:600">🔒 Kisi ke saath share mat karen</p>
  </div>
  <div style="background:#1B3A6B;padding:14px;text-align:center;border-radius:0 0 8px 8px">
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0">${CONFIG.SYSTEM_NAME} | Support: ${CONFIG.SUPPORT_EMAIL}</p>
  </div>
</div>`;

  MailApp.sendEmail({ to: email, subject: subject, htmlBody: html, body: 'OTP: ' + otp });
}
