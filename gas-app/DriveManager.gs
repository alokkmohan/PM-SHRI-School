// ============================================================
// Drive Manager — File uploads, folder management
// ============================================================

function getOrCreateSchoolFolder(schoolId, schoolName) {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);

  // Check if school already has a folder recorded
  const school = getSchool(schoolId);
  if (school && school.folder_id) {
    try {
      return DriveApp.getFolderById(school.folder_id);
    } catch (e) { /* folder deleted, recreate */ }
  }

  // Create new folder
  const folderName = schoolId + '_' + schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const folder     = root.createFolder(folderName);

  // Save folder ID back to sheet
  const sheet = getSheet(CONFIG.TABS.SCHOOLS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][SC.ID] === schoolId) {
      sheet.getRange(i + 1, SC.FOLDER_ID + 1).setValue(folder.getId());
      break;
    }
  }
  return folder;
}

// Called from client — receives base64 image
function uploadPhoto(base64Data, fileName, mimeType, schoolId, caption, token) {
  const session = validateSession(token);
  if (!session) return { success: false, message: 'Session expired' };
  if (session.role === CONFIG.ROLES.PRINCIPAL && session.school_id !== schoolId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const school  = getSchool(schoolId);
    const folder  = getOrCreateSchoolFolder(schoolId, school ? school.name : schoolId);
    const blob    = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const file    = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = 'https://drive.google.com/uc?id=' + file.getId() + '&export=view';
    addGalleryItem(schoolId, file.getId(), fileUrl, caption || '', session.email);

    return { success: true, file_url: fileUrl, message: 'Photo upload ho gaya' };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Upload failed: ' + e.message };
  }
}

function deletePhoto(imageId, schoolId, token) {
  const session = validateSession(token);
  if (!session) return { success: false, message: 'Session expired' };
  if (session.role === CONFIG.ROLES.PRINCIPAL && session.school_id !== schoolId) {
    return { success: false, message: 'Unauthorized' };
  }
  deleteGalleryItem(imageId, schoolId);
  return { success: true };
}
