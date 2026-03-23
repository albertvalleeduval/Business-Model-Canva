# Business Model Canvas Creator

A professional, high-end Business Model Canvas generator built with React, Tailwind CSS, and AI integration.

## Features

- **Manual Creation**: Create your canvas from scratch with an intuitive, professional interface
- **AI Generation**: Upload business documents (.pdf, .txt, .docx) or paste text to auto-generate your canvas using Google Gemini AI
- **Auto-scaling Text**: Intelligent font sizing that automatically adjusts to fit content within each block
- **Auto-save**: Your work is automatically saved to localStorage
- **High-Quality PDF Export**: Export your canvas as a high-resolution A4 landscape PDF

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Gemini API (Optional - only needed for AI generation):**
   - Copy `.env.example` to `.env`
   - Add your Google Gemini API key:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

### Manual Creation
1. Click "Create Manually" on the landing page
2. Fill in each section of the canvas
3. Text will automatically scale to fit
4. Click "Download PDF" to export your canvas

### AI Generation
1. Click "Generate with AI"
2. Choose to upload a file or paste text
3. Provide your business description or document
4. The AI will analyze and populate the canvas
5. Edit as needed and export

## Technology Stack

- **React** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **html2pdf.js** - PDF export
- **Google Gemini AI** - AI-powered canvas generation
- **Mammoth** - DOCX file parsing

## License

MIT
