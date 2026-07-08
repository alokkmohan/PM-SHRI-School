document.addEventListener("DOMContentLoaded", function () {
  var listEl = document.querySelector("#schools-list");
  var searchEl = document.querySelector("#school-search");
  var districtEl = document.querySelector("#district-filter");
  var countEl = document.querySelector("#result-count");
  var statusEl = document.querySelector("#load-status");

  if (!listEl) return;

  var allSchools = [];

  function cardHTML(school, index) {
    var swatch = "g" + ((index % 8) + 1);
    return (
      '<a class="card" href="school.html?code=' + encodeURIComponent(school.Code) + '" style="display:block;">' +
      '<div class="gallery-tile ' + swatch + '" style="aspect-ratio:16/9; margin-bottom:16px;"><span>' + escapeHTML(school.District || "") + '</span></div>' +
      '<h3>' + escapeHTML(school.SchoolName || "Untitled School") + '</h3>' +
      '<p style="margin-bottom:6px;">' + escapeHTML(school.Block || "") + ', ' + escapeHTML(school.District || "") + '</p>' +
      '<span class="tag">UDISE: ' + escapeHTML(String(school.Code || "N/A")) + '</span>' +
      '</a>'
    );
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render() {
    var query = (searchEl.value || "").toLowerCase().trim();
    var district = districtEl.value;

    var filtered = allSchools.filter(function (school) {
      var matchesQuery = !query ||
        (school.SchoolName || "").toLowerCase().indexOf(query) !== -1 ||
        (school.District || "").toLowerCase().indexOf(query) !== -1 ||
        String(school.Code || "").toLowerCase().indexOf(query) !== -1;
      var matchesDistrict = !district || school.District === district;
      return matchesQuery && matchesDistrict;
    });

    listEl.innerHTML = filtered.map(cardHTML).join("") ||
      '<p style="color:var(--color-ink-soft);">No schools match your search.</p>';
    countEl.textContent = filtered.length + " of " + allSchools.length + " schools";
  }

  function populateDistricts() {
    var districts = Array.from(new Set(allSchools.map(function (s) { return s.District; }).filter(Boolean))).sort();
    districts.forEach(function (d) {
      var opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      districtEl.appendChild(opt);
    });
  }

  function loadData() {
    var url = (typeof APPS_SCRIPT_URL !== "undefined" && APPS_SCRIPT_URL) ? APPS_SCRIPT_URL : SAMPLE_DATA_URL;
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        allSchools = Array.isArray(data) ? data : [];
        populateDistricts();
        render();
        if (statusEl) {
          statusEl.textContent = (typeof APPS_SCRIPT_URL !== "undefined" && APPS_SCRIPT_URL)
            ? ""
            : "Showing sample data. Set APPS_SCRIPT_URL in js/config.js to load the full 157-school list.";
          statusEl.hidden = !statusEl.textContent;
        }
      })
      .catch(function () {
        if (statusEl) {
          statusEl.textContent = "Could not load school data. Check APPS_SCRIPT_URL in js/config.js or your connection.";
          statusEl.hidden = false;
        }
      });
  }

  searchEl.addEventListener("input", render);
  districtEl.addEventListener("change", render);
  loadData();
});
