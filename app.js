/* ═══════════════════════════════════════════════════
   Business Model Canvas — Application Logic
   ═══════════════════════════════════════════════════ */

import { GEMINI_API_KEY } from './config.js';

// Global state for keys
let _keyIndex = 0;

/* ═══════════════════════════════════════════════════
   DOM ELEMENTS & INITIALIZATION
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const btnManual = document.getElementById('btn-manual');
  const btnAi = document.getElementById('btn-ai');
  const btnBack = document.getElementById('btn-back');
  const btnGenerate = document.getElementById('btn-generate');
  const btnNew = document.getElementById('btn-new-canvas');
  const btnExport = document.getElementById('export-btn'); // Renamed ID in HTML usually, checking target

  if (btnManual) btnManual.addEventListener('click', () => showScreen('canvas-screen'));
  if (btnAi) btnAi.addEventListener('click', () => showScreen('ai-upload-screen'));
  if (btnBack) btnBack.addEventListener('click', () => showScreen('landing-screen'));
  if (btnNew) btnNew.addEventListener('click', resetCanvas);

  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      const fileInput = document.getElementById('pdf-input');
      if (fileInput.files.length > 0) {
        startAiGeneration(fileInput.files[0]);
      }
    });
  }

  // Export PDF
  // Note: html2pdf is loaded via CDN in index.html for simplicity or we can import if installed.
  // The prompt asked to add html2pdf.js to package.json, so we should try to use it if manageable.
  // For now, assuming Global global html2pdf variable if script included, or import.
  // Let's stick to global or CDN for libs to avoid complex bundler setup issues if user just runs vite.
  // However, I will check if I can import it. html2pdf.js doesn't always play nice with imports.
  // I'll keep the CDN logic for libraries in index.html for safety unless forced, 
  // BUT the user put them in package.json. 
  // I will assume they are globally available or I should import them?
  // User said: "Dépendances : ... pdfjs-dist, html2pdf.js".
  // I will try to use the global window objects for now to ensure compatibility with the existing HTML 
  // unless I rewrite everything to imports. 
  // To be safe and strict about "Refactorise... avec rigueur", I will use imports if possible,
  // but `pdfjs-dist` worker setup in Vite is specific.
  // I will use standard window globals for libs to ensure it works "immediately".

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportPdf);

  // Dropzone
  setupDropzone();

  // Load Persistence
  loadFromStorage();
  // Auto-save logic is integrated in setupAutoResize

  // Auto-resize
  setupAutoResize();
});

/* ═══════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════ */
function showScreen(screenId) {
  document.getElementById('landing-screen').classList.add('screen-hidden');
  document.getElementById('ai-upload-screen').classList.add('screen-hidden');
  document.getElementById('canvas-screen').classList.add('screen-hidden');
  document.getElementById(screenId).classList.remove('screen-hidden');
}

/* ═══════════════════════════════════════════════════
   PDF EXTRACTION (pdf.js)
═══════════════════════════════════════════════════ */
async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();

  // Using global pdfjsLib from CDN for simplicity in this hybrid setup
  // If moving to strict Vite, we'd import. But let's rely on window.pdfjsLib for stability 
  // as requested "Stabilisation".
  if (!window.pdfjsLib) throw new Error("PDF.js library not loaded");

  const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 15); // limit 15 pages

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return cleanText(fullText);
}

/* ═══════════════════════════════════════════════════
   AI GENERATION ACTIONS
═══════════════════════════════════════════════════ */
async function startAiGeneration(file) {
  const btn = document.getElementById('btn-generate');
  const progress = document.getElementById('ai-progress');
  const barFill = document.getElementById('progress-bar-fill');
  const label = document.getElementById('progress-label');

  try {
    btn.disabled = true;
    progress.style.display = 'block';

    // Step 1: Extract
    updateProgress(10, 'Lecture du PDF...', barFill, label);
    const text = await extractTextFromPdf(file);

    if (!text || text.length < 50) {
      throw new Error("Le PDF ne contient pas assez de texte lisible.");
    }

    // Step 2: AI Call
    updateProgress(30, 'Initialisation de l\'IA...', barFill, label);
    const bmcData = await fetchWithRotation(text, (msg, pct) => {
      updateProgress(pct, msg, barFill, label);
    });

    // Step 3: Fill
    updateProgress(90, 'Génération du canvas...', barFill, label);
    fillCanvas(bmcData);

    // Done
    updateProgress(100, 'Terminé !', barFill, label);
    setTimeout(() => {
      showScreen('canvas-screen');
      progress.style.display = 'none';
      btn.disabled = false;
    }, 800);

  } catch (err) {
    console.error(err);
    alert('Erreur : ' + err.message);
    btn.disabled = false;
    progress.style.display = 'none';
  }
}

function updateProgress(pct, msg, bar, label) {
  bar.style.width = pct + '%';
  label.textContent = msg;
}

/* ═══════════════════════════════════════════════════
   GEMINI API (DIRECT)
═══════════════════════════════════════════════════ */
// import { GEMINI_API_KEY } from './config.js'; // REMOVED DUPLICATE

