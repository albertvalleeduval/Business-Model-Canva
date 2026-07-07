// Shared geometry for all export formats (PDF, PNG, PPTX): one source of
// truth so every format renders the exact same A4 landscape layout, in mm.

export const PAGE_W = 297;
export const PAGE_H = 210;
export const MARGIN = 8;
export const TITLE_AREA = 12;
export const BLOCK_PAD = 3.5;
export const TITLE_TO_BODY = 7;
export const LINE_HEIGHT = 1.4;
export const PT_TO_MM = 0.3528;
export const MAX_FONT = 10;
export const MIN_FONT = 5.5;

export const SLATE_300 = [203, 213, 225];
export const SLATE_600 = [71, 85, 105];
export const SLATE_800 = [30, 41, 59];
export const SLATE_50 = [248, 250, 252];

// The top section gets 65% of the height, the costs/revenues band 35% —
// like the original Strategyzer template, whose bottom band is much
// shorter than the main section (a 50/50 split leaves it mostly empty).
export const TOP_RATIO = 0.65;

export function layoutBlocks(data) {
    const gridY = MARGIN + TITLE_AREA;
    const gridH = PAGE_H - MARGIN - gridY;
    const topH = gridH * TOP_RATIO;
    const bottomH = gridH - topH;
    const colW = (PAGE_W - 2 * MARGIN) / 5;
    const col = (i) => MARGIN + i * colW;

    return [
        { x: col(0), y: gridY, w: colW, h: topH, title: 'Key Partners', text: data.key_partners || '' },
        { x: col(1), y: gridY, w: colW, h: topH / 2, title: 'Key Activities', text: data.key_activities || '' },
        { x: col(1), y: gridY + topH / 2, w: colW, h: topH / 2, title: 'Key Resources', text: data.key_resources || '' },
        { x: col(2), y: gridY, w: colW, h: topH, title: 'Value Propositions', text: data.value_propositions || '', highlight: true },
        { x: col(3), y: gridY, w: colW, h: topH / 2, title: 'Customer Relationships', text: data.customer_relationships || '' },
        { x: col(3), y: gridY + topH / 2, w: colW, h: topH / 2, title: 'Channels', text: data.channels || '' },
        { x: col(4), y: gridY, w: colW, h: topH, title: 'Customer Segments', text: data.customer_segments || '' },
        { x: col(0), y: gridY + topH, w: 2 * colW, h: bottomH, title: 'Cost Structure', text: data.cost_structure || '' },
        { x: col(2), y: gridY + topH, w: 3 * colW, h: bottomH, title: 'Revenue Streams', text: data.revenue_streams || '' },
    ];
}
