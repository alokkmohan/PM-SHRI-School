// ============================================================
// Run this ONCE to set up the Google Sheet
// Google Apps Script editor mein → Run → setupAuthSheet
// ============================================================

function setupAuthSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName('AuthUsers');
  if (!sheet) sheet = ss.insertSheet('AuthUsers');

  // Clear and set headers
  sheet.clearContents();
  const headers = [
    'Email', 'Blog ID', 'Name', 'Role',
    'Is Active', 'OTP', 'OTP Expires', 'Last Login', 'Login Count'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Header styling
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1B3A6B');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);

  // Sample data — APNA DATA YAHAN DAALEN
  const sampleData = [
    // email                          blog_id  name                      role          active  otp  expires  last_login  count
    ['alokmohann@gmail.com',          2,       'Alok Mohan (Test)',       'principal',  true,   '',  '',      '',         0],
    ['alok.mohan@educategirls.ngo',   0,       'Alok Mohan',             'super_admin', true,  '',  '',      '',         0],
    // Baaki 160 principals yahan add honge
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);

  // Column widths
  sheet.setColumnWidth(1, 260);  // Email
  sheet.setColumnWidth(2, 70);   // Blog ID
  sheet.setColumnWidth(3, 200);  // Name
  sheet.setColumnWidth(4, 100);  // Role
  sheet.setColumnWidth(5, 80);   // Active
  sheet.setColumnWidth(6, 80);   // OTP
  sheet.setColumnWidth(7, 160);  // Expires
  sheet.setColumnWidth(8, 160);  // Last Login
  sheet.setColumnWidth(9, 90);   // Count

  // Freeze header row
  sheet.setFrozenRows(1);

  // OTP + Expires columns — light gray (system managed)
  sheet.getRange('F:G').setBackground('#f0f0f0');
  sheet.getRange('H:I').setBackground('#e8f4fd');

  // Active column — dropdown
  const activeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('E2:E200').setDataValidation(activeRule);

  // Role column — dropdown
  const roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['principal', 'super_admin'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('D2:D200').setDataValidation(roleRule);

  // Conditional formatting — active=TRUE green, FALSE red
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('TRUE')
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([sheet.getRange('E2:E200')])
    .build();
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('FALSE')
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([sheet.getRange('E2:E200')])
    .build();
  sheet.setConditionalFormatRules([greenRule, redRule]);

  SpreadsheetApp.getUi().alert(
    '✅ AuthUsers sheet setup complete!\n\n' +
    'Ab Code.gs mein SHEET_ID update karo\n' +
    'aur Web App deploy karo.'
  );
}
