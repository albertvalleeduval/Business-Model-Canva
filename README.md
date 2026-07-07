# Business Model Canvas Creator

A free, easy-to-use Business Model Canvas web app. Fill in the 9 classic blocks (Strategyzer layout), or let AI generate the whole canvas from a business document, then export a clean A4 landscape PDF.

## Features

- **Manual creation**: intuitive editable canvas with the standard 9-block Strategyzer layout
- **AI generation**: upload a business document (.pdf, .txt, .docx) or paste text — Google Gemini fills all 9 sections
- **Auto-scaling text**: font size adjusts automatically so content always fits its block
- **Auto-save**: your work is persisted to localStorage as you type
- **Native PDF export**: print-to-PDF via a dedicated print stylesheet — vector-sharp text, exact A4 landscape format, no rasterization

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **(Optional) Enable AI generation in local dev:**
   - Copy `.env.example` to `.env`
   - Set `VITE_GEMINI_API_KEY=your_key` (get one at https://aistudio.google.com/app/apikey)
   - This dev-only fallback calls Gemini directly from the browser; it is stripped from production builds.

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment (Vercel)

The app is a static Vite build plus one serverless function (`api/generate.js`) that proxies Gemini calls so the API key never reaches the client.

1. Import the repo in Vercel (framework preset: Vite).
2. In *Project Settings → Environment Variables*, add `GEMINI_API_KEY` with your Google Gemini key.
3. Deploy. Without the env var, the app still works — only AI generation is disabled.

To test the serverless function locally, use `vercel dev` instead of `npm run dev`.

## Usage

### Manual creation
1. Click **Create Manually** on the landing page
2. Fill in each section — text scales automatically
3. Click **Download PDF**, then choose "Save as PDF" in the print dialog (A4 landscape is preset)

### AI generation
1. Click **Generate with AI**
2. Upload a file or paste a description of your business
3. The AI populates the canvas; edit as needed, then export

## Technology stack

- **React 19** + **Vite 7** — UI and build
- **Tailwind CSS v4** — styling
- **pdf.js** — text extraction from uploaded PDFs
- **mammoth** — DOCX parsing
- **Google Gemini** (`gemini-2.0-flash`) — canvas generation, proxied through a Vercel serverless function

## License

MIT
