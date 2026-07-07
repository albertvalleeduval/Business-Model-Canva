import Pptxgen from 'pptxgenjs';
import { PAGE_W, PAGE_H } from './exportLayout';
import { renderCanvasImage } from './imageExport';

// One ready-to-use 16:9 slide with the canvas centered on it — made for the
// business-school workflow: open, copy the slide into your deck, done.
export function exportToPPTX(data) {
    const image = renderCanvasImage(data).toDataURL('image/png');

    const pptx = new Pptxgen();
    pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches

    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    // Fit the A4 landscape canvas (ratio 297:210) to the slide height
    const slideW = 10;
    const slideH = 5.625;
    const imgH = slideH;
    const imgW = imgH * (PAGE_W / PAGE_H);
    slide.addImage({
        data: image,
        x: (slideW - imgW) / 2,
        y: 0,
        w: imgW,
        h: imgH,
    });

    return pptx.writeFile({ fileName: 'business-model-canvas.pptx' });
}
