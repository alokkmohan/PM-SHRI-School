// ============================================================
// Session Management — PropertiesService based
// ============================================================

function createSession(user) {
  const token   = Utilities.getUuid();
  const expires = Date.now() + CONFIG.SESSION_HOURS * 60 * 60 * 1000;
  const payload = JSON.stringify({
    email    : user.email,
    name     : user.name,
    role     : user.role,
    school_id: user.school_id,
    expires  : expires,
  });
  PropertiesService.getScriptProperties().setProperty('sess_' + token, payload);
  return token;
}

function validateSession(token) {
  if (!token) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('sess_' + token);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (Date.now() > session.expires) {
      PropertiesService.getScriptProperties().deleteProperty('sess_' + token);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function destroySession(token) {
  PropertiesService.getScriptProperties().deleteProperty('sess_' + token);
}

// Called from client — validate and return user info
function getSessionUser(token) {
  const s = validateSession(token);
  if (!s) return { success: false, message: 'Session expired. Dobara login karein.' };
  return { success: true, user: s };
}

// Cleanup old sessions (run via time trigger periodically)
function cleanupSessions() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const now   = Date.now();
  Object.keys(props).forEach(function (key) {
    if (!key.startsWith('sess_')) return;
    try {
      const s = JSON.parse(props[key]);
      if (now > s.expires) PropertiesService.getScriptProperties().deleteProperty(key);
    } catch (e) {
      PropertiesService.getScriptProperties().deleteProperty(key);
    }
  });
}
