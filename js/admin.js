document.addEventListener("DOMContentLoaded", function () {
  var loginView = document.querySelector("#login-view");
  var schoolView = document.querySelector("#school-view");
  var adminView = document.querySelector("#admin-view");
  if (!loginView) return;

  var loginForm = document.querySelector("#login-form");
  var loginError = document.querySelector("#login-error");

  var FIELDS = [
    { key: "SchoolName", label: "School Name", type: "text" },
    { key: "District", label: "District", type: "text" },
    { key: "Block", label: "Block", type: "text" },
    { key: "Address", label: "Address", type: "text" },
    { key: "Pincode", label: "Pincode", type: "text" },
    { key: "Category", label: "Category", type: "text" },
    { key: "Medium", label: "Medium", type: "text" },
    { key: "Principal", label: "Principal", type: "text" },
    { key: "Phone", label: "Phone", type: "text" },
    { key: "Email", label: "Email", type: "email" },
    { key: "EstablishedYear", label: "Established Year", type: "text" },
    { key: "StudentStrength", label: "Student Strength", type: "text" },
    { key: "TeacherStrength", label: "Teacher Strength", type: "text" },
    { key: "Latitude", label: "Latitude", type: "text" },
    { key: "Longitude", label: "Longitude", type: "text" },
    { key: "ImageURL", label: "Image URL", type: "text" },
    { key: "Description", label: "Description", type: "textarea" }
  ];

  function api(action, extra) {
    var auth = getAuth();
    var payload = Object.assign(
      { action: action, username: auth && auth.username, password: auth && auth.password },
      extra || {}
    );
    return fetch(APPS_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); });
  }

  function getAuth() {
    var raw = sessionStorage.getItem("pmshri_auth");
    return raw ? JSON.parse(raw) : null;
  }

  function setAuth(auth) {
    sessionStorage.setItem("pmshri_auth", JSON.stringify(auth));
  }

  function clearAuth() {
    sessionStorage.removeItem("pmshri_auth");
  }

  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fieldHTML(field, value) {
    var val = escapeHTML(value);
    if (field.type === "textarea") {
      return '<div class="form-field"><label>' + field.label + '</label><textarea rows="3" data-field="' + field.key + '">' + val + '</textarea></div>';
    }
    return '<div class="form-field"><label>' + field.label + '</label><input type="' + field.type + '" data-field="' + field.key + '" value="' + val + '"></div>';
  }

  function collectFields(root, includeEmpty) {
    var fields = {};
    root.querySelectorAll("[data-field]").forEach(function (el) {
      var val = el.value.trim();
      if (val || includeEmpty) fields[el.dataset.field] = val;
    });
    return fields;
  }

  // ---------------- Login ----------------
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;

    if (!APPS_SCRIPT_URL) {
      loginError.textContent = "Admin login requires APPS_SCRIPT_URL to be set in js/config.js.";
      loginError.hidden = false;
      return;
    }

    var username = document.querySelector("#login-username").value.trim();
    var password = document.querySelector("#login-password").value;

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", username: username, password: password })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) {
          loginError.textContent = data.error || "Login failed.";
          loginError.hidden = false;
          return;
        }
        setAuth(Object.assign({ username: username, password: password }, data.auth));
        showDashboard(data.auth);
      })
      .catch(function () {
        loginError.textContent = "Could not reach the server. Check APPS_SCRIPT_URL.";
        loginError.hidden = false;
      });
  });

  function showDashboard(auth) {
    loginView.hidden = true;
    if (auth.role === "admin") {
      adminView.hidden = false;
      loadAdminTable();
    } else {
      schoolView.hidden = false;
      loadSchoolForm(auth.code);
    }
  }

  // ---------------- School-level dashboard ----------------
  function loadSchoolForm(code) {
    var container = document.querySelector("#school-form-container");
    container.innerHTML = "<p>Loading your school's information&hellip;</p>";

    fetch(APPS_SCRIPT_URL + "?code=" + encodeURIComponent(code))
      .then(function (res) { return res.json(); })
      .then(function (school) {
        if (!school) {
          container.innerHTML = "<p>Could not find your school record.</p>";
          return;
        }
        container.innerHTML =
          FIELDS.map(function (f) { return fieldHTML(f, school[f.key]); }).join("") +
          '<button id="school-save" class="btn btn-accent">Save Changes</button>' +
          '<p id="school-save-status" class="form-note" hidden></p>';

        document.querySelector("#school-save").addEventListener("click", function () {
          var status = document.querySelector("#school-save-status");
          var fields = collectFields(container, true);
          api("updateSchool", { code: code, fields: fields }).then(function (data) {
            status.hidden = false;
            status.textContent = data.success ? "Saved successfully." : (data.error || "Save failed.");
            status.style.color = data.success ? "" : "#c0392b";
          });
        });
      });
  }

  document.querySelector("#school-logout").addEventListener("click", logout);

  // ---------------- Super admin dashboard ----------------
  var allSchools = [];

  function loadAdminTable() {
    fetch(APPS_SCRIPT_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        allSchools = Array.isArray(data) ? data : [];
        renderAdminTable(allSchools);
      });
  }

  function renderAdminTable(schools) {
    var body = document.querySelector("#admin-table-body");
    body.innerHTML = schools.map(function (s) {
      return "<tr style='border-top:1px solid var(--color-border);'>" +
        "<td style='padding:10px 14px; font-size:0.85rem;'>" + escapeHTML(s.Code) + "</td>" +
        "<td style='padding:10px 14px; font-size:0.85rem;'>" + escapeHTML(s.SchoolName) + "</td>" +
        "<td style='padding:10px 14px; font-size:0.85rem;'>" + escapeHTML(s.District) + "</td>" +
        "<td style='padding:10px 14px; font-size:0.85rem; white-space:nowrap;'>" +
        "<button class='btn btn-ghost' style='padding:6px 12px; border-color:var(--color-border); color:var(--color-primary-dark);' data-edit='" + escapeHTML(s.Code) + "'>Edit</button> " +
        "<button class='btn btn-ghost' style='padding:6px 12px; border-color:var(--color-border); color:#c0392b;' data-delete='" + escapeHTML(s.Code) + "'>Delete</button>" +
        "</td></tr>";
    }).join("") || "<tr><td colspan='4' style='padding:16px;'>No schools found.</td></tr>";

    body.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () { openEditModal(btn.dataset.edit); });
    });
    body.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () { deleteSchool(btn.dataset.delete); });
    });
  }

  document.querySelector("#admin-search").addEventListener("input", function (e) {
    var q = e.target.value.toLowerCase();
    renderAdminTable(allSchools.filter(function (s) {
      return (s.SchoolName || "").toLowerCase().indexOf(q) !== -1 ||
        (s.District || "").toLowerCase().indexOf(q) !== -1 ||
        String(s.Code || "").toLowerCase().indexOf(q) !== -1;
    }));
  });

  var modal = document.querySelector("#admin-form-modal");
  var modalContainer = document.querySelector("#admin-form-container");

  function closeModal() { modal.style.display = "none"; modalContainer.innerHTML = ""; }
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  function openEditModal(code) {
    var school = allSchools.filter(function (s) { return String(s.Code) === String(code); })[0];
    if (!school) return;

    modalContainer.innerHTML =
      "<h3 style='margin-bottom:16px;'>Edit School &mdash; " + escapeHTML(school.SchoolName) + "</h3>" +
      '<div class="form-field"><label>Code (not editable)</label><input type="text" value="' + escapeHTML(school.Code) + '" disabled></div>' +
      FIELDS.map(function (f) { return fieldHTML(f, school[f.key]); }).join("") +
      '<div class="form-field"><label>Username (leave blank to keep unchanged)</label><input type="text" data-field="Username"></div>' +
      '<div class="form-field"><label>Password (leave blank to keep unchanged)</label><input type="text" data-field="Password"></div>' +
      '<div style="display:flex; gap:10px;"><button id="modal-save" class="btn btn-accent">Save</button><button id="modal-cancel" class="btn btn-ghost">Cancel</button></div>' +
      '<p id="modal-status" class="form-note" hidden></p>';

    modal.style.display = "flex";
    document.querySelector("#modal-cancel").addEventListener("click", closeModal);
    document.querySelector("#modal-save").addEventListener("click", function () {
      var status = document.querySelector("#modal-status");
      var fields = collectFields(modalContainer, false);
      api("updateSchool", { code: school.Code, fields: fields }).then(function (data) {
        status.hidden = false;
        status.textContent = data.success ? "Saved." : (data.error || "Save failed.");
        status.style.color = data.success ? "" : "#c0392b";
        if (data.success) { loadAdminTable(); setTimeout(closeModal, 700); }
      });
    });
  }

  document.querySelector("#admin-add-btn").addEventListener("click", function () {
    modalContainer.innerHTML =
      "<h3 style='margin-bottom:16px;'>Add New School</h3>" +
      '<div class="form-field"><label>Code (unique, required)</label><input type="text" data-field="Code" required></div>' +
      FIELDS.map(function (f) { return fieldHTML(f, ""); }).join("") +
      '<div class="form-field"><label>Username</label><input type="text" data-field="Username"></div>' +
      '<div class="form-field"><label>Password</label><input type="text" data-field="Password"></div>' +
      '<div style="display:flex; gap:10px;"><button id="modal-save" class="btn btn-accent">Add School</button><button id="modal-cancel" class="btn btn-ghost">Cancel</button></div>' +
      '<p id="modal-status" class="form-note" hidden></p>';

    modal.style.display = "flex";
    document.querySelector("#modal-cancel").addEventListener("click", closeModal);
    document.querySelector("#modal-save").addEventListener("click", function () {
      var status = document.querySelector("#modal-status");
      var fields = collectFields(modalContainer, true);
      if (!fields.Code) {
        status.hidden = false;
        status.textContent = "Code is required.";
        status.style.color = "#c0392b";
        return;
      }
      api("addSchool", { fields: fields }).then(function (data) {
        status.hidden = false;
        status.textContent = data.success ? "School added." : (data.error || "Add failed.");
        status.style.color = data.success ? "" : "#c0392b";
        if (data.success) { loadAdminTable(); setTimeout(closeModal, 700); }
      });
    });
  });

  function deleteSchool(code) {
    if (!confirm("Delete this school record permanently?")) return;
    api("deleteSchool", { code: code }).then(function (data) {
      if (data.success) loadAdminTable();
      else alert(data.error || "Delete failed.");
    });
  }

  document.querySelector("#admin-logout").addEventListener("click", logout);

  function logout() {
    clearAuth();
    window.location.reload();
  }

  // ---------------- Resume session ----------------
  var existing = getAuth();
  if (existing) showDashboard(existing);
});
