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

    var photos = Array.isArray(school.Photos) ? school.Photos : [];
    var heroPhoto = photos[0];
    var heroHTML = heroPhoto
      ? '<div style="aspect-ratio:16/10; margin-bottom:20px; border-radius:var(--radius); overflow:hidden;"><img src="' + escapeHTML(heroPhoto.URL) + '" alt="' + escapeHTML(heroPhoto.Label) + '" style="width:100%; height:100%; object-fit:cover;"></div>'
      : '<div class="gallery-tile g3" style="aspect-ratio:16/10; margin-bottom:20px;"><span>' + escapeHTML(school.District) + '</span></div>';

    var mapButtonHTML = school.MapLink
      ? '<div style="margin-top:14px;"><a href="' + escapeHTML(school.MapLink) + '" target="_blank" rel="noopener" class="btn btn-primary">📍 View on Google Maps</a></div>'
      : "";

    var galleryHTML = photos.length
      ? '<div class="grid grid-4" style="margin-top:32px;">' +
        photos.map(function (p) {
          return '<div class="card" style="padding:10px; text-align:center;">' +
            '<div style="width:100%; aspect-ratio:4/3; border-radius:8px; overflow:hidden; margin-bottom:8px;"><img src="' + escapeHTML(p.URL) + '" alt="' + escapeHTML(p.Label) + '" style="width:100%; height:100%; object-fit:cover;"></div>' +
            '<p style="font-size:0.85rem; font-weight:600;">' + escapeHTML(p.Label) + '</p>' +
            '</div>';
        }).join("") +
        '</div>'
      : "";

    container.innerHTML =
      '<div class="grid grid-2">' +
      '  <div>' +
      heroHTML +
      '    <span class="tag">UDISE Code: ' + escapeHTML(school.Code) + '</span>' +
      '    <h2 style="color:var(--color-primary-dark); font-size:1.4rem; margin:10px 0 14px;">' + escapeHTML(school.SchoolName) + '</h2>' +
      '    <p style="color:var(--color-ink-soft);">' + escapeHTML(school.Description || "") + '</p>' +
      mapButtonHTML +
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
      '</div>' +
      galleryHTML;
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
