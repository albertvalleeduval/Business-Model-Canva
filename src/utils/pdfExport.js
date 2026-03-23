import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// html2canvas doesn't support oklch() (Tailwind v4) — inline rgb() computed colors first
function inlineColors(element) {
    const els = [element, ...element.querySelectorAll('*')];
    els.forEach(el => {
        const cs = window.getComputedStyle(el);
        el.style.color = cs.color;
        el.style.backgroundColor = cs.backgroundColor;
        el.style.borderColor = cs.borderColor;
        el.style.borderTopColor = cs.borderTopColor;
        el.style.borderRightColor = cs.borderRightColor;
        el.style.borderBottomColor = cs.borderBottomColor;
        el.style.borderLeftColor = cs.borderLeftColor;
    });
}

export async function exportToPDF(elementId = 'bmc-canvas') {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Canvas element not found');

    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.width = element.offsetWidth + 'px';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);

    // Replace textareas with divs (html2canvas can't read textarea content)
    const originalTextareas = element.querySelectorAll('textarea');
    clone.querySelectorAll('textarea').forEach((ta, i) => {
        const cs = window.getComputedStyle(originalTextareas[i]);
        const div = document.createElement('div');
        div.style.fontSize = cs.fontSize;
        div.style.fontFamily = cs.fontFamily;
        div.style.lineHeight = cs.lineHeight;
        div.style.color = cs.color;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordBreak = 'break-word';
        div.style.flex = '1';
        div.style.overflow = 'hidden';
        div.className = ta.className;
        div.textContent = originalTextareas[i].value;
        ta.replaceWith(div);
    });

    // Inline all computed colors to avoid oklch() parsing errors
    inlineColors(clone);

    try {
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const imgW = canvas.width * ratio;
        const imgH = canvas.height * ratio;

        pdf.addImage(imgData, 'JPEG', (pdfW - imgW) / 2, (pdfH - imgH) / 2, imgW, imgH);
        pdf.save('business-model-canvas.pdf');
    } finally {
        document.body.removeChild(clone);
    }
}
