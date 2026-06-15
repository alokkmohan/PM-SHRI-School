// ============================================================
// Run ONCE to set up the Google Sheet
// Apps Script Editor → Run → setupAllSheets
// ============================================================

function setupAllSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  setupSchoolsSheet(ss);
  setupUsersSheet(ss);
  setupPagesSheet(ss);
  setupGallerySheet(ss);
  setupOTPSheet(ss);
  setupAnnouncementsSheet(ss);
  SpreadsheetApp.getUi().alert('✅ All sheets setup complete!\n\nAb Web App deploy karo.');
}

function makeSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setBackground('#1B3A6B').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function setupSchoolsSheet(ss) {
  const headers = [
    'school_id','name','district','block','address','phone','email',
    'principal','established','students','teachers','classes',
    'affiliation','tagline','notice','folder_id','is_active','created_at'
  ];
  const sheet = makeSheet(ss, 'Schools', headers);

  // Sample school data
  const sample = [
    ['PMSHRI_UP_001','GGIC Lucknow','Lucknow','Hazratganj','MG Road, Lucknow','0522-2615000','ggic.lko@up.gov.in','Smt. Priya Sharma','1935',800,42,12,'UP Board','Shiksha ke Prakash Mein','','',true,new Date().toISOString()],
    ['PMSHRI_UP_002','GICS Prayagraj','Prayagraj','Civil Lines','Allahpur, Prayagraj','0532-2407000','gics.pryj@up.gov.in','Shri Ramesh Kumar','1952',600,35,10,'UP Board','Gyan Ki Roshni','','',true,new Date().toISOString()],
    ['PMSHRI_UP_003','RMPS Varanasi','Varanasi','Sigra','Lanka, Varanasi','0542-2368000','rmps.vns@up.gov.in','Dr. Anjali Singh','1948',750,38,12,'CBSE','Vidya Vikas','','',true,new Date().toISOString()],
  ];
  sheet.getRange(2, 1, sample.length, headers.length).setValues(sample);
  sheet.setColumnWidth(1, 140); sheet.setColumnWidth(2, 200); sheet.setColumnWidth(3, 110);
}

function setupUsersSheet(ss) {
  const headers = ['email','name','role','school_id','is_active','created_at','last_login','login_count'];
  const sheet   = makeSheet(ss, 'Users', headers);

  const sample = [
    ['alok.mohan@educategirls.ngo','Alok Mohan','super_admin','',true,new Date().toISOString(),'',0],
    ['principal.001@up.gov.in','Smt. Priya Sharma','principal','PMSHRI_UP_001',true,new Date().toISOString(),'',0],
    ['principal.002@up.gov.in','Shri Ramesh Kumar','principal','PMSHRI_UP_002',true,new Date().toISOString(),'',0],
    ['principal.003@up.gov.in','Dr. Anjali Singh','principal','PMSHRI_UP_003',true,new Date().toISOString(),'',0],
  ];
  sheet.getRange(2, 1, sample.length, headers.length).setValues(sample);

  // Role dropdown
  const roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['super_admin','principal'],true).setAllowInvalid(false).build();
  sheet.getRange('C2:C200').setDataValidation(roleRule);
}

function setupPagesSheet(ss) {
  const headers = ['school_id','page_type','content','updated_by','updated_at'];
  makeSheet(ss, 'Pages', headers);
}

function setupGallerySheet(ss) {
  const headers = ['gallery_id','school_id','file_id','file_url','caption','uploaded_by','uploaded_at','is_active'];
  makeSheet(ss, 'Gallery', headers);
}

function setupOTPSheet(ss) {
  const headers = ['email','otp','expires_at','used','created_at'];
  const sheet   = makeSheet(ss, 'OTPStore', headers);
  sheet.getRange('A:E').setBackground('#f8f8f8');
}

function setupAnnouncementsSheet(ss) {
  const headers = ['school_id','text','date','created_by','is_active'];
  makeSheet(ss, 'Announcements', headers);
}
