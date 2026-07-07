import { jsPDF } from 'jspdf';
import {
    PAGE_W,
    MARGIN,
    BLOCK_PAD,
    TITLE_TO_BODY,
    LINE_HEIGHT,
    PT_TO_MM,
    MAX_FONT,
    MIN_FONT,
    SLATE_300,
    SLATE_600,
    SLATE_800,
    SLATE_50,
    layoutBlocks,
} from './exportLayout';

// Programmatic A4 landscape export: the 9-block Strategyzer layout is drawn
// directly into the PDF (vector text, exact geometry), so clicking Export
// downloads a file immediately — no print dialog, no DOM rasterization.

// Shrink the font until the wrapped text fits the available box
function fitText(doc, text, maxWidth, maxHeight) {
    for (let size = MAX_FONT; size >= MIN_FONT; size -= 0.5) {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, maxWidth);
        if (lines.length * size * PT_TO_MM * LINE_HEIGHT <= maxHeight) {
            return { size, lines };
        }
    }
    doc.setFontSize(MIN_FONT);
    return { size: MIN_FONT, lines: doc.splitTextToSize(text, maxWidth) };
}

function drawBlock(doc, { x, y, w, h, title, text, highlight }) {
    doc.setDrawColor(...SLATE_300);
    doc.setLineWidth(0.2);
    if (highlight) {
        doc.setFillColor(...SLATE_50);
        doc.rect(x, y, w, h, 'FD');
    } else {
        doc.rect(x, y, w, h);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_600);
    doc.text(title.toUpperCase(), x + BLOCK_PAD, y + BLOCK_PAD + 2.5, { charSpace: 0.15 });

    if (!text.trim()) return;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_800);
    const bodyY = y + BLOCK_PAD + TITLE_TO_BODY;
    const { size, lines } = fitText(
        doc,
        text,
        w - 2 * BLOCK_PAD,
        h - (bodyY - y) - BLOCK_PAD
    );
    doc.text(lines, x + BLOCK_PAD, bodyY + size * PT_TO_MM, {
        lineHeightFactor: LINE_HEIGHT,
    });
}

export function exportToPDF(data) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...SLATE_800);
    doc.text('Business Model Canvas', PAGE_W / 2, MARGIN + 7, { align: 'center' });

    layoutBlocks(data).forEach((block) => drawBlock(doc, block));

    doc.save('business-model-canvas.pdf');
}
