# Business Model Canvas — AI-Powered Edition

An interactive, **AI-powered** Business Model Canvas tool built for **Astry Agency**.  
Upload a PDF describing your project and let AI fill the 9 blocks for you, or use manual mode.

![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Landing page** | Choose between Manual mode or AI-powered generation |
| **AI generation** | Upload a PDF → text is extracted → OpenRouter API fills the 9 blocks |
| **PDF extraction** | Uses pdf.js — supports up to 15 pages |
| **9-block BMC grid** | Standard Strategyzer layout via CSS Grid |
| **Inline editing** | Every block is `contenteditable` |
| **Auto-scaling** | Font size auto-adjusts (10–18 px) to prevent overflow |
| **Persistent data** | localStorage saves on every keystroke |
| **PDF export** | A4 landscape via html2pdf.js |
| **Responsive** | Stacks to single-column on mobile |

---

## 🗂 Project Structure

```
BMC/
├── index.html      ← 3-screen layout (Landing → AI Upload → Canvas)
├── style.css       ← All styles (landing, upload, canvas, responsive)
├── app.js          ← Full application logic
├── config.js       ← API key (⚠️ excluded from git)
├── .gitignore
└── README.md
```

---

## 🔑 Configuration

1. Create a `config.js` file at the project root (it's git-ignored):

```js
var CONFIG_OPENROUTER_KEY = 'sk-or-v1-your-key-here';
```

2. Get your free API key from [openrouter.ai](https://openrouter.ai/).

---

## 🚀 Getting Started

### Local preview

Open `index.html` in any modern browser — no build step needed.

### Deploy on Vercel

1. Push this repo to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new).
3. **Important**: Add `config.js` manually to your deployed instance or use environment headers.

---

## 🛠 Tech Stack

- **HTML5** + **Tailwind CSS** (CDN)
- **Vanilla JavaScript**
- **pdf.js** (CDN) — PDF text extraction
- **html2pdf.js** (CDN) — PDF export
- **OpenRouter API** — LLM inference (Llama 3 70B)
- **Google Fonts** — Inter

---

## 📄 License

MIT — free to use, modify, and distribute.
