/* ═══════════════════════════════════════════════════
   Business Model Canvas — AI-Powered Application
   Astry Agency
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────── */
  var STORAGE_KEY = 'bmc-canvas-data';
  var MAX_FONT = 18;
  var MIN_FONT = 10;
  var STEP = 0.5;
  var MAX_PAGES = 15;

  var BMC_KEYS = [
    'key_partnerships',
    'key_activities',
    'key_resources',
    'value_propositions',
    'customer_relationships',
    'channels',
    'customer_segments',
    'cost_structure',
    'revenue_streams'
  ];

  var BMC_ID_MAP = {
    key_partnerships: 'block-kp',
    key_activities: 'block-ka',
    key_resources: 'block-kr',
    value_propositions: 'block-vp',
    customer_relationships: 'block-cr',
    channels: 'block-ch',
    customer_segments: 'block-cs',
    cost_structure: 'block-cost',
    revenue_streams: 'block-rev'
  };

  /* ═══════════════════════════════════════════════════
     SCREEN NAVIGATION
  ═══════════════════════════════════════════════════ */
  var landingScreen = document.getElementById('landing-screen');
  var aiScreen = document.getElementById('ai-upload-screen');
  var canvasScreen = document.getElementById('canvas-screen');

  function showScreen(screen) {
    [landingScreen, aiScreen, canvasScreen].forEach(function (s) {
      if (s) s.classList.add('screen-hidden');
    });
    if (screen) screen.classList.remove('screen-hidden');
  }

  /* ── Landing buttons ──────────────────────────── */
  var btnManual = document.getElementById('btn-manual');
  var btnAI = document.getElementById('btn-ai');

  if (btnManual) {
    btnManual.addEventListener('click', function () {
      showScreen(canvasScreen);
      initCanvas();
    });
  }

  if (btnAI) {
    btnAI.addEventListener('click', function () {
      showScreen(aiScreen);
    });
  }

  /* ── Back button from AI screen ────────────────── */
  var btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', function () {
      resetUpload();
      showScreen(landingScreen);
    });
  }

  /* ── New Canvas button (back from canvas) ──────── */
  var btnNewCanvas = document.getElementById('btn-new-canvas');
  if (btnNewCanvas) {
    btnNewCanvas.addEventListener('click', function () {
      if (confirm('Créer un nouveau canvas ? Les données non exportées seront perdues.')) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
        clearAllBlocks();
        showScreen(landingScreen);
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     PDF DROPZONE — File Upload
  ═══════════════════════════════════════════════════ */
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('pdf-input');
  var fileInfoEl = document.getElementById('file-info');
  var btnGenerate = document.getElementById('btn-generate');
  var progressWrap = document.getElementById('ai-progress');
  var progressBar = document.getElementById('progress-bar-fill');
  var progressLabel = document.getElementById('progress-label');

  var selectedFile = null;

  if (dropzone) {
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });
  }

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      showFileInfo('Fichier invalide. Veuillez sélectionner un PDF.', true);
      selectedFile = null;
      if (btnGenerate) btnGenerate.disabled = true;
      return;
    }
    selectedFile = file;
    showFileInfo('📄 ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' Ko)', false);
    if (btnGenerate) btnGenerate.disabled = false;
  }

  function showFileInfo(text, isError) {
    if (!fileInfoEl) return;
    fileInfoEl.textContent = text;
    fileInfoEl.style.display = 'flex';
    fileInfoEl.classList.toggle('error', isError);
  }

  function resetUpload() {
    selectedFile = null;
    if (fileInfoEl) { fileInfoEl.style.display = 'none'; fileInfoEl.classList.remove('error'); }
    if (fileInput) fileInput.value = '';
    if (btnGenerate) btnGenerate.disabled = true;
    setProgress(0, '');
    if (progressWrap) progressWrap.style.display = 'none';
  }

  function setProgress(pct, label) {
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = label;
    if (progressWrap) progressWrap.style.display = label ? 'block' : 'none';
  }

  /* ── Generate button ──────────────────────────── */
  if (btnGenerate) {
    btnGenerate.addEventListener('click', function () {
      if (!selectedFile) return;
      runAIPipeline(selectedFile);
    });
  }

  /* ═══════════════════════════════════════════════════
     AI PIPELINE: PDF → Text → OpenRouter → Fill BMC
  ═══════════════════════════════════════════════════ */
  function runAIPipeline(file) {
    if (btnGenerate) btnGenerate.disabled = true;
    if (btnBack) btnBack.disabled = true;
    setProgress(10, 'Lecture du PDF…');

    extractPDFText(file)
      .then(function (text) {
        setProgress(40, 'Texte extrait. Envoi à l\'IA…');
        return callOpenRouter(text);
      })
      .then(function (bmcData) {
        setProgress(90, 'Résultats reçus. Remplissage…');
        fillCanvas(bmcData);
        setProgress(100, 'Terminé ✓');
        setTimeout(function () {
          showScreen(canvasScreen);
          initCanvas();
          resetUpload();
        }, 600);
      })
      .catch(function (err) {
        showFileInfo(err.message || 'Erreur lors de la génération.', true);
        setProgress(0, '');
      })
      .finally(function () {
        if (btnGenerate) btnGenerate.disabled = false;
        if (btnBack) btnBack.disabled = false;
      });
  }

  /* ═══════════════════════════════════════════════════
     PDF TEXT EXTRACTION (pdf.js)
  ═══════════════════════════════════════════════════ */
  function extractPDFText(file) {
    return new Promise(function (resolve, reject) {
      if (typeof pdfjsLib === 'undefined') {
        return reject(new Error('La bibliothèque PDF.js n\'est pas chargée.'));
      }

      var reader = new FileReader();
      reader.onload = function () {
        var typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument({ data: typedarray }).promise.then(function (pdf) {
          if (pdf.numPages > MAX_PAGES) {
            return reject(new Error('Le document dépasse ' + MAX_PAGES + ' pages (' + pdf.numPages + ' détectées). Veuillez réduire sa taille.'));
          }

          var pages = [];
          for (var i = 1; i <= pdf.numPages; i++) {
            pages.push(
              pdf.getPage(i).then(function (page) {
                return page.getTextContent();
              }).then(function (content) {
                return content.items.map(function (item) { return item.str; }).join(' ');
              })
            );
          }

          Promise.all(pages).then(function (texts) {
            var fullText = texts.join('\n\n').trim();
            if (!fullText) return reject(new Error('Aucun texte extractible trouvé dans le PDF.'));
            resolve(fullText);
          }).catch(reject);
        }).catch(function () {
          reject(new Error('Impossible de lire ce fichier PDF.'));
        });
      };

      reader.onerror = function () {
        reject(new Error('Erreur de lecture du fichier.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /* ═══════════════════════════════════════════════════
     KEY ROTATION & API CALL (async/await)
  ═══════════════════════════════════════════════════ */
  var _keyIndex = 0; // persists across calls within session

  function getKeys() {
    if (typeof API_KEYS !== 'undefined' && Array.isArray(API_KEYS) && API_KEYS.length > 0) {
      return API_KEYS.filter(function (k) { return k && !k.includes('YOUR_'); });
    }
    // Legacy single-key fallback
    if (typeof CONFIG_OPENROUTER_KEY !== 'undefined' && CONFIG_OPENROUTER_KEY !== 'YOUR_OPENROUTER_API_KEY_HERE') {
      return [CONFIG_OPENROUTER_KEY];
    }
    return [];
  }

  function showToast(message) {
    var existing = document.getElementById('rotation-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'rotation-toast';
    toast.textContent = message;
    toast.style.cssText =
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:#1F2937;color:#fff;padding:10px 20px;border-radius:8px;' +
      'font-size:13px;font-family:Inter,system-ui,sans-serif;z-index:9999;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.15);opacity:0;transition:opacity .3s;';
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 350);
    }, 3000);
  }

  var SYSTEM_PROMPT = 'Tu es un expert en stratégie d\'entreprise et en Business Model Canvas (Osterwalder). ' +
    'À partir du texte fourni, remplis les 9 cases du Business Model Canvas. ' +
    'Réponds UNIQUEMENT avec un objet JSON valide contenant les clés suivantes : ' +
    'key_partnerships, key_activities, key_resources, value_propositions, ' +
    'customer_relationships, channels, customer_segments, cost_structure, revenue_streams. ' +
    'Chaque valeur doit être une chaîne de texte concise avec des bullet points (utilise "• " pour chaque item). ' +
    'Ne retourne RIEN d\'autre que le JSON.';

  async function fetchWithRotation(text) {
    var keys = getKeys();
    if (keys.length === 0) {
      throw new Error('Aucune clé API configurée. Ajoutez vos clés dans config.js.');
    }

    // Default models if config is missing
    var models = (typeof MODELS !== 'undefined' && Array.isArray(MODELS) && MODELS.length > 0)
      ? MODELS
      : ['mistralai/mistral-small-3.1-24b-instruct:free'];

    var truncated = text.substring(0, 12000);
    var startIndex = _keyIndex % keys.length;
    var maxAttempts = keys.length * models.length; // Try all combinations if needed (limited generally by common sense, but let's be robust)
    // To avoid infinite loops if we have many keys/models, let's cap at 5 retries max for UX
    var hardLimit = 5;
    var tried = 0;

    while (tried < hardLimit) {
      // Rotation logic:
      // Change Key every step
      var keyIdx = (startIndex + tried) % keys.length;
      var key = keys[keyIdx];

      // Change Model every step too (or every N steps)
      // Let's rotate models simply: tried % models.length
      var modelIdx = tried % models.length;
      var model = models[modelIdx];

      if (tried > 0) {
        showToast('Optimisation... (Clé ' + (keyIdx + 1) + ' • ' + model.split('/')[1].split(':')[0] + ')');
        setProgress(45, 'Tentative ' + (tried + 1) + '/' + hardLimit + ' avec un autre modèle IA...');
        await new Promise(function (r) { setTimeout(r, 1000 + (tried * 1000)); }); // Progressive delay
      }

      try {
        var res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: 'Voici le texte du document :\n\n' + truncated }
            ],
            temperature: 0.3,
            max_tokens: 2048
          })
        });

        if (res.status === 429 || res.status === 503 || res.status === 404 || res.status === 402) {
          console.warn('Erreur ' + res.status + ' sur le modèle ' + model + ', passage au suivant.');
          tried++;
          continue;
        }

        if (!res.ok) {
          throw new Error('Erreur API OpenRouter (HTTP ' + res.status + ')');
        }

        // Success — remember this key for next call
        _keyIndex = keyIdx;

        var data = await res.json();
        var raw = data.choices[0].message.content;
        var jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('L\'IA n\'a pas renvoyé de JSON valide.');
        return JSON.parse(jsonMatch[0]);

      } catch (err) {
        // Network errors: try next
        if (err.message && (err.message.includes('429') || err.message.includes('503'))) {
          tried++;
          continue;
        }
        // For non-retryable errors, stop
        if (err.message && err.message.includes('HTTP')) throw err;
        if (err instanceof SyntaxError) throw new Error('Impossible de parser la réponse de l\'IA.');
        tried++;
      }
    }

    throw new Error('Capacité IA saturée sur tous les modèles. Réessayez dans 1 minute.');
  }

  function callOpenRouter(text) {
    return fetchWithRotation(text);
  }

  /* ═══════════════════════════════════════════════════
     FILL CANVAS WITH AI DATA
  ═══════════════════════════════════════════════════ */
  function fillCanvas(bmcData) {
    BMC_KEYS.forEach(function (key) {
      var elId = BMC_ID_MAP[key];
      var el = document.getElementById(elId);
      if (el && bmcData[key]) {
        el.innerHTML = bmcData[key].replace(/\n/g, '<br>');
      }
    });
    saveAll();
  }

  function clearAllBlocks() {
    BMC_KEYS.forEach(function (key) {
      var el = document.getElementById(BMC_ID_MAP[key]);
      if (el) el.innerHTML = '';
    });
    ['hdr-designed-for', 'hdr-designed-by', 'hdr-date', 'hdr-version'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
  }

  /* ═══════════════════════════════════════════════════
     AUTO-SCALE (10–18 px)
  ═══════════════════════════════════════════════════ */
  function autoScale(el) {
    el.style.fontSize = MAX_FONT + 'px';
    var maxIter = (MAX_FONT - MIN_FONT) / STEP + 1;
    var i = 0;
    while (el.scrollHeight > el.clientHeight && parseFloat(el.style.fontSize) > MIN_FONT && i < maxIter) {
      el.style.fontSize = (parseFloat(el.style.fontSize) - STEP) + 'px';
      i++;
    }
  }

  /* ═══════════════════════════════════════════════════
     LOCAL STORAGE
  ═══════════════════════════════════════════════════ */
  function saveAll() {
    var editables = document.querySelectorAll('.editable, .header-field');
    var data = {};
    editables.forEach(function (el) {
      if (el.id) data[el.id] = el.innerHTML;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) { }
  }

  function restoreAll() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (_) { return; }

    var editables = document.querySelectorAll('.editable, .header-field');
    editables.forEach(function (el) {
      if (el.id && data[el.id] !== undefined) el.innerHTML = data[el.id];
    });
  }

  /* ═══════════════════════════════════════════════════
     PDF EXPORT
  ═══════════════════════════════════════════════════ */
  function exportPDF() {
    var root = document.getElementById('bmc-root');
    if (!root || typeof html2pdf === 'undefined') return;

    var btn = document.getElementById('export-btn');
    var label = btn ? btn.querySelector('.btn-label') : null;
    var spin = btn ? btn.querySelector('.btn-spinner') : null;

    if (btn) btn.disabled = true;
    if (label) label.style.display = 'none';
    if (spin) spin.style.display = 'inline-block';
    root.classList.add('exporting');

    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: 'Business_Model_Canvas.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      })
      .from(root)
      .save()
      .then(function () {
        root.classList.remove('exporting');
        if (btn) btn.disabled = false;
        if (label) label.style.display = '';
        if (spin) spin.style.display = 'none';
      })
      .catch(function () {
        root.classList.remove('exporting');
        if (btn) btn.disabled = false;
        if (label) label.style.display = '';
        if (spin) spin.style.display = 'none';
      });
  }

  /* ═══════════════════════════════════════════════════
     CANVAS INITIALISATION
  ═══════════════════════════════════════════════════ */
  var canvasInitialised = false;

  function initCanvas() {
    if (canvasInitialised) return;
    canvasInitialised = true;

    restoreAll();

    var editables = document.querySelectorAll('.editable, .header-field');
    editables.forEach(function (el) {
      el.addEventListener('input', function () {
        if (el.classList.contains('editable')) autoScale(el);
        saveAll();
      });
    });

    document.querySelectorAll('.editable').forEach(autoScale);

    var exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);
  }

  /* ═══════════════════════════════════════════════════
     BOOT — Check if there's saved data → go to canvas
  ═══════════════════════════════════════════════════ */
  (function boot() {
    var hasSavedData = false;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        var vals = Object.values(data);
        hasSavedData = vals.some(function (v) { return v && v.trim && v.trim().length > 0; });
      }
    } catch (_) { }

    if (hasSavedData) {
      showScreen(canvasScreen);
      initCanvas();
    } else {
      showScreen(landingScreen);
    }
  })();

})();
