<?php
/**
 * PM SHRI OTP Login — Must-Use Plugin
 * Replaces default WordPress login with GAS Bridge OTP flow.
 */

// LOCAL TESTING → mock endpoint. Replace with real GAS URL before VPS deploy.
define('PMSHRI_GAS_URL',    'http://localhost/multisite/gas-mock.php');
define('PMSHRI_GAS_TOKEN',  'pmshri2025secret');
define('PMSHRI_LOGIN_SLUG', 'pmshri-login');

// ── 1. REPLACE DEFAULT WP-LOGIN ──────────────────────────────
add_action('login_init', function () {
    // Allow normal logout action to proceed
    if (isset($_GET['action']) && in_array($_GET['action'], ['logout', 'postpass', 'lostpassword', 'rp', 'resetpass'])) {
        return;
    }
    // Allow password reset links
    if (isset($_GET['action']) && $_GET['action'] === 'rp') return;

    // Show our custom login page
    pmshri_render_login_page();
    exit;
});

// ── 2. AJAX: SEND OTP ────────────────────────────────────────
add_action('wp_ajax_nopriv_pmshri_send_otp', 'pmshri_ajax_send_otp');
function pmshri_ajax_send_otp() {
    check_ajax_referer('pmshri_otp_nonce', 'nonce');

    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    if (!$email) {
        wp_send_json_error(['message' => 'Email required']);
    }

    $response = pmshri_gas_request([
        'action' => 'send_otp',
        'email'  => $email,
        'token'  => PMSHRI_GAS_TOKEN,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Server se connect nahi ho paya. Dobara try karein.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    if ($body['success']) {
        wp_send_json_success(['message' => $body['message'], 'name' => $body['name'] ?? '']);
    } else {
        wp_send_json_error(['message' => $body['message'] ?? 'Kuch galat ho gaya.']);
    }
}

// ── 3. AJAX: VERIFY OTP + AUTO-LOGIN ────────────────────────
add_action('wp_ajax_nopriv_pmshri_verify_otp', 'pmshri_ajax_verify_otp');
function pmshri_ajax_verify_otp() {
    check_ajax_referer('pmshri_otp_nonce', 'nonce');

    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    $otp   = sanitize_text_field(wp_unslash($_POST['otp']   ?? ''));

    if (!$email || !$otp) {
        wp_send_json_error(['message' => 'Email aur OTP dono required hain']);
    }

    $response = pmshri_gas_request([
        'action' => 'verify_otp',
        'email'  => $email,
        'otp'    => $otp,
        'token'  => PMSHRI_GAS_TOKEN,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Server se connect nahi ho paya.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (!$body['success']) {
        wp_send_json_error(['message' => $body['message'] ?? 'OTP verification fail.']);
    }

    // OTP verified — find or create WP user and log them in
    $role    = $body['role']    ?? 'subscriber';
    $name    = $body['name']    ?? $email;
    $blog_id = intval($body['blog_id'] ?? 0);

    $result = pmshri_login_user($email, $name, $role, $blog_id);

    if (is_wp_error($result)) {
        wp_send_json_error(['message' => $result->get_error_message()]);
    }

    wp_send_json_success([
        'message'     => 'Login successful! Redirect ho raha hai...',
        'redirect_url' => $result['redirect_url'],
    ]);
}

// ── 4. LOGIN USER ────────────────────────────────────────────
function pmshri_login_user($email, $name, $role, $blog_id) {
    // Find existing WP user by email
    $user = get_user_by('email', $email);

    if (!$user) {
        // Create user if not exists
        $username = sanitize_user(strstr($email, '@', true) . '_' . wp_rand(100, 999), true);
        $user_id  = wpmu_create_user($username, wp_generate_password(24, true, true), $email);

        if (is_wp_error($user_id)) {
            return new WP_Error('user_create_failed', 'User create nahi ho paya: ' . $user_id->get_error_message());
        }

        wp_update_user(['ID' => $user_id, 'display_name' => $name, 'first_name' => $name]);
        $user = get_user_by('id', $user_id);
    }

    $user_id = $user->ID;

    // Handle super_admin
    if ($role === 'super_admin') {
        if (!is_super_admin($user_id)) {
            grant_super_admin($user_id);
        }
        wp_set_auth_cookie($user_id, false);
        wp_set_current_user($user_id);
        $redirect = network_admin_url();

        return ['redirect_url' => $redirect];
    }

    // Handle principal — add to their school blog if not already
    if ($blog_id > 0) {
        if (!is_user_member_of_blog($user_id, $blog_id)) {
            add_user_to_blog($blog_id, $user_id, 'administrator');
        }

        // Ensure primary_blog is set
        $primary = get_user_meta($user_id, 'primary_blog', true);
        if (!$primary) {
            update_user_meta($user_id, 'primary_blog', $blog_id);
            update_user_meta($user_id, 'source_domain', DOMAIN_CURRENT_SITE);
        }
    }

    wp_set_auth_cookie($user_id, false);
    wp_set_current_user($user_id);

    $redirect = ($blog_id > 1) ? get_admin_url($blog_id) : admin_url();

    return ['redirect_url' => $redirect];
}

// ── 5. GAS HTTP REQUEST ──────────────────────────────────────
function pmshri_gas_request($params) {
    $url = add_query_arg($params, PMSHRI_GAS_URL);
    return wp_remote_get($url, [
        'timeout'    => 30,
        'user-agent' => 'WordPress/PMSHRI-OTP',
        'sslverify'  => false,
        'redirection' => 5,
    ]);
}

// ── 6. RENDER CUSTOM LOGIN PAGE ──────────────────────────────
function pmshri_render_login_page() {
    $ajax_url = admin_url('admin-ajax.php');
    $nonce    = wp_create_nonce('pmshri_otp_nonce');
    $site_url = network_site_url('/multisite/');
    ?>
<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login — PM SHRI Schools Network</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #1B3A6B 0%, #0d2144 50%, #1B3A6B 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  /* Gov strip */
  .gov-strip {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #fff;
    border-bottom: 3px solid #FF6B00;
    padding: 6px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    font-size: 11px;
    color: #333;
    z-index: 100;
  }
  .gov-strip span { font-weight: 600; }

  .login-card {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    margin-top: 48px;
  }

  .card-header {
    background: linear-gradient(135deg, #1B3A6B, #2a5298);
    padding: 28px 30px 24px;
    text-align: center;
  }
  .card-header .emblem {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 3px solid rgba(247,168,0,0.7);
    margin: 0 auto 12px;
    display: block;
    object-fit: contain;
    background: #fff;
    padding: 4px;
  }
  .card-header h1 {
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 4px;
  }
  .card-header p {
    color: #F7A800;
    font-size: 12px;
  }

  .card-body { padding: 28px 30px 24px; }

  .step { display: none; }
  .step.active { display: block; }

  .step-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .step-label::before, .step-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }

  input[type="email"],
  input[type="text"] {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    transition: border-color .2s;
    color: #111;
  }
  input:focus { border-color: #1B3A6B; }

  .otp-inputs {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin: 4px 0;
  }
  .otp-inputs input {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    color: #1B3A6B;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 0;
  }
  .otp-inputs input:focus { border-color: #FF6B00; background: #fffbf5; }

  .btn {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s;
    margin-top: 18px;
  }
  .btn-primary { background: #FF6B00; color: #fff; }
  .btn-primary:hover { background: #e55f00; transform: translateY(-1px); }
  .btn-primary:disabled { background: #ccc; transform: none; cursor: not-allowed; }
  .btn-secondary {
    background: none;
    color: #1B3A6B;
    font-size: 13px;
    margin-top: 10px;
    text-decoration: underline;
    cursor: pointer;
    border: none;
    width: auto;
    padding: 4px;
  }

  .alert {
    padding: 10px 14px;
    border-radius: 7px;
    font-size: 13px;
    margin-top: 14px;
    display: none;
  }
  .alert.show { display: block; }
  .alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .alert-info    { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

  .user-greeting {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #0369a1;
    display: none;
  }
  .user-greeting.show { display: block; }

  .resend-timer { font-size: 12px; color: #888; text-align: center; margin-top: 8px; }
  .resend-timer span { font-weight: 700; color: #FF6B00; }

  .footer-note {
    text-align: center;
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    margin-top: 18px;
  }
</style>
</head>
<body>

<div class="gov-strip">
  <span>भारत सरकार | Government of India</span>
  <span>|</span>
  <span>PM SHRI Schools Network — Uttar Pradesh</span>
</div>

<div class="login-card">
  <div class="card-header">
    <img class="emblem"
         src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/100px-Emblem_of_India.svg.png"
         alt="Ashok Stambh">
    <h1>PM SHRI Schools Network</h1>
    <p>Uttar Pradesh Shiksha Vibhag — Principal Login</p>
  </div>

  <div class="card-body">

    <!-- STEP 1: Email -->
    <div class="step active" id="step-email">
      <div class="step-label">Step 1 of 2 — Email Verification</div>
      <label class="field-label" for="email-input">Apna Registered Email Darj Karen</label>
      <input type="email" id="email-input" placeholder="aapka@email.com" autocomplete="email" autofocus>
      <div class="alert" id="email-alert"></div>
      <button class="btn btn-primary" id="btn-send-otp">OTP Bhejein →</button>
    </div>

    <!-- STEP 2: OTP -->
    <div class="step" id="step-otp">
      <div class="user-greeting" id="user-greeting"></div>
      <div class="step-label">Step 2 of 2 — OTP Verify Karen</div>
      <label class="field-label">6-Digit OTP Darj Karen</label>
      <div class="otp-inputs">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp0">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp1">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp2">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp3">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp4">
        <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="otp5">
      </div>
      <div class="resend-timer" id="resend-timer">
        OTP <span id="timer-count">10:00</span> mein expire hoga
      </div>
      <div class="alert" id="otp-alert"></div>
      <button class="btn btn-primary" id="btn-verify-otp">Login Karen ✓</button>
      <div style="text-align:center">
        <button class="btn-secondary" id="btn-back">← Wapas jayein</button>
        <button class="btn-secondary" id="btn-resend" style="display:none">OTP Dobara Bhejein</button>
      </div>
    </div>

  </div><!-- .card-body -->
</div><!-- .login-card -->

<p class="footer-note">Sirf authorized school principals ka access hai | Support: alok.mohan@educategirls.ngo</p>

<script>
(function () {
  'use strict';

  const AJAX_URL = '<?php echo esc_js($ajax_url); ?>';
  const NONCE    = '<?php echo esc_js($nonce); ?>';

  let currentEmail = '';
  let timerInterval = null;

  // ── DOM refs ──────────────────────────────────────────────
  const stepEmail  = document.getElementById('step-email');
  const stepOtp    = document.getElementById('step-otp');
  const emailInput = document.getElementById('email-input');
  const btnSend    = document.getElementById('btn-send-otp');
  const emailAlert = document.getElementById('email-alert');

  const otpBoxes   = [0,1,2,3,4,5].map(i => document.getElementById('otp' + i));
  const btnVerify  = document.getElementById('btn-verify-otp');
  const otpAlert   = document.getElementById('otp-alert');
  const greeting   = document.getElementById('user-greeting');
  const timerEl    = document.getElementById('timer-count');
  const timerRow   = document.getElementById('resend-timer');
  const btnBack    = document.getElementById('btn-back');
  const btnResend  = document.getElementById('btn-resend');

  // ── Helpers ───────────────────────────────────────────────
  function showAlert(el, msg, type) {
    el.textContent = msg;
    el.className = 'alert show alert-' + type;
  }
  function hideAlert(el) { el.className = 'alert'; }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    if (loading) {
      btn.dataset.orig = btn.textContent;
      btn.textContent = 'Wait...';
    } else {
      btn.textContent = btn.dataset.orig || btn.textContent;
    }
  }

  function getOtpValue() {
    return otpBoxes.map(b => b.value).join('');
  }

  function clearOtpBoxes() {
    otpBoxes.forEach(b => { b.value = ''; });
    otpBoxes[0].focus();
  }

  // ── OTP box auto-advance ──────────────────────────────────
  otpBoxes.forEach((box, idx) => {
    box.addEventListener('input', function () {
      // Allow only digits
      this.value = this.value.replace(/\D/g, '');
      if (this.value && idx < 5) otpBoxes[idx + 1].focus();
      // Auto-submit when all filled
      if (getOtpValue().length === 6) btnVerify.click();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && idx > 0) {
        otpBoxes[idx - 1].focus();
      }
    });
    box.addEventListener('paste', function (e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      paste.split('').forEach((ch, i) => {
        if (otpBoxes[i]) otpBoxes[i].value = ch;
      });
      const next = Math.min(paste.length, 5);
      otpBoxes[next].focus();
      if (paste.length === 6) btnVerify.click();
    });
  });

  // ── Countdown timer ───────────────────────────────────────
  function startTimer(seconds) {
    clearInterval(timerInterval);
    btnResend.style.display = 'none';
    timerRow.style.display = 'block';
    let remaining = seconds;
    function tick() {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      timerEl.textContent = m + ':' + s;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerRow.style.display = 'none';
        btnResend.style.display = 'inline';
      }
      remaining--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  // ── SEND OTP ──────────────────────────────────────────────
  btnSend.addEventListener('click', sendOtp);
  emailInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendOtp();
  });

  function sendOtp() {
    const email = emailInput.value.trim();
    if (!email) { showAlert(emailAlert, 'Email darj karna zaroori hai.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert(emailAlert, 'Valid email darj karen.', 'error'); return;
    }
    hideAlert(emailAlert);
    setLoading(btnSend, true);

    const fd = new FormData();
    fd.append('action', 'pmshri_send_otp');
    fd.append('email',  email);
    fd.append('nonce',  NONCE);

    fetch(AJAX_URL, { method: 'POST', body: fd })
      .then(r => r.json())
      .then(function (res) {
        setLoading(btnSend, false);
        if (res.success) {
          currentEmail = email;
          if (res.data.name) {
            greeting.textContent = '👋 Namaste, ' + res.data.name + '! Aapke email par OTP bhej diya gaya hai.';
            greeting.className = 'user-greeting show';
          }
          stepEmail.classList.remove('active');
          stepOtp.classList.add('active');
          clearOtpBoxes();
          startTimer(600);
        } else {
          showAlert(emailAlert, res.data.message || 'Kuch galat ho gaya.', 'error');
        }
      })
      .catch(function () {
        setLoading(btnSend, false);
        showAlert(emailAlert, 'Network error. Internet connection check karen.', 'error');
      });
  }

  // ── VERIFY OTP ────────────────────────────────────────────
  btnVerify.addEventListener('click', function () {
    const otp = getOtpValue();
    if (otp.length < 6) {
      showAlert(otpAlert, '6 digit OTP poora bharen.', 'error'); return;
    }
    hideAlert(otpAlert);
    setLoading(btnVerify, true);

    const fd = new FormData();
    fd.append('action', 'pmshri_verify_otp');
    fd.append('email',  currentEmail);
    fd.append('otp',    otp);
    fd.append('nonce',  NONCE);

    fetch(AJAX_URL, { method: 'POST', body: fd })
      .then(r => r.json())
      .then(function (res) {
        setLoading(btnVerify, false);
        if (res.success) {
          clearInterval(timerInterval);
          showAlert(otpAlert, '✅ ' + res.data.message, 'success');
          // Redirect after short delay
          setTimeout(function () {
            window.location.href = res.data.redirect_url;
          }, 1000);
        } else {
          showAlert(otpAlert, res.data.message || 'OTP galat hai.', 'error');
          clearOtpBoxes();
        }
      })
      .catch(function () {
        setLoading(btnVerify, false);
        showAlert(otpAlert, 'Network error. Dobara try karen.', 'error');
      });
  });

  // ── BACK ──────────────────────────────────────────────────
  btnBack.addEventListener('click', function () {
    clearInterval(timerInterval);
    stepOtp.classList.remove('active');
    stepEmail.classList.add('active');
    hideAlert(otpAlert);
    hideAlert(emailAlert);
    greeting.className = 'user-greeting';
  });

  // ── RESEND ────────────────────────────────────────────────
  btnResend.addEventListener('click', function () {
    hideAlert(otpAlert);
    clearOtpBoxes();

    const fd = new FormData();
    fd.append('action', 'pmshri_send_otp');
    fd.append('email',  currentEmail);
    fd.append('nonce',  NONCE);

    btnResend.disabled = true;
    btnResend.textContent = 'Bhej raha hai...';

    fetch(AJAX_URL, { method: 'POST', body: fd })
      .then(r => r.json())
      .then(function (res) {
        btnResend.disabled = false;
        btnResend.textContent = 'OTP Dobara Bhejein';
        if (res.success) {
          startTimer(600);
          showAlert(otpAlert, 'Naya OTP bhej diya gaya!', 'success');
        } else {
          showAlert(otpAlert, res.data.message || 'Kuch galat ho gaya.', 'error');
        }
      })
      .catch(function () {
        btnResend.disabled = false;
        btnResend.textContent = 'OTP Dobara Bhejein';
        showAlert(otpAlert, 'Network error.', 'error');
      });
  });

})();
</script>
</body>
</html>
    <?php
}
