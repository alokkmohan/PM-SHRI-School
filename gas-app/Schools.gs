// ============================================================
// Schools — Server functions callable from client
// ============================================================

// Public — no auth needed
function getSchoolPublicData(schoolId) {
  const school  = getSchool(schoolId);
  if (!school) return null;

  const gallery = getGallery(schoolId);
  const pages   = {};
  CONFIG.PAGE_TYPES.forEach(function (type) {
    const p = getPage(schoolId, type);
    pages[type] = p ? p.content : '';
  });

  return { school: school, gallery: gallery, pages: pages };
}

// Public — list all active schools (for network home)
function getSchoolsList() {
  return getAllSchools().map(function (s) {
    return {
      id      : s.id,
      name    : s.name,
      district: s.district,
      block   : s.block,
      principal: s.principal,
      students: s.students,
    };
  });
}

// Protected — principal updates their school
function updateSchool(schoolId, updates, token) {
  const session = validateSession(token);
  if (!session) return { success: false, message: 'Session expired' };
  if (session.role === CONFIG.ROLES.PRINCIPAL && session.school_id !== schoolId) {
    return { success: false, message: 'Aap sirf apni school update kar sakte hain' };
  }

  updateSchoolInfo(schoolId, updates, session.email);
  return { success: true, message: 'School info update ho gaya' };
}

// Protected — save page content
function savePageContent(schoolId, pageType, content, token) {
  const session = validateSession(token);
  if (!session) return { success: false, message: 'Session expired' };
  if (session.role === CONFIG.ROLES.PRINCIPAL && session.school_id !== schoolId) {
    return { success: false, message: 'Unauthorized' };
  }

  savePage(schoolId, pageType, content, session.email);
  return { success: true, message: pageType + ' page save ho gaya' };
}

// Protected — get dashboard data for principal
function getDashboardData(token) {
  const session = validateSession(token);
  if (!session) return { success: false, message: 'Session expired' };

  if (session.role === CONFIG.ROLES.SUPER_ADMIN) {
    return {
      success: true,
      role   : CONFIG.ROLES.SUPER_ADMIN,
      name   : session.name,
      schools: getAllSchools(),
      users  : getAllUsers(),
    };
  }

  const school  = getSchool(session.school_id);
  const gallery = getGallery(session.school_id);
  const pages   = {};
  CONFIG.PAGE_TYPES.forEach(function (type) {
    const p = getPage(session.school_id, type);
    pages[type] = p ? p.content : '';
  });

  return {
    success  : true,
    role     : CONFIG.ROLES.PRINCIPAL,
    name     : session.name,
    school   : school,
    gallery  : gallery,
    pages    : pages,
  };
}

// Admin only — add new school
function adminAddSchool(data, token) {
  const session = validateSession(token);
  if (!session || session.role !== CONFIG.ROLES.SUPER_ADMIN) {
    return { success: false, message: 'Super admin only' };
  }
  const id = addSchool(data);
  return { success: true, school_id: id, message: 'School add ho gaya: ' + id };
}

// Admin only — add user
function adminAddUser(data, token) {
  const session = validateSession(token);
  if (!session || session.role !== CONFIG.ROLES.SUPER_ADMIN) {
    return { success: false, message: 'Super admin only' };
  }
  addUser(data);
  return { success: true, message: 'User add ho gaya: ' + data.email };
}
