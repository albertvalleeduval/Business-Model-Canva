import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function EditableBlock({
    title,
    value,
    onChange,
    className = '',
    minFontSize = 10,
    maxFontSize = 16
}) {
    const textareaRef = useRef(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

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

        setFontSize(currentSize);
    }, [value, minFontSize, maxFontSize]);

    // Run synchronously after DOM update to catch initial render
    useLayoutEffect(() => {
        adjustFontSize();
    }, [adjustFontSize]);

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
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 resize-none outline-none text-slate-800 leading-relaxed overflow-hidden w-full"
                style={{
                    fontSize: `${fontSize}px`,
                    minHeight: '100%'
                }}
                placeholder="Enter text here..."
            />
        </div>
    );
}
