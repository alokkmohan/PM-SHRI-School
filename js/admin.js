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
    { key: "MapLink", label: "Google Maps Link (paste the \"Share\" link)", type: "text" },
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

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result.split(",")[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function galleryManagerHTML() {
    return (
      '<div class="form-field">' +
      '<label>Photo Gallery (Gate, Building, Lab, Students, Sports Day &mdash; add as many as you like)</label>' +
      '<div id="gallery-grid" class="grid grid-4" style="margin-bottom:14px;"></div>' +
      '<div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">' +
      '<input type="text" id="new-photo-label" placeholder="Label (e.g. Gate, Lab, Students)" style="max-width:220px; padding:10px 14px; border:1px solid var(--color-border); border-radius:var(--radius);">' +
      '<input type="file" id="new-photo-file" accept="image/*">' +
      '<button type="button" id="add-photo-btn" class="btn btn-primary">Add Photo</button>' +
      '</div>' +
      '<p id="gallery-status" class="form-note" hidden></p>' +
      '</div>'
    );
  }

  function photoCardHTML(photo) {
    return (
      '<div class="card" style="padding:10px; text-align:center;">' +
      '<div style="width:100%; aspect-ratio:4/3; border-radius:8px; overflow:hidden; margin-bottom:8px; background:var(--color-bg-alt);">' +
      '<img src="' + photo.URL + '" alt="' + escapeHTML(photo.Label) + '" style="width:100%; height:100%; object-fit:cover;">' +
      '</div>' +
      '<p style="font-size:0.85rem; font-weight:600; margin-bottom:8px;">' + escapeHTML(photo.Label) + '</p>' +
      '<button type="button" class="btn btn-ghost" data-delete-photo="' + escapeHTML(photo.PhotoID) + '" style="padding:4px 10px; font-size:0.78rem; color:#c0392b; border-color:var(--color-border);">Remove</button>' +
      '</div>'
    );
  }

  function bindGalleryManager(root, code, initialPhotos) {
    var photos = (initialPhotos || []).slice();

    function draw() {
      var grid = root.querySelector("#gallery-grid");
      grid.innerHTML = photos.map(photoCardHTML).join("") ||
        '<p style="color:var(--color-ink-soft); font-size:0.85rem;">No photos yet.</p>';
      grid.querySelectorAll("[data-delete-photo]").forEach(function (btn) {
        btn.addEventListener("click", function () { removePhoto(btn.dataset.deletePhoto); });
      });
    }

    function removePhoto(photoId) {
      if (!confirm("Remove this photo?")) return;
      api("deletePhoto", { code: code, photoId: photoId }).then(function (data) {
        if (data.success) {
          photos = photos.filter(function (p) { return p.PhotoID !== photoId; });
          draw();
        } else {
          alert(data.error || "Remove failed.");
        }
      });
    }

    draw();

    root.querySelector("#add-photo-btn").addEventListener("click", function () {
      var labelInput = root.querySelector("#new-photo-label");
      var fileInput = root.querySelector("#new-photo-file");
      var status = root.querySelector("#gallery-status");
      var label = labelInput.value.trim();
      var file = fileInput.files[0];

      if (!label) { alert("Please enter a label for the photo (e.g. Gate, Lab, Students)."); return; }
      if (!file) { alert("Please choose a photo file."); return; }
      if (file.size > 5 * 1024 * 1024) { alert("Please choose an image under 5MB."); return; }

      status.hidden = false;
      status.style.color = "";
      status.textContent = "Uploading…";

      readFileAsBase64(file)
        .then(function (base64) {
          return api("addPhoto", { code: code, label: label, filename: file.name, mimeType: file.type, base64Data: base64 });
        })
        .then(function (data) {
          if (data.success) {
            status.textContent = "Photo added.";
            photos.push(data.photo);
            draw();
            labelInput.value = "";
            fileInput.value = "";
          } else {
            status.textContent = data.error || "Upload failed.";
            status.style.color = "#c0392b";
          }
        })
        .catch(function () {
          status.textContent = "Upload failed. Check your connection.";
          status.style.color = "#c0392b";
        });
    });
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
          galleryManagerHTML() +
          '<button id="school-save" class="btn btn-accent">Save Changes</button>' +
          '<p id="school-save-status" class="form-note" hidden></p>';

        bindGalleryManager(container, code, school.Photos);

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

    modalContainer.innerHTML = "<p>Loading school details&hellip;</p>";
    modal.style.display = "flex";

    fetch(APPS_SCRIPT_URL + "?code=" + encodeURIComponent(code))
      .then(function (res) { return res.json(); })
      .then(function (detail) {
        detail = detail || school;
        modalContainer.innerHTML =
          "<h3 style='margin-bottom:16px;'>Edit School &mdash; " + escapeHTML(detail.SchoolName) + "</h3>" +
          '<div class="form-field"><label>Code (not editable)</label><input type="text" value="' + escapeHTML(detail.Code) + '" disabled></div>' +
          FIELDS.map(function (f) { return fieldHTML(f, detail[f.key]); }).join("") +
          galleryManagerHTML() +
          '<div class="form-field"><label>Username (leave blank to keep unchanged)</label><input type="text" data-field="Username"></div>' +
          '<div class="form-field"><label>Password (leave blank to keep unchanged)</label><input type="text" data-field="Password"></div>' +
          '<div style="display:flex; gap:10px;"><button id="modal-save" class="btn btn-accent">Save</button><button id="modal-cancel" class="btn btn-ghost">Cancel</button></div>' +
          '<p id="modal-status" class="form-note" hidden></p>';

        bindGalleryManager(modalContainer, code, detail.Photos);
        document.querySelector("#modal-cancel").addEventListener("click", closeModal);
        document.querySelector("#modal-save").addEventListener("click", function () {
          var status = document.querySelector("#modal-status");
          var fields = collectFields(modalContainer, false);
          api("updateSchool", { code: code, fields: fields }).then(function (data) {
            status.hidden = false;
            status.textContent = data.success ? "Saved." : (data.error || "Save failed.");
            status.style.color = data.success ? "" : "#c0392b";
            if (data.success) { loadAdminTable(); setTimeout(closeModal, 700); }
          });
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
