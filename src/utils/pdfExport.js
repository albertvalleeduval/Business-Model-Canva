import html2pdf from 'html2pdf.js';

function replaceTextareasWithDivs(element) {
    const textareas = element.querySelectorAll('textarea');
    const restoreFns = [];

    textareas.forEach((textarea) => {
        const div = document.createElement('div');
        // Copy computed styles
        const computed = window.getComputedStyle(textarea);
        div.style.cssText = textarea.style.cssText;
        div.style.fontSize = computed.fontSize;
        div.style.fontFamily = computed.fontFamily;
        div.style.lineHeight = computed.lineHeight;
        div.style.color = computed.color;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordBreak = 'break-word';
        div.style.overflowWrap = 'break-word';
        div.style.flex = '1';
        div.style.minHeight = '100%';
        div.className = textarea.className;
        div.textContent = textarea.value;

        textarea.parentNode.insertBefore(div, textarea);
        textarea.style.display = 'none';

        restoreFns.push(() => {
            textarea.style.display = '';
            div.remove();
        });
    });

    return () => restoreFns.forEach((fn) => fn());
}

export async function exportToPDF(elementId = 'bmc-canvas') {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error('Canvas element not found');
    }

    const options = {
        margin: 0,
        filename: 'business-model-canvas.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
            scale: 4,
            useCORS: true,
            letterRendering: true,
            logging: false,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape',
            compress: true
        },
        pagebreak: { mode: 'avoid-all' }
    };

    const restore = replaceTextareasWithDivs(element);
    try {
        await html2pdf().set(options).from(element).save();
    } catch (error) {
        throw new Error('Failed to generate PDF: ' + error.message);
    } finally {
        restore();
    }
}
