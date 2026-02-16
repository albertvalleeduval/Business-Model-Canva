/* ═══════════════════════════════════════════════════
   Business Model Canvas — Application Logic
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────── */
  var STORAGE_KEY = 'bmc-canvas-data';
  var MAX_FONT   = 18;   // px — starting / max size
  var MIN_FONT   = 12;   // px — smallest allowed
  var STEP       = 0.5;  // px decrement per iteration

  /* ── DOM References ────────────────────────────── */
  var root       = document.getElementById('bmc-root');
  var editables  = document.querySelectorAll('.editable, .header-field');
  var exportBtn  = document.getElementById('export-btn');
  var btnLabel   = exportBtn ? exportBtn.querySelector('.btn-label') : null;
  var btnSpinner = exportBtn ? exportBtn.querySelector('.btn-spinner') : null;

  /* ═══════════════════════════════════════════════════
     AUTO-SCALE
     Shrinks font-size progressively when content
     overflows the container vertically.
  ═══════════════════════════════════════════════════ */
  function autoScale(el) {
    el.style.fontSize = MAX_FONT + 'px';

    var iterations = 0;
    var maxIterations = (MAX_FONT - MIN_FONT) / STEP + 1;

    while (
      el.scrollHeight > el.clientHeight &&
      parseFloat(el.style.fontSize) > MIN_FONT &&
      iterations < maxIterations
    ) {
      el.style.fontSize = (parseFloat(el.style.fontSize) - STEP) + 'px';
      iterations++;
    }
  }

  /* ═══════════════════════════════════════════════════
     LOCAL STORAGE — Persistence
  ═══════════════════════════════════════════════════ */
  function saveAll() {
    var data = {};
    editables.forEach(function (el) {
      if (el.id) data[el.id] = el.innerHTML;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {
      /* Storage full or unavailable — fail silently */
    }
  }

  function restoreAll() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return;
    }
    if (!raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return;
    }

    editables.forEach(function (el) {
      if (el.id && data[el.id] !== undefined) {
        el.innerHTML = data[el.id];
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     PDF EXPORT
  ═══════════════════════════════════════════════════ */
  function setExporting(isExporting) {
    if (!exportBtn) return;
    exportBtn.disabled = isExporting;
    if (btnLabel)   btnLabel.style.display   = isExporting ? 'none' : '';
    if (btnSpinner) btnSpinner.style.display = isExporting ? 'inline-block' : 'none';
  }

  function exportPDF() {
    if (!root) return;
    if (typeof html2pdf === 'undefined') return;

    setExporting(true);
    root.classList.add('exporting');

    var options = {
      margin:      [5, 5, 5, 5],
      filename:    'Business_Model_Canvas.pdf',
      image:       { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };

    html2pdf()
      .set(options)
      .from(root)
      .save()
      .then(function () {
        root.classList.remove('exporting');
        setExporting(false);
      })
      .catch(function () {
        root.classList.remove('exporting');
        setExporting(false);
      });
  }

  /* ═══════════════════════════════════════════════════
     EVENT BINDING
  ═══════════════════════════════════════════════════ */
  editables.forEach(function (el) {
    el.addEventListener('input', function () {
      if (el.classList.contains('editable')) autoScale(el);
      saveAll();
    });
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', exportPDF);
  }

  /* ── Initialise ────────────────────────────────── */
  restoreAll();

  document.querySelectorAll('.editable').forEach(function (el) {
    autoScale(el);
  });
})();
