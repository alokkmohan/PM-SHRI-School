// ============================================================
// Router — Main entry point for GAS Web App
// ============================================================

function doGet(e) {
  const p     = (e.parameter && e.parameter.p) ? e.parameter.p : 'home';
  const s     = (e.parameter && e.parameter.s) ? e.parameter.s : '';
  const token = (e.parameter && e.parameter.token) ? e.parameter.token : '';

  try {
    switch (p) {
      case 'home':
        return serveTemplate('NetworkHome', {});

      case 'site':
        if (!s) return serveError('School ID missing');
        const schoolData = getSchoolPublicData(s);
        if (!schoolData) return serveError('School not found: ' + s);
        return serveTemplate('SchoolSite', { data: JSON.stringify(schoolData), schoolId: s });

      case 'login':
        return serveTemplate('Login', {});

      case 'dashboard':
        // Serve shell — client-side JS will load data using token from localStorage
        return serveTemplate('Dashboard', {});

      case 'admin':
        return serveTemplate('AdminPanel', {});

      default:
        return serveTemplate('NetworkHome', {});
    }
  } catch (err) {
    console.error(err);
    return serveError('Server error: ' + err.message);
  }
}

function serveTemplate(name, vars) {
  const tmpl = HtmlService.createTemplateFromFile(name);
  // Inject server vars into template
  Object.keys(vars).forEach(function (k) { tmpl[k] = vars[k]; });
  return tmpl.evaluate()
    .setTitle('PM SHRI Schools Network — UP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveError(msg) {
  return HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;padding:40px;text-align:center">' +
    '<h2 style="color:#1B3A6B">PM SHRI Schools</h2>' +
    '<p style="color:#e53e3e">' + msg + '</p>' +
    '<a href="' + getBaseUrl() + '">← Home par jao</a></div>'
  );
}

// Utility — include shared CSS/JS files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getBaseUrl() {
  return ScriptApp.getService().getUrl();
}

// Called from client — get base URL for navigation
function getAppUrl() {
  return getBaseUrl();
}
