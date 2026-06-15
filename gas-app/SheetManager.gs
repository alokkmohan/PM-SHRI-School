// ============================================================
// Sheet Manager — All Google Sheets read/write operations
// ============================================================

function getSheet(tabName) {
  return SpreadsheetApp
    .openById(CONFIG.SHEET_ID)
    .getSheetByName(tabName);
}

function getAllRows(tabName) {
  const sheet = getSheet(tabName);
  const data  = sheet.getDataRange().getValues();
  return data.slice(1); // skip header
}

// ── SCHOOLS ─────────────────────────────────────────────────

function getAllSchools() {
  return getAllRows(CONFIG.TABS.SCHOOLS)
    .filter(r => String(r[SC.IS_ACTIVE]).toUpperCase() === 'TRUE')
    .map(rowToSchool);
}

function getSchool(schoolId) {
  const rows = getAllRows(CONFIG.TABS.SCHOOLS);
  const row  = rows.find(r => r[SC.ID] === schoolId);
  return row ? rowToSchool(row) : null;
}

function updateSchoolInfo(schoolId, updates, updatedBy) {
  const sheet = getSheet(CONFIG.TABS.SCHOOLS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][SC.ID] === schoolId) {
      const r = i + 1;
      if (updates.name)        sheet.getRange(r, SC.NAME        + 1).setValue(updates.name);
      if (updates.tagline)     sheet.getRange(r, SC.TAGLINE     + 1).setValue(updates.tagline);
      if (updates.notice)      sheet.getRange(r, SC.NOTICE      + 1).setValue(updates.notice);
      if (updates.phone)       sheet.getRange(r, SC.PHONE       + 1).setValue(updates.phone);
      if (updates.address)     sheet.getRange(r, SC.ADDRESS     + 1).setValue(updates.address);
      if (updates.students)    sheet.getRange(r, SC.STUDENTS    + 1).setValue(updates.students);
      if (updates.teachers)    sheet.getRange(r, SC.TEACHERS    + 1).setValue(updates.teachers);
      if (updates.principal)   sheet.getRange(r, SC.PRINCIPAL   + 1).setValue(updates.principal);
      if (updates.established) sheet.getRange(r, SC.ESTABLISHED + 1).setValue(updates.established);
      return true;
    }
  }
  return false;
}

function rowToSchool(row) {
  return {
    id          : row[SC.ID],
    name        : row[SC.NAME],
    district    : row[SC.DISTRICT],
    block       : row[SC.BLOCK],
    address     : row[SC.ADDRESS],
    phone       : row[SC.PHONE],
    email       : row[SC.EMAIL],
    principal   : row[SC.PRINCIPAL],
    established : row[SC.ESTABLISHED],
    students    : row[SC.STUDENTS],
    teachers    : row[SC.TEACHERS],
    classes     : row[SC.CLASSES],
    affiliation : row[SC.AFFILIATION],
    tagline     : row[SC.TAGLINE],
    notice      : row[SC.NOTICE],
    folder_id   : row[SC.FOLDER_ID],
    is_active   : row[SC.IS_ACTIVE],
  };
}

// For admin: add new school
function addSchool(data) {
  const sheet = getSheet(CONFIG.TABS.SCHOOLS);
  const id    = 'PMSHRI_UP_' + String(Date.now()).slice(-6);
  sheet.appendRow([
    id, data.name, data.district, data.block, data.address,
    data.phone, data.email, data.principal, data.established,
    data.students || 0, data.teachers || 0, data.classes || 12,
    data.affiliation || 'UP Board', data.tagline || '', '',
    '', true, new Date().toISOString(),
  ]);
  return id;
}

// ── USERS ────────────────────────────────────────────────────

function findUser(email) {
  const rows = getAllRows(CONFIG.TABS.USERS);
  const row  = rows.find(r => String(r[UC.EMAIL]).toLowerCase().trim() === email.toLowerCase().trim());
  return row ? rowToUser(row) : null;
}

function rowToUser(row) {
  return {
    email      : row[UC.EMAIL],
    name       : row[UC.NAME],
    role       : row[UC.ROLE],
    school_id  : row[UC.SCHOOL_ID],
    is_active  : String(row[UC.IS_ACTIVE]).toUpperCase() === 'TRUE',
    login_count: Number(row[UC.LOGIN_COUNT]) || 0,
  };
}

