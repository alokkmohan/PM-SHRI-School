// ============================================================
// PM SHRI Schools Network — Constants
// ============================================================

const CONFIG = {
  SHEET_ID        : 'REPLACE_WITH_SHEET_ID',
  ROOT_FOLDER_ID  : 'REPLACE_WITH_DRIVE_FOLDER_ID',
  OTP_EXPIRY_MIN  : 10,
  SESSION_HOURS   : 8,
  SYSTEM_NAME     : 'PM SHRI Schools Network',
  STATE           : 'Uttar Pradesh',
  SUPPORT_EMAIL   : 'alok.mohan@educategirls.ngo',

  TABS: {
    SCHOOLS       : 'Schools',
    USERS         : 'Users',
    PAGES         : 'Pages',
    GALLERY       : 'Gallery',
    OTP           : 'OTPStore',
    ANNOUNCEMENTS : 'Announcements',
  },

  ROLES: {
    SUPER_ADMIN   : 'super_admin',
    PRINCIPAL     : 'principal',
  },

  PAGE_TYPES: ['about', 'academics', 'facilities', 'contact'],
};

// Schools sheet columns (0-based)
const SC = {
  ID          : 0,   // school_id
  NAME        : 1,
  DISTRICT    : 2,
  BLOCK       : 3,
  ADDRESS     : 4,
  PHONE       : 5,
  EMAIL       : 6,
  PRINCIPAL   : 7,
  ESTABLISHED : 8,
  STUDENTS    : 9,
  TEACHERS    : 10,
  CLASSES     : 11,
  AFFILIATION : 12,
  TAGLINE     : 13,
  NOTICE      : 14,
  FOLDER_ID   : 15,
  IS_ACTIVE   : 16,
  CREATED_AT  : 17,
};

// Users sheet columns (0-based)
const UC = {
  EMAIL       : 0,
  NAME        : 1,
  ROLE        : 2,
  SCHOOL_ID   : 3,
  IS_ACTIVE   : 4,
  CREATED_AT  : 5,
  LAST_LOGIN  : 6,
  LOGIN_COUNT : 7,
};

// OTPStore sheet columns (0-based)
const OC = {
  EMAIL       : 0,
  OTP         : 1,
  EXPIRES_AT  : 2,
  USED        : 3,
  CREATED_AT  : 4,
};

// Pages sheet columns (0-based)
const PC = {
  SCHOOL_ID   : 0,
  PAGE_TYPE   : 1,
  CONTENT     : 2,
  UPDATED_BY  : 3,
  UPDATED_AT  : 4,
};

// Gallery sheet columns (0-based)
const GC = {
  ID          : 0,
  SCHOOL_ID   : 1,
  FILE_ID     : 2,
  FILE_URL    : 3,
  CAPTION     : 4,
  UPLOADED_BY : 5,
  UPLOADED_AT : 6,
  IS_ACTIVE   : 7,
};
