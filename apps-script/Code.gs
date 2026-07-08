// ============================================================================
// PM SHRI Schools (Uttar Pradesh) — Apps Script backend
//
// SETUP
// 1. Create a Google Sheet with three tabs:
//
//    Tab "Schools" — header row (exact names, in any column order):
//    Code | SchoolName | District | Block | Address | Pincode | Category |
//    Medium | Principal | Phone | Email | EstablishedYear | StudentStrength |
//    TeacherStrength | MapLink | Description | Username | Password
//
//    "Username"/"Password" are the school's own login for editing ONLY its
//    own row. Code must be unique per school (e.g. the UDISE code).
//    MapLink is just the school's "Share" link copied from Google Maps.
//
//    Tab "Admins" — header row:
//    Username | Password | Name
//
//    Super admins listed here can add/edit/delete ANY school row.
//
//    Tab "Photos" — header row (this one is managed entirely by the app,
//    leave it empty other than the header row):
//    PhotoID | Code | Label | URL | Timestamp
//
//    Each school can add any number of labelled photos (Gate, Lab, Students,
//    Sports Day, etc.) — one row per photo. Deleting a photo removes its row.
//
// 2. Extensions > Apps Script on this Sheet, paste this file as Code.gs.
// 3. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
// 4. Copy the /exec URL into js/config.js as APPS_SCRIPT_URL.
//
// Public reads (doGet) never return Username/Password fields.
// Writes (doPost) always re-check the submitted username/password server-side.
// Uploaded photos are saved into the Drive folder identified by
// PHOTO_FOLDER_ID below and shared as anyone-with-link. The account that
// deploys this script must have edit access to that Drive folder.
// ============================================================================

var SCHOOLS_SHEET = "Schools";
var ADMINS_SHEET = "Admins";
var PHOTOS_SHEET = "Photos";
var PUBLIC_HIDDEN_FIELDS = ["Username", "Password"];
// Google Drive folder where uploaded school photos are saved:
// https://drive.google.com/drive/u/0/folders/1Z3jAChk8GLmDjah90O0fwMR7XazyXjJj
var PHOTO_FOLDER_ID = "1Z3jAChk8GLmDjah90O0fwMR7XazyXjJj";

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

function photosForCode_(code) {
  return readRows_(PHOTOS_SHEET)
    .filter(function (p) { return String(p.Code) === String(code); })
    .map(function (p) { return { PhotoID: p.PhotoID, Label: p.Label, URL: p.URL }; });
}

// ---------------------------------------------------------------------------
// Public read access
// ---------------------------------------------------------------------------
function doGet(e) {
  var schools = readRows_(SCHOOLS_SHEET);
  var code = e.parameter.code;

  var result;
  if (code) {
    var school = schools.filter(function (r) { return String(r.Code) === String(code); })[0] || null;
    if (school) {
      school = stripHidden_(school);
      school.Photos = photosForCode_(code);
    }
    result = school;
  } else {
    result = schools.map(stripHidden_);
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
  if (action === "addPhoto") {
    return jsonOutput_(addPhoto_(auth, body.code, body.label, body.filename, body.mimeType, body.base64Data));
  }
  if (action === "deletePhoto") {
    return jsonOutput_(deletePhoto_(auth, body.code, body.photoId));
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

// ---------------------------------------------------------------------------
// Photo gallery (unlimited labelled photos per school, stored in "Photos" tab
// and the actual image files in Google Drive)
// ---------------------------------------------------------------------------
function getPhotoFolder_() {
  return DriveApp.getFolderById(PHOTO_FOLDER_ID);
}

function addPhoto_(auth, code, label, filename, mimeType, base64Data) {
  if (auth.role === "school" && auth.code !== String(code)) {
    return { success: false, error: "You can only add photos for your own school" };
  }
  if (!base64Data) {
    return { success: false, error: "No image data received" };
  }
  if (!label) {
    return { success: false, error: "Please give the photo a label (e.g. Gate, Lab, Students)" };
  }

  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType, code + "_" + label + "_" + Date.now());
  var file = getPhotoFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  var photoId = Utilities.getUuid();

  getSheet_(PHOTOS_SHEET).appendRow([photoId, code, label, url, new Date()]);
  return { success: true, photo: { PhotoID: photoId, Label: label, URL: url } };
}

function deletePhoto_(auth, code, photoId) {
  if (auth.role === "school" && auth.code !== String(code)) {
    return { success: false, error: "You can only delete photos for your own school" };
  }

  var sheet = getSheet_(PHOTOS_SHEET);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf("PhotoID");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(photoId)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: "Photo not found" };
}
