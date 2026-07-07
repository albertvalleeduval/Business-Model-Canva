import { jsPDF } from 'jspdf';

// Programmatic A4 landscape export: the 9-block Strategyzer layout is drawn
// directly into the PDF (vector text, exact geometry), so clicking Export
// downloads a file immediately — no print dialog, no DOM rasterization.

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 8;
const TITLE_AREA = 12;
const BLOCK_PAD = 3.5;
const TITLE_TO_BODY = 7;
const LINE_HEIGHT = 1.4;
const PT_TO_MM = 0.3528;
const MAX_FONT = 10;
const MIN_FONT = 5.5;

const SLATE_300 = [203, 213, 225];
const SLATE_600 = [71, 85, 105];
const SLATE_800 = [30, 41, 59];
const SLATE_50 = [248, 250, 252];

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

    const gridY = MARGIN + TITLE_AREA;
    const gridH = PAGE_H - MARGIN - gridY;
    const rowH = gridH / 2;
    const colW = (PAGE_W - 2 * MARGIN) / 5;
    const col = (i) => MARGIN + i * colW;

    const blocks = [
        { x: col(0), y: gridY, w: colW, h: rowH, title: 'Key Partners', text: data.key_partners || '' },
        { x: col(1), y: gridY, w: colW, h: rowH / 2, title: 'Key Activities', text: data.key_activities || '' },
        { x: col(1), y: gridY + rowH / 2, w: colW, h: rowH / 2, title: 'Key Resources', text: data.key_resources || '' },
        { x: col(2), y: gridY, w: colW, h: rowH, title: 'Value Propositions', text: data.value_propositions || '', highlight: true },
        { x: col(3), y: gridY, w: colW, h: rowH / 2, title: 'Customer Relationships', text: data.customer_relationships || '' },
        { x: col(3), y: gridY + rowH / 2, w: colW, h: rowH / 2, title: 'Channels', text: data.channels || '' },
        { x: col(4), y: gridY, w: colW, h: rowH, title: 'Customer Segments', text: data.customer_segments || '' },
        { x: col(0), y: gridY + rowH, w: 2 * colW, h: rowH, title: 'Cost Structure', text: data.cost_structure || '' },
        { x: col(2), y: gridY + rowH, w: 3 * colW, h: rowH, title: 'Revenue Streams', text: data.revenue_streams || '' },
    ];

    blocks.forEach((block) => drawBlock(doc, block));

    doc.save('business-model-canvas.pdf');
}
