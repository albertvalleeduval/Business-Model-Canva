import mammoth from 'mammoth';

// Extract text from PDF
export async function extractPDFText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // For PDF, we'll use a simple text extraction
                // Note: pdf-parse doesn't work in browser, so we'll use a simpler approach
                const text = await file.text();
                resolve(text);
            } catch (error) {
                reject(new Error('Failed to parse PDF file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Extract text from DOCX
export async function extractDOCXText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                resolve(result.value);
            } catch (error) {
                reject(new Error('Failed to parse DOCX file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Extract text from TXT
export async function extractTXTText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
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
