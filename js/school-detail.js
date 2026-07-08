document.addEventListener("DOMContentLoaded", function () {
  var container = document.querySelector("#school-detail");
  if (!container) return;

  var params = new URLSearchParams(window.location.search);
  var code = params.get("code");

  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render(school) {
    if (!school) {
      container.innerHTML = '<p style="color:var(--color-ink-soft);">School not found. Please go back to the <a href="schools.html">directory</a> and try again.</p>';
      return;
    }

    document.title = school.SchoolName + " | PM SHRI Schools, Uttar Pradesh";
    var bannerTitle = document.querySelector("#banner-title");
    if (bannerTitle) bannerTitle.textContent = school.SchoolName;

    container.innerHTML =
      '<div class="grid grid-2">' +
      '  <div>' +
      '    <div class="gallery-tile g3" style="aspect-ratio:16/10; margin-bottom:20px;"><span>' + escapeHTML(school.District) + '</span></div>' +
      '    <span class="tag">UDISE Code: ' + escapeHTML(school.Code) + '</span>' +
      '    <h2 style="color:var(--color-primary-dark); font-size:1.4rem; margin:10px 0 14px;">' + escapeHTML(school.SchoolName) + '</h2>' +
      '    <p style="color:var(--color-ink-soft);">' + escapeHTML(school.Description || "") + '</p>' +
      '  </div>' +
      '  <div class="contact-info-list" style="margin-top:0;">' +
      '    <div class="contact-info-item"><div class="card-icon">📍</div><div><h3>Address</h3><p>' + escapeHTML(school.Address) + ', ' + escapeHTML(school.District) + ' &ndash; ' + escapeHTML(school.Pincode) + '</p></div></div>' +
      '    <div class="contact-info-item"><div class="card-icon">🏷️</div><div><h3>Block</h3><p>' + escapeHTML(school.Block) + '</p></div></div>' +
      '    <div class="contact-info-item"><div class="card-icon">🎓</div><div><h3>Category</h3><p>' + escapeHTML(school.Category) + ' &middot; ' + escapeHTML(school.Medium) + '</p></div></div>' +
      '    <div class="contact-info-item"><div class="card-icon">🧑‍🏫</div><div><h3>Principal</h3><p>' + escapeHTML(school.Principal) + '</p></div></div>' +
      '    <div class="contact-info-item"><div class="card-icon">📞</div><div><h3>Phone</h3><p><a href="tel:' + escapeHTML(school.Phone) + '">' + escapeHTML(school.Phone) + '</a></p></div></div>' +
      '    <div class="contact-info-item"><div class="card-icon">✉️</div><div><h3>Email</h3><p><a href="mailto:' + escapeHTML(school.Email) + '">' + escapeHTML(school.Email) + '</a></p></div></div>' +
      '  </div>' +
      '</div>' +
      '<div class="grid grid-4" style="margin-top:32px;">' +
      '  <div class="card"><h3>Established</h3><p>' + escapeHTML(school.EstablishedYear) + '</p></div>' +
      '  <div class="card"><h3>Students</h3><p>' + escapeHTML(school.StudentStrength) + '</p></div>' +
      '  <div class="card"><h3>Teachers</h3><p>' + escapeHTML(school.TeacherStrength) + '</p></div>' +
      '  <div class="card"><h3>Medium</h3><p>' + escapeHTML(school.Medium) + '</p></div>' +
      '</div>';
  }

  if (!code) {
    render(null);
    return;
  }

  var url = (typeof APPS_SCRIPT_URL !== "undefined" && APPS_SCRIPT_URL)
    ? APPS_SCRIPT_URL + "?code=" + encodeURIComponent(code)
    : SAMPLE_DATA_URL;

  fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (Array.isArray(data)) {
        var match = data.filter(function (s) { return String(s.Code) === String(code); })[0];
        render(match || null);
      } else {
        render(data || null);
      }
    })
    .catch(function () {
      container.innerHTML = '<p style="color:var(--color-ink-soft);">Could not load school data. Check js/config.js or your connection.</p>';
    });
});