const SYSTEM_PROMPT = `Tu es un expert en stratégie d'entreprise.
Remplis le Business Model Canvas (Osterwalder) à partir du texte fourni.
IMPORTANT : Ne JAMAIS utiliser d'emojis, de puces (•) ou de symboles spéciaux. Formate tes réponses uniquement avec du texte brut et des retours à la ligne.
Réponds UNIQUEMENT via un JSON valide (sans markdown, sans entête).
Clés requises : key_partnerships, key_activities, key_resources, value_propositions, customer_relationships, channels, customer_segments, cost_structure, revenue_streams.`;

async function fetchWithRotation(text, progressCallback) {
  if (!GEMINI_API_KEY) throw new Error("Clé API Gemini manquante dans config.js");

  progressCallback('Analyse avec Gemini 2.0 Flash...', 50);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [{ text: SYSTEM_PROMPT + "\n\n--- TEXTE À ANALYSER ---\n\n" + text }]
    }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Gemini API Error ${res.status}: ${errTxt}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error("Réponse vide de Gemini");

    return parseJsonSafe(content);

  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
}

function parseJsonSafe(content) {
  try {
    // Remove Markdown code blocks if present
    const clean = content.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(clean);
  } catch (e) {
    // Try finding JSON block using regex if parse failed
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Format JSON invalide reçu de l'IA");
  }
}

function cleanText(text) {
  // Remove non-UTF8/non-printable chars
  let cleaned = text.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, '');
  // Limit to 10,000 chars as requested
  return cleaned.substring(0, 10000);
}

/* ═══════════════════════════════════════════════════
   CANVAS & UTILS
═══════════════════════════════════════════════════ */
const BMC_MAP = {
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

function fillCanvas(data) {
  for (const [key, id] of Object.entries(BMC_MAP)) {
    if (data[key]) {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = formatList(data[key]);
        // Auto-scale immediately after filling
        autoResize(el);
      }
    }
  }
  saveToStorage();

  // Refresh icons and UI if needed
  if (window.lucide) window.lucide.createIcons();
}

function formatList(txt) {
  // Handle arrays (common with some AI models)
  if (Array.isArray(txt)) {
    return txt.map(item => `&bull; ${item}`).join('<br>');
  }
  // Handle non-string types safely
  if (typeof txt !== 'string') {
    return String(txt || '');
  }
  // Convert bullet points to HTML if needed, or just clean up
  return txt.replace(/\n/g, '<br>').replace(/•/g, '&bull;');
}

// ... (Storage and Auto-resize logic remains similar to previous, optimized)

function setupAutoResize() {
  document.querySelectorAll('.editable, .header-field').forEach(div => {
    div.addEventListener('input', () => {
      autoResize(div);
      saveToStorage(); // Auto-save on input
    });
    // Init
    autoResize(div);
  });
}

function autoResize(el) {
  // Simple logic: reduce font size if overflow
  let size = 18;
  el.style.fontSize = size + 'px';
  while (el.scrollHeight > el.clientHeight && size > 10) {
    size--;
    el.style.fontSize = size + 'px';
  }
}

/* ═══════════════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════════════ */
function saveToStorage() {
  const data = {};
  document.querySelectorAll('.editable, .header-field').forEach(el => {
    data[el.id] = el.innerHTML;
  });
  localStorage.setItem('astry-bmc-data', JSON.stringify(data));
}

function loadFromStorage() {
  const saved = localStorage.getItem('astry-bmc-data');
  if (saved) {
    const data = JSON.parse(saved);
    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = data[id];
        autoResize(el);
      }
    });
    // Go to canvas if data exists
    showScreen('canvas-screen');
  }
}

function resetCanvas() {
  if (!confirm("Effacer tout le canvas ?")) return;
  document.querySelectorAll('.editable, .header-field').forEach(el => el.innerHTML = '');
  localStorage.removeItem('astry-bmc-data');
  location.reload();
}

/* ═══════════════════════════════════════════════════
   DROPZONE
═══════════════════════════════════════════════════ */
function setupDropzone() {
  const zone = document.getElementById('dropzone');
  const input = document.getElementById('pdf-input');
  const info = document.getElementById('file-info');
  const btn = document.getElementById('btn-generate');

  zone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => handleFile(input.files[0]));

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#6366f1';
  });

  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '#e5e7eb';
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#e5e7eb';
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (file && file.type === 'application/pdf') {
      info.textContent = `Fichier sélectionné : ${file.name}`;
      info.style.display = 'block';
      btn.disabled = false;

      // Update FileList for input if dropped
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    } else {
      alert("Format PDF uniquement");
    }
  }
}

function exportPdf() {
  const element = document.getElementById('bmc-root');
  const btn = document.getElementById('export-btn');
  const spinner = btn.querySelector('.spinner');

  spinner.style.display = 'inline-block';

  const opt = {
    margin: 0,
    filename: 'business-model-canvas.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  // Hide toolbar for export
  document.querySelector('.canvas-toolbar').style.display = 'none';

  // Use global html2pdf
  window.html2pdf().from(element).set(opt).save().then(() => {
    spinner.style.display = 'none';
    document.querySelector('.canvas-toolbar').style.display = 'flex';
  });
}
