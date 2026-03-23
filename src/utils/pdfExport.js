import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportToPDF(elementId = 'bmc-canvas') {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Canvas element not found');

    // Clone the element so we never touch the real DOM
    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.width = element.offsetWidth + 'px';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);

    // Replace textareas in clone with divs containing their text
    const originalTextareas = element.querySelectorAll('textarea');
    const cloneTextareas = clone.querySelectorAll('textarea');

    cloneTextareas.forEach((ta, i) => {
        const original = originalTextareas[i];
        const cs = window.getComputedStyle(original);
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
        div.textContent = original.value;
        ta.replaceWith(div);
    });

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
