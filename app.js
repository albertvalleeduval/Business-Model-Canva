/* ═══════════════════════════════════════════════════
   Business Model Canvas — Application Logic
   ═══════════════════════════════════════════════════ */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

  if (btnManual) btnManual.addEventListener('click', () => showScreen('canvas-screen'));
  if (btnAi) btnAi.addEventListener('click', () => showScreen('ai-upload-screen'));
  if (btnBack) btnBack.addEventListener('click', () => showScreen('landing-screen'));
  if (btnNew) btnNew.addEventListener('click', resetCanvas);

  const btnTest = document.getElementById('btn-test-data');
  if (btnTest) btnTest.addEventListener('click', fillWithTestData);

  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      const fileInput = document.getElementById('pdf-input');
      if (fileInput.files.length > 0) {
        startAiGeneration(fileInput.files[0]);
      }
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportPdf);

  // Dropzone
  setupDropzone();

  // Load Persistence
  loadFromStorage();
  // Auto-save logic is integrated in setupAutoResize

  // Auto-resize
  setupAutoResize();

  // Handle Back Button (User Request)
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screenId) {
      showScreen(event.state.screenId, false);
    } else {
      showScreen('landing-screen', false);
    }
  });
});

/* ═══════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════ */
function showScreen(screenId, addToHistory = true) {
  document.getElementById('landing-screen').classList.add('screen-hidden');
  document.getElementById('ai-upload-screen').classList.add('screen-hidden');
  document.getElementById('canvas-screen').classList.add('screen-hidden');
  document.getElementById(screenId).classList.remove('screen-hidden');

  if (addToHistory) {
    history.pushState({ screenId }, '', '#' + screenId);
  }

  // Ensure icons are always visible after navigation
  if (window.lucide) window.lucide.createIcons();
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
const SYSTEM_PROMPT = `Tu es un expert en stratégie d'entreprise.
Remplis le Business Model Canvas (Osterwalder) à partir du texte fourni.
IMPORTANT : Réponds exclusivement en JSON. N'utilise JAMAIS d'emojis, de puces ou de symboles spéciaux (◆, •). Utilise uniquement des retours à la ligne pour lister les points.
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

  // Auto-scale with delay (User Request)
  setTimeout(autoScaleAllBoxes, 100);
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

function autoScaleAllBoxes() {
  document.querySelectorAll('.editable, .header-field').forEach(el => autoResize(el));
}

function autoResize(el) {
  // Simple logic: reduce font size if overflow
  let size = 18;
  el.style.fontSize = size + 'px';
  // Allow down to 9px as requested
  while (el.scrollHeight > el.clientHeight && size > 9) {
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
  document.querySelectorAll('.editable, .header-field').forEach(el => {
    el.innerHTML = '';
    autoResize(el);
  });
  localStorage.removeItem('astry-bmc-data');
  showScreen('landing-screen');
}

/* ═══════════════════════════════════════════════════
   TEST DATA MODAL (SIMULATION)
═══════════════════════════════════════════════════ */
function fillWithTestData() {
  const dummyData = {
    key_partnerships: "• Fournisseurs locaux (matières premières)<br>• Influenceurs fitness<br>• Google Cloud Platform (hébergement)<br>• Stripe (paiements)",
    key_activities: "• Développement de l'application<br>• Création de contenu marketing<br>• Support client 24/7<br>• Maintenance des serveurs",
    key_resources: "• Équipe de développeurs<br>• Base de données utilisateurs<br>• Algorithme de recommandation<br>• Marque déposée",
    value_propositions: "• Coaching personnalisé par IA<br>• suivi en temps réel des performances<br>• communauté active et motivante<br>• prix abordable par rapport au coaching physique",
    customer_relationships: "• Assistance automatisée (chatbot)<br>• Newsletters personnalisées<br>• Programmes de fidélité<br>• Webinaires communautaires",
    channels: "• App Store & Google Play<br>• Site web vitrine<br>• Publicités réseaux sociaux (Instagram, TikTok)<br>• Partenariats salles de sport",
    customer_segments: "• Jeunes actifs urbains (25-35 ans)<br>• Débutants en fitness<br>• Personnes cherchant une alternative à la salle<br>• Passionnés de technologie",
    cost_structure: "• Salaires (Dév, Marketing)<br>• Coûts serveurs & API<br>• Budget publicitaire<br>• Frais juridiques",
    revenue_streams: "• Abonnement Freemium (9.99€/mois)<br>• Achats in-app (programmes spécifiques)<br>• Commissions sur produits partenaires<br>• Publicité ciblée (version gratuite)"
  };

  showScreen('canvas-screen');
  fillCanvas(dummyData);
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
  const btn = document.getElementById('export-btn');
  const spinner = btn.querySelector('.spinner');
  spinner.style.display = 'inline-block';

  // Ensure icons are rendered
  if (window.lucide) window.lucide.createIcons();

  // 1. Clone the BMC
  const original = document.getElementById('bmc-root');
  const clone = original.cloneNode(true);

  // 2. Force clone to exact A4 Landscape dimensions
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '297mm',
    height: '210mm',
    padding: '10mm',
    background: 'white',
    zIndex: '99999',
    overflow: 'hidden'
  });

  // Force the grid inside the clone
  const grid = clone.querySelector('#canvas-grid');
  if (grid) {
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
      gap: '0.5rem',
      height: '100%'
    });
  }

  // Hide toolbar inside the clone
  const toolbar = clone.querySelector('.canvas-toolbar');
  if (toolbar) toolbar.style.display = 'none';

  // 3. Add clone to DOM (temporarily)
  document.body.appendChild(clone);

  // 4. Simple html2pdf config (clone is already at the right size)
  const opt = {
    margin: 0,
    filename: 'Mon_Business_Model.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  // 5. Generate and clean up
  window.html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(clone);
    spinner.style.display = 'none';
  });
}
