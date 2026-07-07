import {
    PAGE_W,
    PAGE_H,
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

// Renders the same mm-based layout as the PDF onto a Canvas 2D surface.
// SCALE is px per mm: 8 → 2376×1680 (~203 dpi), crisp enough for slides.
const SCALE = 8;
const FONT_FAMILY = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;
const mm = (v) => v * SCALE;
const fontPx = (pt) => pt * PT_TO_MM * SCALE;

// Word-wrap that honors explicit newlines, mirroring jsPDF splitTextToSize
function wrapText(ctx, text, maxWidth) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (!words.length) {
            lines.push('');
            continue;
        }
        let line = words[0];
        for (const word of words.slice(1)) {
            if (ctx.measureText(`${line} ${word}`).width <= maxWidth) {
                line += ` ${word}`;
            } else {
                lines.push(line);
                line = word;
            }
        }
        lines.push(line);
    }
    return lines;
}

function fitText(ctx, text, maxWidth, maxHeight) {
    for (let size = MAX_FONT; size >= MIN_FONT; size -= 0.5) {
        ctx.font = `${fontPx(size)}px ${FONT_FAMILY}`;
        const lines = wrapText(ctx, text, maxWidth);
        if (lines.length * fontPx(size) * LINE_HEIGHT <= maxHeight) {
            return { size, lines };
        }
    }
    ctx.font = `${fontPx(MIN_FONT)}px ${FONT_FAMILY}`;
    return { size: MIN_FONT, lines: wrapText(ctx, text, maxWidth) };
}

function drawBlock(ctx, { x, y, w, h, title, text, highlight }) {
    if (highlight) {
        ctx.fillStyle = rgb(SLATE_50);
        ctx.fillRect(mm(x), mm(y), mm(w), mm(h));
    }
    ctx.strokeStyle = rgb(SLATE_300);
    ctx.lineWidth = mm(0.2);
    ctx.strokeRect(mm(x), mm(y), mm(w), mm(h));

    ctx.fillStyle = rgb(SLATE_600);
    ctx.font = `bold ${fontPx(7)}px ${FONT_FAMILY}`;
    ctx.fillText(title.toUpperCase(), mm(x + BLOCK_PAD), mm(y + BLOCK_PAD + 2.5));

    if (!text.trim()) return;

    ctx.fillStyle = rgb(SLATE_800);
    const bodyY = y + BLOCK_PAD + TITLE_TO_BODY;
    const { size, lines } = fitText(
        ctx,
        text,
        mm(w - 2 * BLOCK_PAD),
        mm(h - (bodyY - y) - BLOCK_PAD)
    );
    const lineStep = fontPx(size) * LINE_HEIGHT;
    lines.forEach((line, i) => {
        ctx.fillText(line, mm(x + BLOCK_PAD), mm(bodyY) + fontPx(size) + i * lineStep);
    });
}

export function renderCanvasImage(data) {
    const canvas = document.createElement('canvas');
    canvas.width = mm(PAGE_W);
    canvas.height = mm(PAGE_H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = rgb(SLATE_800);
    ctx.font = `bold ${fontPx(16)}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('Business Model Canvas', mm(PAGE_W / 2), mm(MARGIN + 7));
    ctx.textAlign = 'left';

    layoutBlocks(data).forEach((block) => drawBlock(ctx, block));

    return canvas;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function exportToPNG(data) {
    renderCanvasImage(data).toBlob((blob) => {
        downloadBlob(blob, 'business-model-canvas.png');
    }, 'image/png');
}
