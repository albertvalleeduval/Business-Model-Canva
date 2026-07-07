import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export default function EditableBlock({
    title,
    value,
    onChange,
    className = '',
    minFontSize = 10,
    maxFontSize = 16
}) {
    const textareaRef = useRef(null);
    const printRef = useRef(null);

    const adjustFontSize = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea || textarea.clientHeight === 0) return;

        let currentSize = maxFontSize;
        textarea.style.fontSize = `${currentSize}px`;

        while (
            (textarea.scrollHeight > textarea.clientHeight ||
                textarea.scrollWidth > textarea.clientWidth) &&
            currentSize > minFontSize
        ) {
            currentSize -= 0.5;
            textarea.style.fontSize = `${currentSize}px`;
        }

        // Keep the print mirror at the same size as the live textarea
        if (printRef.current) {
            printRef.current.style.fontSize = `${currentSize}px`;
        }
    }, [minFontSize, maxFontSize]);

    // Run synchronously after DOM update to catch initial render
    useLayoutEffect(() => {
        adjustFontSize();
    }, [adjustFontSize, value]);

    // ResizeObserver: recalcule quand le conteneur obtient ses vraies dimensions
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const observer = new ResizeObserver(() => {
            adjustFontSize();
        });
        observer.observe(textarea);

        return () => observer.disconnect();
    }, [adjustFontSize]);

    return (
        <div className={`relative border border-slate-200 bg-white p-4 flex flex-col ${className}`}>
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex-shrink-0">
                {title}
            </h3>
            {/* No min-height here: flex-1 alone must size the textarea, so it
                occupies exactly the same box as the print mirror below —
                otherwise the auto-scaler measures more room than print has */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bmc-screen-input flex-1 resize-none outline-none text-slate-800 leading-relaxed overflow-hidden w-full min-h-0"
                placeholder="Enter text here..."
            />
            {/* Static mirror shown only when printing (textareas don't print reliably) */}
            <div
                ref={printRef}
                className="bmc-print-text hidden flex-1 min-h-0 text-slate-800 leading-relaxed overflow-hidden whitespace-pre-wrap"
            >
                {value}
            </div>
        </div>
    );
}
