// ============================================================================
// PM SHRI Schools (Uttar Pradesh) — Apps Script backend
//
// SETUP
// 1. Create a Google Sheet with two tabs:
//
//    Tab "Schools" — header row (exact names, in any column order):
//    Code | SchoolName | District | Block | Address | Pincode | Category |
//    Medium | Principal | Phone | Email | EstablishedYear | StudentStrength |
//    TeacherStrength | Latitude | Longitude | ImageURL | Description |
//    Username | Password
//
//    "Username"/"Password" are the school's own login for editing ONLY its
//    own row. Code must be unique per school (e.g. the UDISE code).
//
//    Tab "Admins" — header row:
//    Username | Password | Name
//
//    Super admins listed here can add/edit/delete ANY school row.
//
// 2. Extensions > Apps Script on this Sheet, paste this file as Code.gs.
// 3. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
// 4. Copy the /exec URL into js/config.js as APPS_SCRIPT_URL.
//
// Public reads (doGet) never return Username/Password fields.
// Writes (doPost) always re-check the submitted username/password server-side.
// ============================================================================

var SCHOOLS_SHEET = "Schools";
var ADMINS_SHEET = "Admins";
var PUBLIC_HIDDEN_FIELDS = ["Username", "Password"];

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function readRows_(sheetName) {
  var sheet = getSheet_(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return data
    .filter(function (row) { return row[0] !== ""; })
    .map(function (row, i) {
      var obj = { __row: i + 2 }; // actual sheet row number (1-based + header)
      headers.forEach(function (header, j) { obj[header] = row[j]; });
      return obj;
    });
}

function stripHidden_(school) {
  var copy = {};
  Object.keys(school).forEach(function (key) {
    if (key === "__row" || PUBLIC_HIDDEN_FIELDS.indexOf(key) !== -1) return;
    copy[key] = school[key];
  });
  return copy;
}

// ---------------------------------------------------------------------------
// Public read access
// ---------------------------------------------------------------------------
function doGet(e) {
  var schools = readRows_(SCHOOLS_SHEET);
  var code = e.parameter.code;

  var result = code
    ? (schools.filter(function (r) { return String(r.Code) === String(code); })[0] || null)
    : schools;

  if (Array.isArray(result)) {
    result = result.map(stripHidden_);
  } else if (result) {
    result = stripHidden_(result);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Auth + writes
// ---------------------------------------------------------------------------
function authenticate_(username, password) {
  if (!username || !password) return null;

  var admins = readRows_(ADMINS_SHEET);
  var admin = admins.filter(function (a) {
    return a.Username === username && String(a.Password) === String(password);
  })[0];
  if (admin) return { role: "admin", username: username };

  var schools = readRows_(SCHOOLS_SHEET);
  var school = schools.filter(function (s) {
    return s.Username === username && String(s.Password) === String(password);
  })[0];
  if (school) return { role: "school", username: username, code: String(school.Code) };

  return null;
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var action = body.action;
  var auth = authenticate_(body.username, body.password);

  if (action === "login") {
    return jsonOutput_(auth ? { success: true, auth: auth } : { success: false, error: "Invalid username or password" });
  }

  if (!auth) {
    return jsonOutput_({ success: false, error: "Invalid username or password" });
  }

  if (action === "updateSchool") {
    return jsonOutput_(updateSchool_(auth, body.code, body.fields));
  }
  if (action === "addSchool") {
    if (auth.role !== "admin") return jsonOutput_({ success: false, error: "Only super admins can add schools" });
    return jsonOutput_(addSchool_(body.fields));
  }
  if (action === "deleteSchool") {
    if (auth.role !== "admin") return jsonOutput_({ success: false, error: "Only super admins can delete schools" });
    return jsonOutput_(deleteSchool_(body.code));
  }

  return jsonOutput_({ success: false, error: "Unknown action" });
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateSchool_(auth, code, fields) {
  if (auth.role === "school" && auth.code !== String(code)) {
    return { success: false, error: "You can only edit your own school" };
  }

  var sheet = getSheet_(SCHOOLS_SHEET);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var codeCol = headers.indexOf("Code");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][codeCol]) === String(code)) {
      var rowNum = i + 1;
      headers.forEach(function (header, colIdx) {
        if (header === "Code") return; // identity column, not editable
        if (auth.role === "school" && (header === "Username" || header === "Password")) return; // school users can't change their own login
        if (Object.prototype.hasOwnProperty.call(fields, header)) {
          sheet.getRange(rowNum, colIdx + 1).setValue(fields[header]);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: "School not found" };
}

function addSchool_(fields) {
  var sheet = getSheet_(SCHOOLS_SHEET);
  var headers = sheet.getDataRange().getValues()[0];

  if (!fields || !fields.Code) return { success: false, error: "Code is required" };

  var existing = readRows_(SCHOOLS_SHEET);
  if (existing.some(function (s) { return String(s.Code) === String(fields.Code); })) {
    return { success: false, error: "A school with this Code already exists" };
  }

  var row = headers.map(function (header) { return fields[header] || ""; });
  sheet.appendRow(row);
  return { success: true };
}

function deleteSchool_(code) {
  var sheet = getSheet_(SCHOOLS_SHEET);
  var data = sheet.getDataRange().getValues();
  var codeCol = data[0].indexOf("Code");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][codeCol]) === String(code)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: "School not found" };
}
