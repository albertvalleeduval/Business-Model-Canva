# Business Model Canvas — Interactive Web App

An interactive, editable **Business Model Canvas** built with vanilla HTML, CSS, and JavaScript. Designed for fast iteration and easy deployment.

![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---|---|
| **9‑block BMC grid** | Standard Strategyzer layout reproduced with CSS Grid |
| **Inline editing** | Every block is `contenteditable` — just click and type |
| **Auto‑scaling text** | Font size adjusts automatically (12–18 px) to prevent overflow |
| **Persistent data** | Content saved to `localStorage` on every keystroke |
| **PDF export** | One‑click A4 landscape export via [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) |
| **Responsive** | Stacks to single‑column on mobile devices |

---

## 🗂 Project Structure

```
BMC/
├── index.html      ← Main page (imports CSS & JS)
├── style.css       ← Layout, cards, responsive rules
├── app.js          ← Auto‑scale, localStorage, PDF export
├── README.md       ← This file
└── .gitignore
```

---

## 🚀 Getting Started

### Local preview

Simply open `index.html` in any modern browser — no build step needed.

### Deploy on Vercel

1. Push this repository to GitHub.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Vercel auto‑detects a static site — no configuration required.
4. Your canvas is live! 🎉

> **All asset paths are relative** (`./style.css`, `./app.js`), so the project works out of the box on any static hosting platform.

---

## 🛠 Tech Stack

- **HTML5** — Semantic markup
- **Tailwind CSS** (CDN) — Utility classes
- **Vanilla CSS** — Grid layout & custom styling
- **Vanilla JavaScript** — Zero dependencies for core logic
- **html2pdf.js** (CDN) — PDF generation
- **Google Fonts** — Inter typeface

---

## 📄 License

MIT — free to use, modify, and distribute.
