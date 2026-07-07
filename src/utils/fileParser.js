import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Keep prompts small enough for the AI call
const MAX_PAGES = 15;
const MAX_CHARS = 10000;

// Extract text from PDF
export async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const pageCount = Math.min(pdf.numPages, MAX_PAGES);
        const pages = [];
        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pages.push(content.items.map((item) => item.str).join(' '));
        }

        const text = pages.join('\n').replace(/\s+/g, ' ').trim();
        if (!text) {
            throw new Error('No readable text found in this PDF (it may be a scanned document).');
        }
        return text.slice(0, MAX_CHARS);
    } catch (error) {
        if (error.message.includes('No readable text')) throw error;
        throw new Error('Failed to parse PDF file');
    }
}

// Extract text from DOCX
export async function extractDOCXText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.slice(0, MAX_CHARS);
    } catch {
        throw new Error('Failed to parse DOCX file');
    }
}

// Extract text from TXT
export async function extractTXTText(file) {
    try {
        const text = await file.text();
        return text.slice(0, MAX_CHARS);
    } catch {
        throw new Error('Failed to read file');
    }
}

// Main file parser
export async function parseFile(file) {
    const fileType = file.name.split('.').pop().toLowerCase();

    switch (fileType) {
        case 'pdf':
            return await extractPDFText(file);
        case 'docx':
            return await extractDOCXText(file);
        case 'txt':
            return await extractTXTText(file);
        default:
            throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
    }
}