function updateUserLogin(email) {
  const sheet = getSheet(CONFIG.TABS.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][UC.EMAIL]).toLowerCase().trim() === email.toLowerCase().trim()) {
      const r = i + 1;
      sheet.getRange(r, UC.LAST_LOGIN  + 1).setValue(new Date().toLocaleString('en-IN'));
      sheet.getRange(r, UC.LOGIN_COUNT + 1).setValue((Number(data[i][UC.LOGIN_COUNT]) || 0) + 1);
      return;
    }
  }
}

function getAllUsers() {
  return getAllRows(CONFIG.TABS.USERS).map(rowToUser);
}

function addUser(data) {
  const sheet = getSheet(CONFIG.TABS.USERS);
  sheet.appendRow([
    data.email, data.name, data.role, data.school_id,
    true, new Date().toISOString(), '', 0,
  ]);
}

// ── OTP ──────────────────────────────────────────────────────

function saveOTP(email, otp, expiresAt) {
  const sheet = getSheet(CONFIG.TABS.OTP);
  const data  = sheet.getDataRange().getValues();
  // Update existing row or append
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][OC.EMAIL]).toLowerCase().trim() === email.toLowerCase().trim()) {
      const r = i + 1;
      sheet.getRange(r, OC.OTP        + 1).setValue(otp);
      sheet.getRange(r, OC.EXPIRES_AT + 1).setValue(expiresAt.toISOString());
      sheet.getRange(r, OC.USED       + 1).setValue(false);
      return;
    }
  }
  sheet.appendRow([email, otp, expiresAt.toISOString(), false, new Date().toISOString()]);
}

function getOTPEntry(email) {
  const rows = getAllRows(CONFIG.TABS.OTP);
  return rows.find(r => String(r[OC.EMAIL]).toLowerCase().trim() === email.toLowerCase().trim()) || null;
}

function markOTPUsed(email) {
  const sheet = getSheet(CONFIG.TABS.OTP);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][OC.EMAIL]).toLowerCase().trim() === email.toLowerCase().trim()) {
      sheet.getRange(i + 1, OC.USED + 1).setValue(true);
      return;
    }
  }
}

// ── PAGES ────────────────────────────────────────────────────

function getPage(schoolId, pageType) {
  const rows = getAllRows(CONFIG.TABS.PAGES);
  const row  = rows.find(r => r[PC.SCHOOL_ID] === schoolId && r[PC.PAGE_TYPE] === pageType);
  return row ? { content: row[PC.CONTENT], updated_at: row[PC.UPDATED_AT] } : null;
}

function savePage(schoolId, pageType, content, updatedBy) {
  const sheet = getSheet(CONFIG.TABS.PAGES);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][PC.SCHOOL_ID] === schoolId && data[i][PC.PAGE_TYPE] === pageType) {
      const r = i + 1;
      sheet.getRange(r, PC.CONTENT    + 1).setValue(content);
      sheet.getRange(r, PC.UPDATED_BY + 1).setValue(updatedBy);
      sheet.getRange(r, PC.UPDATED_AT + 1).setValue(new Date().toLocaleString('en-IN'));
      return;
    }
  }
  sheet.appendRow([schoolId, pageType, content, updatedBy, new Date().toLocaleString('en-IN')]);
}

// ── GALLERY ──────────────────────────────────────────────────

function getGallery(schoolId) {
  return getAllRows(CONFIG.TABS.GALLERY)
    .filter(r => r[GC.SCHOOL_ID] === schoolId && String(r[GC.IS_ACTIVE]).toUpperCase() === 'TRUE')
    .map(r => ({
      id         : r[GC.ID],
      file_url   : r[GC.FILE_URL],
      caption    : r[GC.CAPTION],
      uploaded_at: r[GC.UPLOADED_AT],
    }));
}

function addGalleryItem(schoolId, fileId, fileUrl, caption, uploadedBy) {
  const sheet = getSheet(CONFIG.TABS.GALLERY);
  const id    = 'IMG_' + String(Date.now());
  sheet.appendRow([id, schoolId, fileId, fileUrl, caption, uploadedBy, new Date().toLocaleString('en-IN'), true]);
  return id;
}

function deleteGalleryItem(imageId, schoolId) {
  const sheet = getSheet(CONFIG.TABS.GALLERY);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][GC.ID] === imageId && data[i][GC.SCHOOL_ID] === schoolId) {
      sheet.getRange(i + 1, GC.IS_ACTIVE + 1).setValue(false);
      return true;
    }
  }
  return false;
}
